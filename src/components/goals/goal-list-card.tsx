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
        className="rounded-sm bg-success/20 px-px text-success"
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
  AHEAD: 'border-success/40 bg-success/10',
  STEADY: 'border-primary/40 bg-primary/10',
  LAGGING: 'border-destructive/40 bg-destructive/10',
};

const VELOCITY_BAR_FILL: Record<VelocityState, string> = {
  ZERO: 'bg-primary',
  AHEAD: 'bg-success',
  STEADY: 'bg-primary',
  LAGGING: 'bg-destructive',
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
    <div className="mt-0.5 flex items-center gap-2 border-t border-border pt-2.5">
      <div className="relative h-2 flex-1 overflow-visible rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-150 ease-out ${VELOCITY_BAR_FILL[state]}`}
          style={{ width: `${clampedPct}%` }}
        />
        {state !== 'ZERO' && (
          <span
            className={`absolute top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border-2 px-1.5 py-px text-xs leading-none ${VELOCITY_BADGE_CLS[state]}`}
            style={{ left: `${clampedPct}%` }}
            aria-hidden
          >
            {VELOCITY_EMOJI[state]}
          </span>
        )}
      </div>
      <span className="shrink-0 text-caption tabular-nums">
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
    'group relative flex cursor-pointer select-none flex-col gap-3 rounded-lg border bg-surface p-4 transition-shadow duration-150',
    selected
      ? 'border-success shadow-md ring-1 ring-success'
      : 'border-border hover:border-muted-foreground hover:shadow-md',
  ].join(' ');

  const inner = (
    <>
      <header
        className="flex items-start justify-between gap-2.5"
        style={{ minHeight: 22 }}
      >
        <h3
          className="m-0 line-clamp-2 overflow-hidden text-title text-foreground"
          style={{ textWrap: 'balance' }}
        >
          {highlight(goal.title, query)}
        </h3>
      </header>

      <p className="m-0 line-clamp-2 flex-1 overflow-hidden text-sm leading-snug text-muted-foreground">
        {goal.description ? highlight(goal.description, query) : ''}
      </p>

      <div className="inline-flex items-center gap-1.5 text-caption tabular-nums">
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
        style={{ minHeight: 196 }}
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
      style={{ minHeight: 196 }}
    >
      {inner}
    </Link>
  );
}
