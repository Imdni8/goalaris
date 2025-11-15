import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import KanbanBoard from '@/components/tasks/kanban-board';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Fetch all tasks from active goals
  const activeGoalIds = goals?.filter((g) => g.status === 'active').map((g) => g.id) || [];
  const { data: tasks } = activeGoalIds.length > 0
    ? await supabase
        .from('tasks')
        .select('*')
        .in('goal_id', activeGoalIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile?.full_name || 'Professional'}!
        </h1>
        <p className="mt-2 text-gray-600">Track your annual goals and prepare for self-assessment</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="mb-2 text-sm font-medium text-gray-600">Total Goals</div>
          <div className="text-3xl font-bold text-gray-900">{goals?.length || 0}</div>
        </div>
        <div className="card">
          <div className="mb-2 text-sm font-medium text-gray-600">Active Goals</div>
          <div className="text-3xl font-bold text-blue-600">
            {goals?.filter((g) => g.status === 'active').length || 0}
          </div>
        </div>
        <div className="card">
          <div className="mb-2 text-sm font-medium text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {goals?.filter((g) => g.status === 'completed').length || 0}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {tasks && tasks.length > 0 && (
        <KanbanBoard
          initialTasks={tasks}
          goals={goals?.filter((g) => g.status === 'active') || []}
        />
      )}
    </div>
  );
}
