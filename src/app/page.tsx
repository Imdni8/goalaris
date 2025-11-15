import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b border-gray-200 bg-white bg-opacity-50 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">goalaris</div>
            <div className="flex gap-4">
              <Link href="/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 md:text-6xl">
            Your AI Career Coach
          </h1>
          <p className="mt-6 text-lg text-gray-700 md:text-xl">
            Track your annual goals, log progress, and prepare for self-assessments with
            AI-powered insights.
          </p>

          <div className="mt-10 flex justify-center gap-6">
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
            <Link href="#features" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </div>

        <section id="features" className="mt-32">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Smart Goals',
                description: 'Create SMART goals with AI guidance for clarity and accountability',
              },
              {
                title: 'Goal Breakdown',
                description: 'AI transforms goals into actionable, trackable tasks',
              },
              {
                title: 'Progress Tracking',
                description: 'Log your actions and automatically prepare self-assessments',
              },
            ].map((feature) => (
              <div key={feature.title} className="card">
                <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
