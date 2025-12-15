import Link from 'next/link';

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="py-6 border-b border-gray-200">
        <div className="container mx-auto px-6 max-w-[1100px]">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="text-[1.4rem] font-bold tracking-tight text-[#3b82f6]"
            >
              goalaris
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-[0.65rem] text-[#1e293b] text-sm font-semibold rounded-[10px] transition-all duration-200 hover:bg-[#eff6ff]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-[0.65rem] bg-[#3b82f6] text-white text-sm font-semibold rounded-[10px] transition-all duration-200 hover:bg-[#2563eb]"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 max-w-[800px] py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Join the Waitlist
          </h1>
          <p className="text-[#64748b] text-lg">
            Be among the first to experience AI-powered career coaching.
          </p>
        </div>

        {/* Embedded Google Form */}
        <div className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSecrDKYly6QRscuAoZ56Qp9kFdEVhLA6gbfZ4WtQKIMx0Oldg/viewform?embedded=true"
            width="100%"
            height="800"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="w-full"
          >
            Loading…
          </iframe>
        </div>
      </main>
    </div>
  );
}
