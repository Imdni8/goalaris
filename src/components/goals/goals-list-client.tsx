'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import GoalListCard, { GoalListCardData } from './goal-list-card';

interface GoalsListClientProps {
  goals: GoalListCardData[];
  availableYears: number[];
  defaultYear: number;
}

export default function GoalsListClient({
  goals: initialGoals,
  availableYears,
  defaultYear,
}: GoalsListClientProps) {
  const supabase = createClient();
  const router = useRouter();

  const [goals, setGoals] = useState(initialGoals);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<number>(defaultYear);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = goals;
    list = list.filter((g) => {
      if (!g.time_bound) return false;
      const d = new Date(g.time_bound);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === year;
    });
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.description ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [goals, query, year]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (!selectMode) setSelectMode(true);
    },
    [selectMode]
  );

  const exitSelectMode = useCallback(() => {
    setSelected(new Set());
    setSelectMode(false);
    setDeleteError(null);
  }, []);

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((g) => g.id)));
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    setDeleteError(null);
    const ids = Array.from(selected);
    const { error } = await supabase.from('goals').delete().in('id', ids);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    setGoals((prev) => prev.filter((g) => !selected.has(g.id)));
    setSelected(new Set());
    setSelectMode(false);
    setConfirmOpen(false);
    router.refresh();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmOpen) setConfirmOpen(false);
      else if (selectMode) exitSelectMode();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmOpen, selectMode, exitSelectMode]);

  const visibleSelectedCount = filtered.reduce(
    (n, g) => n + (selected.has(g.id) ? 1 : 0),
    0
  );

  return (
    <div className="text-[#1a1d21]">
      <header className="mb-[22px] flex flex-col gap-[18px]">
        <div className="inline-flex items-center gap-[14px]">
          <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em] text-[#1a1d21]">
            Goals
          </h1>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Year"
              className="cursor-pointer appearance-none rounded-lg border border-[#e4e6ea] bg-white py-[7px] pl-3 pr-8 text-[14px] font-medium tabular-nums text-[#1a1d21] transition-colors hover:border-[#d6dadf] focus:border-[#2f7a54] focus:shadow-[0_0_0_3px_#ecf5f0] focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#8a909a]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          <div className="relative basis-[320px]">
            <span
              className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-[#8a909a]"
              aria-hidden
            >
              <Search size={14} strokeWidth={1.5} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search goals…"
              aria-label="Search goals"
              className="w-full rounded-lg border border-[#e4e6ea] bg-white py-2 pl-8 pr-7 text-[13px] text-[#1a1d21] outline-none transition-[border-color,box-shadow] placeholder:text-[#8a909a] focus:border-[#2f7a54] focus:shadow-[0_0_0_3px_#ecf5f0]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-[6px] top-1/2 inline-flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded text-[#8a909a] hover:bg-[#f2f3f5] hover:text-[#1a1d21]"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="flex-1" />

          {selectMode ? (
            <div className="bulk-fade-in inline-flex items-center gap-[10px] text-[13px] text-[#4a5058]">
              <span className="tabular-nums">
                <strong className="mr-1 font-semibold text-[#1a1d21]">
                  {selected.size}
                </strong>
                selected
              </span>
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={visibleSelectedCount === filtered.length}
                className="rounded-md px-[6px] py-1 text-[13px] font-medium text-[#2f7a54] transition-colors hover:bg-[#ecf5f0] disabled:cursor-not-allowed disabled:text-[#c1c5cc] disabled:hover:bg-transparent"
              >
                Select all {filtered.length}
              </button>
              <span className="h-5 w-px bg-[#e4e6ea]" />
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selected.size === 0}
                className="inline-flex items-center gap-[6px] rounded-lg border border-[#b3261e] bg-[#b3261e] px-3 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-[#921c16] disabled:cursor-not-allowed disabled:border-[#e8c2bf] disabled:bg-[#e8c2bf]"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Delete
              </button>
              <button
                type="button"
                onClick={exitSelectMode}
                className="rounded-lg border border-transparent bg-transparent px-3 py-[7px] text-[13px] font-medium text-[#1a1d21] hover:bg-[#f2f3f5]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              title="Toggle multi-select"
              className="inline-flex items-center gap-[6px] rounded-lg border border-[#e4e6ea] bg-white px-3 py-[7px] text-[13px] font-medium text-[#1a1d21] transition-colors hover:border-[#d6dadf] hover:bg-[#f7f8f9]"
            >
              <Check size={14} strokeWidth={2} />
              Select
            </button>
          )}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e4e6ea] bg-white px-6 py-12 text-center text-[13.5px] text-[#8a909a]">
          <strong className="mb-1 block text-[15px] font-semibold text-[#1a1d21]">
            {goals.length === 0
              ? 'No goals yet'
              : 'No goals match your filters'}
          </strong>
          {goals.length === 0
            ? 'Create your first goal to start tracking your career progress.'
            : 'Try clearing the search or switching the year.'}
          {goals.length === 0 && (
            <div className="mt-4">
              <Link
                href="/dashboard/goals/new-ai"
                className="inline-flex items-center gap-[6px] rounded-lg border border-[#1a1d21] bg-[#1a1d21] px-3 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-black"
              >
                <Plus size={14} strokeWidth={1.6} />
                Create your first goal
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GoalListCard
              key={g.id}
              goal={g}
              selected={selected.has(g.id)}
              selectMode={selectMode}
              onToggleSelect={toggleSelect}
              query={query}
            />
          ))}
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,22,26,0.4)] p-6"
          onClick={() => !deleting && setConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="w-[420px] max-w-full rounded-xl bg-white p-[20px_22px_16px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="confirm-title"
              className="m-0 mb-[6px] text-[17px] font-semibold text-[#1a1d21]"
            >
              Delete {selected.size} goal{selected.size === 1 ? '' : 's'}?
            </h3>
            <p className="m-0 mb-[18px] text-[13.5px] leading-[1.5] text-[#4a5058]">
              This will remove the selected goal{selected.size === 1 ? '' : 's'} along
              with all generated tasks. You can&apos;t undo this.
            </p>
            {deleteError && (
              <p className="mb-[12px] text-[12.5px] text-[#b3261e]">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-[#e4e6ea] bg-white px-3 py-[7px] text-[13px] font-medium text-[#1a1d21] hover:bg-[#f7f8f9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-[6px] rounded-lg border border-[#b3261e] bg-[#b3261e] px-3 py-[7px] text-[13px] font-medium text-white hover:bg-[#921c16] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .bulk-fade-in {
          animation: bulkFadeIn 160ms ease;
        }
        @keyframes bulkFadeIn {
          from {
            opacity: 0;
            transform: translateY(-2px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
