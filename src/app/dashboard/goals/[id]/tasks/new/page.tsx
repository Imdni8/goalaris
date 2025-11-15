import CreateTaskForm from '@/components/tasks/create-task-form';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function NewTaskPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify goal exists and belongs to user
  const { data: goal, error } = await supabase
    .from('goals')
    .select('id, title')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single();

  if (error || !goal) {
    notFound();
  }

  // Get next order_index
  const { data: tasks } = await supabase
    .from('tasks')
    .select('order_index')
    .eq('goal_id', goal.id)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrderIndex = tasks && tasks.length > 0 ? tasks[0].order_index + 1 : 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add Task</h1>
        <p className="mt-2 text-gray-600">
          For goal: <span className="font-medium">{goal.title}</span>
        </p>
      </div>

      <div className="card">
        <CreateTaskForm goalId={goal.id} nextOrderIndex={nextOrderIndex} />
      </div>
    </div>
  );
}
