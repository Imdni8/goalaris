'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { ReactNode } from 'react';
import type { VelocityState } from '@/lib/progress/types';

export interface GoalListCardData {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  time_bound: string | null;
  progress_pct: number;
  velocity_state: VelocityState;
}

interface GoalListCardProps {
  goal: GoalListCardData;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  query: string;
}

function highlight(text: string | null, query: string): ReactNode {
  if (!text) return null;
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(qLower, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={key++}
        className="rounded-sm bg-[#d8ecdf] px-[1px] text-[#2f7a54]"
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function formatTarget(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const VELOCITY_EMOJI: Record<Exclude<VelocityState, 'ZERO'>, string> = {
  AHEAD: '🚀',
  STEADY: '🧘',
  LAGGING: '🏃',
};

const VELOCITY_BADGE_CLS: Record<Exclude<VelocityState, 'ZERO'>, string> = {
  AHEAD: 'border-[#abefc6] bg-[#ecfdf3]',
  STEADY: 'border-[#b2ddff] bg-[#eff8ff]',
  LAGGING: 'border-[#fecdca] bg-[#fef3f2]',
};

// Untitled UI 700-shades — the exact tokens used by the Figma Progress
// component (utility-success-700, blue-700, utility-error-700).
const VELOCITY_BAR_FILL: Record<VelocityState, string> = {
  ZERO: 'bg-[#175cd3]',
  AHEAD: 'bg-[#067647]',
  STEADY: 'bg-[#175cd3]',
  LAGGING: 'bg-[#b42318]',
};

function ProgressFooter({
  pct,
  state,
}: {
  pct: number;
  state: VelocityState;
}) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  return (
    <div className="mt-[2px] flex items-center gap-2 border-t border-[#eef0f3] pt-[10px]">
      <div className="relative h-2 flex-1 overflow-visible rounded-full bg-[#e9eaeb]">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-out ${VELOCITY_BAR_FILL[state]}`}
          style={{ width: `${clampedPct}%` }}
        />
        {state !== 'ZERO' && (
          <span
            className={`absolute top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border-2 px-1.5 py-[1px] text-[12px] leading-none ${VELOCITY_BADGE_CLS[state]}`}
            style={{ left: `${clampedPct}%` }}
            aria-hidden
          >
            {VELOCITY_EMOJI[state]}
          </span>
        )}
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-[#535862]">
        {clampedPct}%
      </span>
    </div>
  );
}

export default function GoalListCard({
  goal,
  selected,
  selectMode,
  onToggleSelect,
  query,
}: GoalListCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (selectMode) {
      e.preventDefault();
      onToggleSelect(goal.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && selectMode) {
      e.preventDefault();
      onToggleSelect(goal.id);
    }
  };

  const cardClass = [
    'group relative flex min-h-[196px] cursor-pointer select-none flex-col gap-3 rounded-[10px] border bg-white p-4 transition-[box-shadow,border-color,transform] duration-[140ms]',
    selected
      ? 'border-[#2f7a54] shadow-[0_0_0_1px_#2f7a54,0_8px_24px_-12px_rgba(47,122,84,0.4)]'
      : 'border-[#e4e6ea] hover:border-[#cfd3d9] hover:shadow-[0_2px_0_rgba(10,10,10,0.02),0_8px_24px_-12px_rgba(10,10,10,0.15)]',
  ].join(' ');

  const inner = (
    <>
      <header className="flex min-h-[22px] items-start justify-between gap-[10px]">
        <h3 className="m-0 line-clamp-2 overflow-hidden text-[15px] font-semibold leading-[1.3] tracking-[-0.005em] text-[#1a1d21] [text-wrap:balance]">
          {highlight(goal.title, query)}
        </h3>
      </header>

      <p className="m-0 line-clamp-2 flex-1 overflow-hidden text-[13px] leading-[1.45] text-[#4a5058]">
        {goal.description ? highlight(goal.description, query) : ''}
      </p>

      <div className="inline-flex items-center gap-[6px] text-[12px] tabular-nums text-[#8a909a]">
        <Calendar size={12} strokeWidth={1.4} className="opacity-85" />
        Target · {formatTarget(goal.time_bound)}
      </div>

      <ProgressFooter pct={goal.progress_pct} state={goal.velocity_state} />
    </>
  );

  if (selectMode) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected ? 'true' : 'false'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cardClass}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/goals/${goal.id}`}
      onClick={handleClick}
      className={cardClass}
    >
      {inner}
    </Link>
  );
}
