import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AssessmentGenerator from '@/components/assessment/assessment-generator';

export default async function SelfAssessmentPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's goals with action log counts
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      id,
      title,
      status,
      created_at,
      tasks (
        id,
        action_logs (
          id
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Transform goals to include action log count
  const goalsWithCounts = goals?.map(goal => {
    const actionLogCount = goal.tasks?.reduce((count: number, task: any) => {
      return count + (task.action_logs?.length || 0);
    }, 0) || 0;

    return {
      id: goal.id,
      title: goal.title,
      status: goal.status,
      created_at: goal.created_at,
      actionLogCount,
    };
  }) || [];

  // Fetch saved assessments
  const { data: savedAssessments } = await supabase
    .from('assessments')
    .select('id, title, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-display">Self-Assessment Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate a professional self-assessment summary from your goals and progress logs
        </p>
      </div>

      <AssessmentGenerator
        goals={goalsWithCounts}
        savedAssessments={savedAssessments || []}
        userId={user.id}
      />
    </div>
  );
}
