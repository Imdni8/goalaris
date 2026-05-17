import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCoachNote } from '@/lib/ai/claude';
import {
  calculateProgressPct,
  getDaysElapsed,
  getDaysInMonth,
} from '@/lib/progress/calculate';
import type { VelocityState } from '@/lib/progress/types';

const ZERO_STATE_TEXT = 'Complete a task to see your progress here.';

function isPersistableState(s: string): s is 'AHEAD' | 'STEADY' | 'LAGGING' {
  return s === 'AHEAD' || s === 'STEADY' || s === 'LAGGING';
}

function formatMonthName(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId');
  const month = searchParams.get('month');
  const state = searchParams.get('state');

  if (!goalId || !month || !state) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  if (state === 'ZERO') {
    return NextResponse.json({ note_text: ZERO_STATE_TEXT, cta_text: null });
  }

  if (!isPersistableState(state)) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: row } = await supabase
    .from('goal_progress_notes')
    .select('note_text, cta_text, generated_at')
    .eq('goal_id', goalId)
    .eq('month', month)
    .eq('velocity_state', state)
    .maybeSingle();

  // Cache miss returns 200 with null body so the client can decide whether
  // to POST without producing a noisy 404 in the network tab.
  if (!row) return NextResponse.json({ note_text: null, cta_text: null });

  return NextResponse.json(row);
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { goalId, month, state } = body as {
      goalId?: string;
      month?: string;
      state?: VelocityState;
    };

    if (!goalId || !month || !state) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    if (state === 'ZERO') {
      return NextResponse.json({ note_text: ZERO_STATE_TEXT, cta_text: null });
    }

    if (!isPersistableState(state)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY is not set' },
        { status: 500 }
      );
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id, title, description, specific, time_bound')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Cache hit: return existing
    const { data: cached } = await supabase
      .from('goal_progress_notes')
      .select('note_text, cta_text, generated_at')
      .eq('goal_id', goalId)
      .eq('month', month)
      .eq('velocity_state', state)
      .maybeSingle();
    if (cached) return NextResponse.json(cached);

    // Gather AI context: month tasks, prior state, month objective.
    const { data: monthTasks } = await supabase
      .from('tasks')
      .select('status, task_value')
      .eq('goal_id', goalId)
      .eq('month', month);

    const { data: allTasks } = await supabase
      .from('tasks')
      .select('status, task_value')
      .eq('goal_id', goalId);

    const tasks = monthTasks ?? [];
    const tasksTotal = tasks.filter((t) => t.status !== 'dropped').length;
    const tasksCompleted = tasks.filter(
      (t) => t.status === 'done' || t.status === 'completed'
    ).length;

    const progressPct = calculateProgressPct(allTasks ?? []);

    const today = new Date();
    const daysInMonth = getDaysInMonth(month);
    const daysElapsed = getDaysElapsed(month, today);
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

    // Resolve month objective: prefer per-month summary, fall back to SMART specific.
    const { data: summaryRow } = await supabase
      .from('goal_month_summaries')
      .select('summary')
      .eq('goal_id', goalId)
      .eq('month', month)
      .maybeSingle();
    const monthObjective = summaryRow?.summary || goal.specific || goal.description || '';

    // Most-recent prior note for this (goal, month) — gives us prev_velocity_state.
    const { data: prevRow } = await supabase
      .from('goal_progress_notes')
      .select('velocity_state, generated_at')
      .eq('goal_id', goalId)
      .eq('month', month)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { note, cta } = await generateCoachNote({
      goalTitle: goal.title,
      goalDescription: goal.description || '',
      currentMonthName: formatMonthName(month),
      monthObjective,
      progressPct,
      velocityState: state,
      tasksCompleted,
      tasksTotal,
      daysElapsed,
      daysRemaining,
      prevVelocityState: prevRow?.velocity_state ?? null,
    });

    const { data: inserted, error: insertError } = await supabase
      .from('goal_progress_notes')
      .upsert(
        {
          goal_id: goalId,
          month,
          velocity_state: state,
          note_text: note,
          cta_text: cta,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'goal_id,month,velocity_state' }
      )
      .select('note_text, cta_text, generated_at')
      .single();

    if (insertError) {
      console.error('[coach-note] Upsert error:', insertError);
      return NextResponse.json({ note_text: note, cta_text: cta });
    }

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('[coach-note] Unexpected error:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate coach note',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
