/**
 * Progress Overview Widget
 * Comprehensive dashboard widget showing overall progress, activity, and insights
 */

import ActivityHeatmap from '@/components/shared/activity-heatmap';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface ProgressOverviewWidgetProps {
  userId: string;
}

export default async function ProgressOverviewWidget({ userId }: ProgressOverviewWidgetProps) {
  const supabase = await createClient();

  // Fetch goals with tasks
  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, status, tasks(id, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch action logs for activity heatmap (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: actionLogs } = await supabase
    .from('action_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', ninetyDaysAgo.toISOString())
    .order('logged_at', { ascending: false });

  // Fetch active blockers
  const { data: blockerData } = await supabase
    .from('action_logs')
    .select('task_id, blocker_status')
    .eq('user_id', userId)
    .eq('blocker_status', 'active');

  // Calculate overall stats
  const totalGoals = goals?.length || 0;
  const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
  const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

  // Calculate task stats across all goals
  let totalTasks = 0;
  let completedTasks = 0;
  const goalProgress: Array<{ id: string; title: string; completed: number; total: number; percentage: number }> = [];

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

  // Sort goals by completion percentage (lowest first - needs most attention)
  const goalsNeedingAttention = goalProgress
    .filter(g => g.percentage < 100)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  // Calculate overall completion percentage
  const overallCompletionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Process action logs for heatmap
  const activityByDate = new Map<string, number>();
  actionLogs?.forEach(log => {
    const date = new Date(log.logged_at).toISOString().split('T')[0];
    activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
  });

  const heatmapData = Array.from(activityByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Count active blockers
  const activeBlockerCount = blockerData?.length || 0;

  // Calculate activity stats
  const totalActions = actionLogs?.length || 0;
  const last7DaysActions = actionLogs?.filter(log => {
    const logDate = new Date(log.logged_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return logDate >= sevenDaysAgo;
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress Stats */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Progress</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{totalGoals}</div>
            <div className="text-sm text-gray-600 mt-1">Total Goals</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{overallCompletionPercentage}%</div>
            <div className="text-sm text-gray-600 mt-1">Tasks Complete</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{last7DaysActions}</div>
            <div className="text-sm text-gray-600 mt-1">Recent Actions</div>
            <div className="text-xs text-gray-500 mt-0.5">(Last 7 Days)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{activeBlockerCount}</div>
            <div className="text-sm text-gray-600 mt-1">Active Blockers</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Task Completion</span>
            <span>{completedTasks} / {totalTasks} tasks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Overview</h2>
        <p className="text-sm text-gray-600 mb-4">
          {totalActions} total actions logged in the last 90 days
        </p>
        <ActivityHeatmap data={heatmapData} weeks={12} />
      </div>

      {/* Goals Needing Attention */}
      {goalsNeedingAttention.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals Needing Attention</h2>
          <div className="space-y-3">
            {goalsNeedingAttention.map(goal => (
              <Link key={goal.id} href={`/dashboard/goals/${goal.id}`}>
                <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{goal.title}</h3>
                    <span className={`text-sm font-semibold ${
                      goal.percentage < 30 ? 'text-red-600' :
                      goal.percentage < 60 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {goal.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          goal.percentage < 30 ? 'bg-red-500' :
                          goal.percentage < 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {goal.completed}/{goal.total}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
