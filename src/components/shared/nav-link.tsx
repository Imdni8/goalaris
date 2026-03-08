'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  label: string;
}

export default function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();

  const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <Link href={href} className="flex flex-col justify-center h-16">
      <span
        className={`text-sm font-medium transition-colors border-b-2 ${
          isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
