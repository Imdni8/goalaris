'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/goals', label: 'Goals' },
    { href: '/dashboard/self-assessment', label: 'Self-Assessment' },
    { href: '/dashboard/coach', label: 'Coach' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            goalaris
          </Link>

          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  isActive(item.href)
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-red-600 hover:text-red-700">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
