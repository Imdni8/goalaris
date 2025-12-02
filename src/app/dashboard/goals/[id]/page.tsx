import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DeleteGoalButton from '@/components/goals/delete-goal-button';
import TaskList from '@/components/tasks/task-list';
import GenerateTasksButton from '@/components/tasks/generate-tasks-button';
import TaskProgressChart from '@/components/goals/task-progress-chart';

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single();

  if (error || !goal) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('goal_id', goal.id)
    .order('order_index', { ascending: true });

  // Calculate task completion stats
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
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
          {goal.description && <p className="text-gray-600">{goal.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/goals/${goal.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <DeleteGoalButton goalId={goal.id} />
        </div>
      </div>

      {/* Progress Overview */}
      {totalTasks > 0 && (
        <div className="card mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Progress Overview</h2>
          <TaskProgressChart
            totalTasks={totalTasks}
            completedTasks={completedTasks}
            size="lg"
            showLabel={true}
          />
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTasks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-green-600">{completedTasks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-semibold text-blue-600">{totalTasks - completedTasks}</p>
            </div>
          </div>
        </div>
      )}

      {/* SMART Breakdown */}
      {(goal.specific || goal.measurable || goal.achievable || goal.relevant || goal.time_bound) && (
        <div className="card mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">SMART Breakdown</h2>
          <div className="space-y-4">
            {goal.specific && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">Specific</h3>
                <p className="text-gray-900">{goal.specific}</p>
              </div>
            )}
            {goal.measurable && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">Measurable</h3>
                <p className="text-gray-900">{goal.measurable}</p>
              </div>
            )}
            {goal.achievable && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">Achievable</h3>
                <p className="text-gray-900">{goal.achievable}</p>
              </div>
            )}
            {goal.relevant && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">Relevant</h3>
                <p className="text-gray-900">{goal.relevant}</p>
              </div>
            )}
            {goal.time_bound && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">Time-bound</h3>
                <p className="text-gray-900">
                  Target Date: {new Date(goal.time_bound).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
          <div className="flex gap-2">
            <GenerateTasksButton goalId={goal.id} />
            <Link href={`/dashboard/goals/${goal.id}/tasks/new`}>
              <Button size="sm">+ Add Task</Button>
            </Link>
          </div>
        </div>

        <TaskList goalId={goal.id} tasks={tasks || []} />
      </div>
    </div>
  );
}
