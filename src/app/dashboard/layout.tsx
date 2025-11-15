import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              goalaris
            </Link>

            <div className="flex items-center gap-6">
              <Link href="/dashboard/goals" className="text-gray-700 hover:text-gray-900">
                Goals
              </Link>
              <Link href="/dashboard/progress" className="text-gray-700 hover:text-gray-900">
                Progress
              </Link>
              <Link href="/dashboard/insights" className="text-gray-700 hover:text-gray-900">
                Insights
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-red-600 hover:text-red-700">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
