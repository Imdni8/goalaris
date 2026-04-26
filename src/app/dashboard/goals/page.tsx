import { createClient } from '@/lib/supabase/server';
import GoalsListClient from '@/components/goals/goals-list-client';
import { GoalListCardData } from '@/components/goals/goal-list-card';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals, error } = await supabase
    .from('goals')
    .select('id, title, description, status, time_bound, tasks(id, status, month)')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = MONTH_LABELS[now.getMonth()];

  const cards: GoalListCardData[] = (goals ?? []).map((g: any) => {
    const tasks = (g.tasks ?? []) as Array<{
      status: string | null;
      month: string | null;
    }>;
    const monthTasks = tasks.filter((t) => t.month === currentMonthKey);
    const done = monthTasks.filter((t) => t.status === 'completed').length;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      time_bound: g.time_bound,
      monthTasks: {
        done,
        total: monthTasks.length,
        label: currentMonthLabel,
      },
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
