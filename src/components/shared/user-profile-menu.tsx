'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfileMenuProps {
  user: User;
  profile: any;
  userInitials: string;
}

export default function UserProfileMenu({ user, profile, userInitials }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition-opacity hover:opacity-80"
      >
        <Avatar className="h-9 w-9 bg-blue-100">
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          {/* User Info Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="font-medium text-gray-900">{profile?.full_name || 'User'}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <form action="/api/auth/logout" method="POST" className="w-full">
              <button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
