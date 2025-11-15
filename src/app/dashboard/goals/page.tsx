import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*, tasks(count)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="mt-2 text-gray-600">Create and manage your annual goals</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/goals/new-ai">
            <Button variant="outline">✨ Create with AI</Button>
          </Link>
          <Link href="/dashboard/goals/new">
            <Button>+ Manual Entry</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          Error loading goals: {error.message}
        </div>
      )}

      {goals && goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
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
                    Target: {new Date(goal.time_bound).toLocaleDateString()}
                  </div>
                )}

                <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>{goal.tasks?.[0]?.count || 0} tasks</span>
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
