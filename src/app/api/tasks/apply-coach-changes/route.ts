import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { snapToWeekdayInRange } from '@/lib/utils/weekdays';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

interface ApplyChange {
  type: 'add' | 'edit' | 'delete' | 'break_down';
  taskId?: string;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  subtasks?: Array<{
    title: string;
    description?: string | null;
    due_date?: string | null;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_GENERATION.limit,
      RATE_LIMITS.AI_GENERATION.windowMs
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const { goalId, changes } = await request.json();

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json({ error: 'Invalid input: goalId is required' }, { status: 400 });
    }
    if (!Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Invalid input: changes must be an array' },
        { status: 400 }
      );
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    const currentMonth: string = goal.current_month || new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10);
    const monthStart = `${currentMonth}-01`;
    const monthEnd = new Date(Date.UTC(year, monthIdx, 0)).toISOString().slice(0, 10);

    // Verify ownership of every referenced taskId in one pass.
    const referencedTaskIds = (changes as ApplyChange[])
      .map((c) => c.taskId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    let validTaskIds = new Set<string>();
    if (referencedTaskIds.length > 0) {
      const { data: validRows } = await supabase
        .from('tasks')
        .select('id')
        .eq('goal_id', goalId)
        .in('id', referencedTaskIds);
      validTaskIds = new Set((validRows || []).map((r) => r.id));
    }

    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: false })
      .limit(1);
    let nextOrderIndex = (existingTasks?.[0]?.order_index || 0) + 1;

    const newTasksToInsert: any[] = [];
    let added = 0;
    let edited = 0;
    let deleted = 0;
    let brokenDown = 0;

    for (const change of changes as ApplyChange[]) {
      if (!change || typeof change !== 'object') continue;

      if (change.type === 'add' && change.title) {
        const due = change.due_date
          ? snapToWeekdayInRange(change.due_date, monthStart, monthEnd)
          : null;
        newTasksToInsert.push({
          goal_id: goalId,
          title: change.title,
          description: change.description || null,
          due_date: due,
          month: currentMonth,
          status: 'todo',
          order_index: nextOrderIndex++,
          ai_generated: true,
          is_manual: false,
          reschedule_count: 0,
        });
        added++;
      } else if (
        change.type === 'edit' &&
        change.taskId &&
        validTaskIds.has(change.taskId)
      ) {
        const updates: Record<string, any> = {};
        if (change.title !== undefined) updates.title = change.title;
        if (change.description !== undefined) updates.description = change.description;
        if (change.due_date !== undefined) {
          updates.due_date = change.due_date
            ? snapToWeekdayInRange(change.due_date, monthStart, monthEnd)
            : null;
        }
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', change.taskId);
          if (!error) edited++;
          else console.error('[apply-coach-changes] edit failed:', error);
        }
      } else if (
        change.type === 'delete' &&
        change.taskId &&
        validTaskIds.has(change.taskId)
      ) {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'dropped', updated_at: new Date().toISOString() })
          .eq('id', change.taskId);
        if (!error) deleted++;
        else console.error('[apply-coach-changes] delete failed:', error);
      } else if (
        change.type === 'break_down' &&
        change.taskId &&
        validTaskIds.has(change.taskId) &&
        Array.isArray(change.subtasks) &&
        change.subtasks.length > 0
      ) {
        const { error: dropError } = await supabase
          .from('tasks')
          .update({ status: 'dropped', updated_at: new Date().toISOString() })
          .eq('id', change.taskId);
        if (dropError) {
          console.error('[apply-coach-changes] break_down drop failed:', dropError);
          continue;
        }
        for (const sub of change.subtasks) {
          if (!sub || !sub.title) continue;
          const due = sub.due_date
            ? snapToWeekdayInRange(sub.due_date, monthStart, monthEnd)
            : null;
          newTasksToInsert.push({
            goal_id: goalId,
            title: sub.title,
            description: sub.description || null,
            due_date: due,
            month: currentMonth,
            status: 'todo',
            order_index: nextOrderIndex++,
            ai_generated: true,
            is_manual: false,
            reschedule_count: 0,
          });
        }
        brokenDown++;
      }
    }

    if (newTasksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(newTasksToInsert);
      if (insertError) {
        console.error('[apply-coach-changes] insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert new tasks', details: insertError.message },
          { status: 500 }
        );
      }
    }

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'goal_coach_tasks_modified',
      properties: {
        goal_id: goalId,
        month: currentMonth,
        added,
        edited,
        deleted,
        broken_down: brokenDown,
      },
    });

    return NextResponse.json({
      success: true,
      added,
      edited,
      deleted,
      brokenDown,
    });
  } catch (error) {
    console.error('[apply-coach-changes] error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
