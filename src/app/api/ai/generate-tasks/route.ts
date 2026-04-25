import { createClient } from '@/lib/supabase/server';
import { generateTaskBreakdown } from '@/lib/ai/claude';
import { trackEvent } from '@/lib/analytics';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

// "2026-04" → "April 2026"
function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, 1))
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Snap `date` to the nearest weekday (Mon–Fri) inside [start, end].
// Walks backward first, then forward. Returns null if no weekday exists in range.
function snapToWeekdayInRange(date: string, start: string, end: string): string | null {
  const startD = new Date(`${start}T00:00:00.000Z`);
  const endD = new Date(`${end}T00:00:00.000Z`);
  const target = new Date(`${date}T00:00:00.000Z`);
  const clamped = new Date(Math.min(endD.getTime(), Math.max(startD.getTime(), target.getTime())));

  const isWeekday = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;

  const back = new Date(clamped);
  while (back >= startD) {
    if (isWeekday(back)) return back.toISOString().slice(0, 10);
    back.setUTCDate(back.getUTCDate() - 1);
  }
  const fwd = new Date(clamped);
  fwd.setUTCDate(fwd.getUTCDate() + 1);
  while (fwd <= endD) {
    if (isWeekday(fwd)) return fwd.toISOString().slice(0, 10);
    fwd.setUTCDate(fwd.getUTCDate() + 1);
  }
  return null;
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

    // Rate limiting
    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_GENERATION.limit,
      RATE_LIMITS.AI_GENERATION.windowMs
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const { goalId, acceptNextMonth } = await request.json();

    if (!goalId) {
      return NextResponse.json({ error: 'Invalid input: goalId is required' }, { status: 400 });
    }

    // Compute today + current month in UTC.
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);

    // Current-month window: today → last day of current month.
    let startDate = today.toISOString().slice(0, 10);
    const currentLastDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    let endDate = currentLastDay.toISOString().slice(0, 10);
    let targetMonth = currentMonth;

    // If no weekdays remain in the current month, ask the user to confirm
    // generating for next month instead.
    if (!snapToWeekdayInRange(endDate, startDate, endDate)) {
      if (!acceptNextMonth) {
        const nextMonthFirst = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
        const proposedMonth = nextMonthFirst.toISOString().slice(0, 7);
        return NextResponse.json({
          needsConfirmation: true,
          reason: 'no_weekdays_left',
          proposedMonth,
          currentMonthLabel: formatMonthLabel(currentMonth),
          proposedMonthLabel: formatMonthLabel(proposedMonth),
        });
      }

      // User confirmed — switch the window to the full next month.
      const nextMonthFirst = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
      const nextMonthLast = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0));
      targetMonth = nextMonthFirst.toISOString().slice(0, 7);
      startDate = nextMonthFirst.toISOString().slice(0, 10);
      endDate = nextMonthLast.toISOString().slice(0, 10);
    }

    // Fetch the goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Generate task breakdown using Gemini, bounded to [startDate, endDate]
    const taskBreakdown = await generateTaskBreakdown({
      title: goal.title,
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      time_bound: goal.time_bound || '',
    }, { startDate, endDate });

    // Get current max order_index for this goal
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: false })
      .limit(1);

    const startOrderIndex = existingTasks && existingTasks.length > 0
      ? existingTasks[0].order_index + 1
      : 0;

    // Insert generated tasks. Snap any weekend due_date the model returned
    // back to the most recent weekday on or before it, clamped to startDate.
    const tasksToInsert = taskBreakdown.map((task, index) => ({
      goal_id: goalId,
      title: task.title,
      description: task.description,
      due_date: task.due_date ? snapToWeekdayInRange(task.due_date, startDate, endDate) : null,
      month: targetMonth,
      status: 'pending' as const,
      order_index: task.order_index !== undefined ? task.order_index : startOrderIndex + index,
      ai_generated: true,
      is_manual: false,
      reschedule_count: 0,
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('Task insertion error:', insertError);
      return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 });
    }

    // Update goal's current_month and months_generated
    const { data: currentGoal } = await supabase
      .from('goals')
      .select('months_generated')
      .eq('id', goalId)
      .single();

    const existingMonths = currentGoal?.months_generated || [];
    const updatedMonths = existingMonths.includes(targetMonth)
      ? existingMonths
      : [...existingMonths, targetMonth].sort();

    await supabase
      .from('goals')
      .update({
        current_month: targetMonth,
        months_generated: updatedMonths,
      })
      .eq('id', goalId);

    // Log the AI interaction
    await supabase.from('ai_interactions').insert([
      {
        user_id: user.id,
        interaction_type: 'task_breakdown',
        goal_id: goalId,
        prompt: `Generate tasks for goal: ${goal.title} (Month: ${targetMonth})`,
        response: JSON.stringify(taskBreakdown),
      },
    ]);

    // Track tasks_generated event
    await trackEvent('tasks_generated', {
      goalId,
      month: targetMonth,
      count: insertedTasks?.length || 0,
    }, user.id);

    return NextResponse.json({
      tasks: insertedTasks,
    });
  } catch (error) {
    console.error('AI Task Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks. Please try again.' },
      { status: 500 }
    );
  }
}
