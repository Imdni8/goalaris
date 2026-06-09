'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/**
 * Curated target roles for tech ICs (design / product / engineering).
 * The combobox narrows this list as the user types, but free text is allowed
 * so anyone whose exact title isn't here can still type it in.
 */
export const ROLE_GROUPS: { category: string; roles: string[] }[] = [
  {
    category: 'Product Management',
    roles: [
      'Associate Product Manager',
      'Product Manager',
      'Senior Product Manager',
      'Staff Product Manager',
      'Principal Product Manager',
      'Technical Product Manager',
      'Growth Product Manager',
      'Platform Product Manager',
    ],
  },
  {
    category: 'Design',
    roles: [
      'Product Designer',
      'Senior Product Designer',
      'Staff Product Designer',
      'Principal Product Designer',
      'UX Designer',
      'UX Researcher',
      'Senior UX Researcher',
      'Interaction Designer',
      'Visual Designer',
      'Content Designer',
      'Design Systems Designer',
    ],
  },
  {
    category: 'Engineering',
    roles: [
      'Software Engineer',
      'Senior Software Engineer',
      'Staff Software Engineer',
      'Senior Staff Software Engineer',
      'Principal Engineer',
      'Frontend Engineer',
      'Backend Engineer',
      'Full-Stack Engineer',
      'Mobile Engineer',
      'Data Engineer',
      'Machine Learning Engineer',
      'Site Reliability Engineer',
      'DevOps Engineer',
      'Security Engineer',
      'Platform Engineer',
    ],
  },
];

export function RoleCombobox({
  value,
  onChange,
  placeholder = 'Select or type a target role…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { groups, flat } = useMemo(() => {
    const q = value.trim().toLowerCase();
    const groups = ROLE_GROUPS.map((g) => ({
      category: g.category,
      roles: q ? g.roles.filter((r) => r.toLowerCase().includes(q)) : g.roles,
    })).filter((g) => g.roles.length > 0);
    const flat = groups.flatMap((g) => g.roles);
    return { groups, flat };
  }, [value]);

  const select = (role: string) => {
    onChange(role);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && flat[active]) {
        e.preventDefault();
        select(flat[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // delay so an option's mousedown can register before we close
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />

      {open && flat.length > 0 && (
        <div
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-background p-1 shadow-md"
          onMouseDown={(e) => {
            // keep focus on the input; prevents the blur-close race
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {groups.map((g) => (
            <div key={g.category}>
              <p className="px-2 pb-1 pt-2 text-caption text-muted-foreground">{g.category}</p>
              {g.roles.map((role) => {
                const idx = flat.indexOf(role);
                return (
                  <button
                    type="button"
                    key={role}
                    onClick={() => select(role)}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      'block w-full rounded-sm px-2 py-1.5 text-left text-body text-foreground',
                      idx === active ? 'bg-muted' : 'hover:bg-muted',
                    )}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
