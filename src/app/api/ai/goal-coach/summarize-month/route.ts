import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ensureMonthSummary } from '@/lib/coaching/month-summary';

// POST /api/ai/goal-coach/summarize-month
// Body: { goal_id, month: 'YYYY-MM' }
// Idempotent: returns existing summary or generates+stores if missing.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id: goalId, month } = await request.json();

    if (!goalId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Missing or invalid goal_id / month (expected YYYY-MM)' },
        { status: 400 }
      );
    }

    const { data: goal } = await supabase
      .from('goals')
      .select('id, title, user_id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const summary = await ensureMonthSummary(supabase, goalId, month, goal.title);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[goal-coach/summarize-month] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
