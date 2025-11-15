import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

      <div className="mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Goals</h2>
          <Link href="/dashboard/goals">
            <Button>Create Goal</Button>
          </Link>
        </div>

        {goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <Link key={goal.id} href={`/dashboard/goals/${goal.id}`}>
                <div className="card cursor-pointer transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {goal.description || 'No description'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
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
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-600">No goals yet. Create your first goal to get started!</p>
            <Link href="/dashboard/goals">
              <Button className="mt-4">Create Goal</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
