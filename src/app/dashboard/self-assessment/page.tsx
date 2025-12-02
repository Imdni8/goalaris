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

  // Fetch user's goals for selection
  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
        <h1 className="text-3xl font-bold text-gray-900">Self-Assessment Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate a professional self-assessment summary from your goals and progress logs
        </p>
      </div>

      <AssessmentGenerator
        goals={goals || []}
        savedAssessments={savedAssessments || []}
        userId={user.id}
      />
    </div>
  );
}
