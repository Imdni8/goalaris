import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GoalPageClient from '@/components/goals/goal-page-client';

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
    .order('due_date', { ascending: true, nullsFirst: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard/goals" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <GoalPageClient goal={goal} tasks={tasks || []} />
      </div>
    </div>
  );
}
