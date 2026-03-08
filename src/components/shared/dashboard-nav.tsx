import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import UserProfileMenu from './user-profile-menu';
import NavLink from './nav-link';

export default async function DashboardNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/goals', label: 'Goals' },
    { href: '/dashboard/self-assessment', label: 'Assessments' },
    { href: '/dashboard/coach', label: 'Coach' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  // Get user initials for avatar
  const getInitials = (fullName: string | null) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            goalaris
          </Link>

          {/* Center Navigation Tabs */}
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>

          {/* Right side: Create Goal Button + User Profile */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/goals/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create new goal
              </Button>
            </Link>

            {/* User Profile Menu */}
            <UserProfileMenu
              user={user}
              profile={profile}
              userInitials={getInitials(profile?.full_name)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
