import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GoalSmartCard from '@/components/goals/goal-smart-card';
import MonthlyTaskBoard from '@/components/tasks/monthly-task-board';

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
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/dashboard/goals" className="text-sm text-gray-600 hover:text-gray-900">
            &lt; Back
          </Link>
          <button className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1">
            &lt; coach
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left sidebar: Goal card */}
          <aside className="w-72 flex-shrink-0">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <GoalSmartCard goal={goal} />
            </div>
          </aside>

          {/* Main area: Tasks */}
          <main className="flex-1 min-w-0">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Tasks</h2>
              <MonthlyTaskBoard
                goalId={goal.id}
                currentMonth={goal.current_month}
                monthsGenerated={goal.months_generated || []}
                tasks={tasks || []}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
