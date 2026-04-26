'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { ReactNode } from 'react';

export interface GoalListCardData {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  time_bound: string | null;
  monthTasks: { done: number; total: number; label: string };
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

function StatusChip({ status }: { status: string | null }) {
  const isDone = status === 'completed';
  const isArchived = status === 'archived';
  if (isDone) {
    return (
      <span className="inline-flex items-center gap-[6px] rounded-full bg-[#e6e8ec] px-[10px] py-[3px] text-[11.5px] font-medium leading-[1.4] text-[#4a5058]">
        <span className="h-[6px] w-[6px] rounded-full bg-[#4a5058]" />
        Done
      </span>
    );
  }
  if (isArchived) {
    return (
      <span className="inline-flex items-center gap-[6px] rounded-full bg-[#eef0f3] px-[10px] py-[3px] text-[11.5px] font-medium leading-[1.4] text-[#4a5058]">
        <span className="h-[6px] w-[6px] rounded-full bg-[#8a909a]" />
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-[#d8ecdf] px-[10px] py-[3px] text-[11.5px] font-medium leading-[1.4] text-[#2f7a54]">
      <span className="h-[6px] w-[6px] rounded-full bg-[#2f7a54]" />
      Active
    </span>
  );
}

function MonthProgress({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-[6px] text-[11px] font-medium uppercase tracking-[0.06em] text-[#8a909a]">
        {label} · No tasks
      </span>
    );
  }
  const pct = (done / total) * 100;
  return (
    <div
      className="inline-flex items-center gap-2 text-[11.5px] tabular-nums text-[#4a5058]"
      title={`${done} of ${total} tasks done in ${label}`}
    >
      <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#8a909a]">
        {label}
      </span>
      <div className="h-1 w-16 overflow-hidden rounded-[2px] bg-[#c1c5cc]">
        <div
          className="h-full bg-[#2f7a54] transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-semibold text-[#1a1d21]">
        {done}/{total}
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

      <div className="mt-[2px] flex items-center justify-between gap-2 border-t border-[#eef0f3] pt-[10px]">
        <StatusChip status={goal.status} />
        <MonthProgress
          done={goal.monthTasks.done}
          total={goal.monthTasks.total}
          label={goal.monthTasks.label}
        />
      </div>
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
