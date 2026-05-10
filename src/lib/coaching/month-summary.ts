import type { SupabaseClient } from '@supabase/supabase-js';
import { generateMonthSummary } from '@/lib/ai/claude';

/**
 * Read or lazily generate a per-month summary for a goal.
 * Returns null if there's no activity worth summarizing.
 *
 * Called by both the in-goal-coach chat endpoint (server-side, fills gaps before
 * building context) and the explicit summarize-month route.
 */
export async function ensureMonthSummary(
  supabase: SupabaseClient,
  goalId: string,
  month: string,
  goalTitle: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('goal_month_summaries')
    .select('summary')
    .eq('goal_id', goalId)
    .eq('month', month)
    .maybeSingle();

  if (existing?.summary) return existing.summary;

  // Gather data for this month
  const [tasksRes, logsRes, msgsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, blocker_description, completion_note')
      .eq('goal_id', goalId)
      .eq('month', month),
    supabase
      .from('action_logs')
      .select('title, description, blocker_description, task_id, tasks!inner(goal_id)')
      .eq('tasks.goal_id', goalId)
      .gte('created_at', `${month}-01`)
      .lt('created_at', nextMonthIso(month)),
    supabase
      .from('messages')
      .select('content, conversations!inner(goal_id)')
      .eq('conversations.goal_id', goalId)
      .eq('role', 'assistant')
      .gte('created_at', `${month}-01`)
      .lt('created_at', nextMonthIso(month))
      .limit(10),
  ]);

  const tasks = (tasksRes.data || []) as Array<{
    title: string;
    status: string | null;
    blocker_description: string | null;
    completion_note: string | null;
  }>;
  const logs = (logsRes.data || []) as Array<{
    title: string;
    description: string | null;
    blocker_description: string | null;
  }>;
  const messages = (msgsRes.data || []) as Array<{ content: string }>;

  if (tasks.length === 0 && logs.length === 0 && messages.length === 0) {
    return null;
  }

  const summary = await generateMonthSummary({
    goalTitle,
    month,
    tasks,
    logs,
    assistantMessages: messages.map((m) => m.content),
  });

  // Best-effort insert; if a concurrent request inserted first, ON CONFLICT will swallow.
  await supabase
    .from('goal_month_summaries')
    .upsert({ goal_id: goalId, month, summary }, { onConflict: 'goal_id,month' });

  return summary;
}

function nextMonthIso(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const next = new Date(Date.UTC(y, m, 1)); // m is 1-based; Date constructor is 0-based, so this lands on month+1
  return next.toISOString().slice(0, 10);
}

/**
 * Find prior months (< currentMonth) that have task activity for this goal.
 */
export async function findPriorMonthsWithActivity(
  supabase: SupabaseClient,
  goalId: string,
  currentMonth: string
): Promise<string[]> {
  const { data } = await supabase
    .from('tasks')
    .select('month')
    .eq('goal_id', goalId)
    .not('month', 'is', null)
    .lt('month', currentMonth);

  const months = new Set<string>();
  (data || []).forEach((row: any) => {
    if (row.month) months.add(row.month);
  });
  return Array.from(months).sort();
}
