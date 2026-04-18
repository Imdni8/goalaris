import { createClient } from '@/lib/supabase/server';
import WeeklyPlanner from '@/components/tasks/weekly-planner';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch all tasks from active goals for the current week ±2 weeks
  const activeGoalIds = goals?.filter((g) => g.status === 'active').map((g) => g.id) || [];

  // Calculate date range: current week ±14 days
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);

  const rangeStart = new Date(monday);
  rangeStart.setDate(rangeStart.getDate() - 14);
  const rangeEnd = new Date(monday);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  const rangeStartStr = rangeStart.toISOString().split('T')[0];
  const rangeEndStr = rangeEnd.toISOString().split('T')[0];

  const { data: tasks } = activeGoalIds.length > 0
    ? await supabase
        .from('tasks')
        .select('*')
        .in('goal_id', activeGoalIds)
        .gte('due_date', rangeStartStr)
        .lte('due_date', rangeEndStr)
        .order('due_date', { ascending: true })
    : { data: [] };

  return (
    <WeeklyPlanner
      initialTasks={tasks || []}
      goals={goals?.filter((g) => g.status === 'active') || []}
    />
  );
}
