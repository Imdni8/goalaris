import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditGoalForm from '@/components/goals/edit-goal-form';

export default async function EditGoalPage({ params }: { params: { id: string } }) {
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-display">Edit Goal</h1>
        <p className="mt-2 text-gray-600">Update your goal details</p>
      </div>

      <div className="card">
        <EditGoalForm goal={goal} />
      </div>
    </div>
  );
}
