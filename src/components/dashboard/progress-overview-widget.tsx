/**
 * Progress Overview Widget
 * Async server fetcher — pulls dashboard data from Supabase and delegates rendering
 * to ProgressOverviewWidgetView. See progress-overview-widget-view.tsx for the UI.
 */

import { createClient } from '@/lib/supabase/server';
import ProgressOverviewWidgetView, {
  type GoalNeedingAttention,
} from './progress-overview-widget-view';

interface ProgressOverviewWidgetProps {
  userId: string;
}

export default async function ProgressOverviewWidget({ userId }: ProgressOverviewWidgetProps) {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, status, tasks(id, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);

  const { data: actionLogs } = await supabase
    .from('action_logs')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', yearStart.toISOString())
    .order('created_at', { ascending: false });

  const { data: blockerData } = await supabase
    .from('action_logs')
    .select('task_id, blocker_status')
    .eq('user_id', userId)
    .eq('blocker_status', 'active');

  const totalGoals = goals?.length || 0;

  let totalTasks = 0;
  let completedTasks = 0;
  const goalProgress: GoalNeedingAttention[] = [];

  goals?.forEach(goal => {
    const tasks = goal.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;

    totalTasks += total;
    completedTasks += completed;

    if (total > 0) {
      goalProgress.push({
        id: goal.id,
        title: goal.title,
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
      });
    }
  });

  const goalsNeedingAttention = goalProgress
    .filter(g => g.percentage < 100)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  const overallCompletionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activityByDate = new Map<string, number>();
  actionLogs?.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
  });

  const heatmapData = Array.from(activityByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const activeBlockerCount = blockerData?.length || 0;
  const totalActions = actionLogs?.length || 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7DaysActions =
    actionLogs?.filter(log => new Date(log.created_at) >= sevenDaysAgo).length || 0;

  return (
    <ProgressOverviewWidgetView
      totalGoals={totalGoals}
      overallCompletionPercentage={overallCompletionPercentage}
      totalTasks={totalTasks}
      completedTasks={completedTasks}
      totalActions={totalActions}
      last7DaysActions={last7DaysActions}
      activeBlockerCount={activeBlockerCount}
      heatmapData={heatmapData}
      goalsNeedingAttention={goalsNeedingAttention}
    />
  );
}
