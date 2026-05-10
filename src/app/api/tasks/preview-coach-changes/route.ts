import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { extractCoachTaskChanges, type CoachTaskChange } from '@/lib/ai/claude';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

const VALID_TYPES = new Set(['add', 'edit', 'delete', 'break_down']);

interface CurrentTask {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
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

    const { goalId, conversationHistory } = await request.json();

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json({ error: 'Invalid input: goalId is required' }, { status: 400 });
    }
    if (!Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Invalid input: conversationHistory must be an array' },
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
    const monthLabel = new Date(year, monthIdx - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const { data: taskRows } = await supabase
      .from('tasks')
      .select('id, title, description, status, due_date')
      .eq('goal_id', goalId)
      .eq('month', currentMonth)
      .order('order_index', { ascending: true });

    const tasks: CurrentTask[] = (taskRows || []) as CurrentTask[];

    const rawChanges = await extractCoachTaskChanges({
      monthLabel,
      monthStart,
      monthEnd,
      currentMonthTasks: tasks,
      conversationHistory,
    });

    const taskById = new Map(tasks.map((t) => [t.id, t]));

    // Validate + enrich. Drop changes that reference unknown tasks.
    const validated: Array<CoachTaskChange & {
      originalTitle?: string;
      originalDescription?: string | null;
      originalDueDate?: string | null;
    }> = [];

    for (const c of rawChanges) {
      if (!c || !VALID_TYPES.has(c.type)) continue;

      if (c.type === 'add') {
        if (!c.title) continue;
        validated.push({
          type: 'add',
          title: c.title,
          description: c.description ?? null,
          due_date: c.due_date ?? null,
        });
      } else if (c.type === 'edit') {
        if (!c.taskId || !taskById.has(c.taskId)) continue;
        const orig = taskById.get(c.taskId)!;
        validated.push({
          type: 'edit',
          taskId: c.taskId,
          title: c.title,
          description: c.description ?? undefined,
          due_date: c.due_date,
          originalTitle: orig.title,
          originalDescription: orig.description,
          originalDueDate: orig.due_date,
        });
      } else if (c.type === 'delete') {
        if (!c.taskId || !taskById.has(c.taskId)) continue;
        const orig = taskById.get(c.taskId)!;
        validated.push({
          type: 'delete',
          taskId: c.taskId,
          originalTitle: orig.title,
          originalDescription: orig.description,
          originalDueDate: orig.due_date,
        });
      } else if (c.type === 'break_down') {
        if (!c.taskId || !taskById.has(c.taskId)) continue;
        if (!Array.isArray(c.subtasks) || c.subtasks.length === 0) continue;
        const orig = taskById.get(c.taskId)!;
        validated.push({
          type: 'break_down',
          taskId: c.taskId,
          subtasks: c.subtasks
            .filter((s) => s && s.title)
            .map((s) => ({
              title: s.title,
              description: s.description ?? null,
              due_date: s.due_date ?? null,
            })),
          originalTitle: orig.title,
          originalDescription: orig.description,
          originalDueDate: orig.due_date,
        });
      }
    }

    return NextResponse.json({
      changes: validated,
      currentMonth,
      monthLabel,
    });
  } catch (error) {
    console.error('[preview-coach-changes] error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
