import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TaskProgressChart from '@/components/goals/task-progress-chart';

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*, tasks(id, status)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Process goals data with task stats and blocker counts
  let goalsWithStats = goals || [];

  if (goals && goals.length > 0) {
    const goalIds = goals.map(g => g.id);

    // Get count of tasks with active blockers per goal
    const { data: blockerData } = await supabase
      .from('tasks')
      .select('goal_id, action_logs!inner(blocker_status)')
      .in('goal_id', goalIds)
      .eq('action_logs.blocker_status', 'active');

    // Count blockers per goal
    const blockerCounts = new Map<string, number>();
    blockerData?.forEach((task: any) => {
      const count = blockerCounts.get(task.goal_id) || 0;
      blockerCounts.set(task.goal_id, count + 1);
    });

    goalsWithStats = goals.map((goal) => {
      const tasks = goal.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

      return {
        ...goal,
        totalTasks,
        completedTasks,
        activeBlockerCount: blockerCounts.get(goal.id) || 0,
      };
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <p className="mt-2 text-gray-600">Create and manage your annual goals</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          Error loading goals: {error.message}
        </div>
      )}

      {goalsWithStats && goalsWithStats.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goalsWithStats.map((goal) => (
            <Link key={goal.id} href={`/dashboard/goals/${goal.id}`}>
              <div className="card group cursor-pointer transition-all hover:shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {goal.title}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      goal.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : goal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>

                {goal.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">{goal.description}</p>
                )}

                {goal.time_bound && (
                  <div className="mb-3 text-xs text-gray-500">
                    Target: {new Date(goal.time_bound).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}

                {/* Task Progress Chart */}
                {goal.totalTasks > 0 && (
                  <div className="mb-3">
                    <TaskProgressChart
                      totalTasks={goal.totalTasks}
                      completedTasks={goal.completedTasks}
                      size="sm"
                      showLabel={true}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>{goal.totalTasks} task{goal.totalTasks !== 1 ? 's' : ''}</span>
                  {goal.activeBlockerCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                      🚫 {goal.activeBlockerCount} blocker{goal.activeBlockerCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {goal.ai_suggested && <span className="text-blue-600">✨ AI</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <div className="mx-auto mb-4 text-5xl">🎯</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No goals yet</h3>
          <p className="mb-6 text-gray-600">
            Create your first goal to start tracking your career progress
          </p>
          <Link href="/dashboard/goals/new">
            <Button>Create Your First Goal</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
