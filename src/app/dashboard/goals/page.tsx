import { createClient } from '@/lib/supabase/server';
import GoalsListClient from '@/components/goals/goals-list-client';
import { GoalListCardData } from '@/components/goals/goal-list-card';
import {
  calculateProgressPct,
  calculateVelocity,
  getMonthWeight,
} from '@/lib/progress/calculate';
import type { MonthWeight, ProgressTask } from '@/lib/progress/types';

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals, error } = await supabase
    .from('goals')
    .select(
      'id, title, description, status, time_bound, current_month, month_weights, tasks(id, status, month, task_value, completed_at)'
    )
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const now = new Date();

  const cards: GoalListCardData[] = (goals ?? []).map((g: any) => {
    const tasks = (g.tasks ?? []) as ProgressTask[];
    const monthWeights = (g.month_weights ?? []) as MonthWeight[];
    const currentMonth: string | null = g.current_month ?? null;

    const progressPct = calculateProgressPct(tasks);
    const velocity = currentMonth
      ? calculateVelocity({
          tasks,
          currentMonth,
          monthWeight: getMonthWeight(monthWeights, currentMonth),
          today: now,
        })
      : { state: 'ZERO' as const };

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      time_bound: g.time_bound,
      progress_pct: progressPct,
      velocity_state: velocity.state,
    };
  });

  const yearsFromGoals = new Set<number>();
  cards.forEach((c) => {
    if (!c.time_bound) return;
    const d = new Date(c.time_bound);
    if (!Number.isNaN(d.getTime())) yearsFromGoals.add(d.getFullYear());
  });
  yearsFromGoals.add(now.getFullYear());
  const availableYears = Array.from(yearsFromGoals).sort((a, b) => b - a);
  const defaultYear = availableYears.includes(now.getFullYear())
    ? now.getFullYear()
    : availableYears[0];

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          Error loading goals: {error.message}
        </div>
      )}
      <GoalsListClient
        goals={cards}
        availableYears={availableYears}
        defaultYear={defaultYear}
      />
    </div>
  );
}
