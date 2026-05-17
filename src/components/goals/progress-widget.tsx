'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  calculateProgressPct,
  calculateVelocity,
  getMonthWeight,
} from '@/lib/progress/calculate';
import type {
  MonthWeight,
  ProgressTask,
  VelocityState,
} from '@/lib/progress/types';

interface ProgressWidgetProps {
  goalId: string;
  currentMonth: string | null;
  monthWeights: MonthWeight[] | null | undefined;
  tasks: ProgressTask[];
  onOpenCoach: (seed: { tasksRemaining: number; daysRemaining: number }) => void;
}

const BADGE_STYLE: Record<Exclude<VelocityState, 'ZERO'>, { label: string; cls: string }> = {
  AHEAD: { label: '🚀 Ahead', cls: 'bg-[#d8ecdf] text-[#2f7a54]' },
  STEADY: { label: '🧘 Steady', cls: 'bg-[#dde7f5] text-[#2c5aa0]' },
  LAGGING: { label: '🏃 Lagging', cls: 'bg-[#f8dcdc] text-[#a82a2a]' },
};

const BODY_ARTWORK: Record<Exclude<VelocityState, 'ZERO'>, string> = {
  AHEAD: '/progress/ahead.png',
  STEADY: '/progress/steady.png',
  LAGGING: '/progress/lagging.png',
};

// Untitled UI 700-shades — the exact tokens used by the Figma Progress
// component (utility-success-700, blue-700, utility-error-700).
const VELOCITY_BAR_FILL: Record<VelocityState, string> = {
  ZERO: 'bg-[#175cd3]',
  AHEAD: 'bg-[#067647]',
  STEADY: 'bg-[#175cd3]',
  LAGGING: 'bg-[#b42318]',
};

function VelocityBadge({ state }: { state: VelocityState }) {
  if (state === 'ZERO') return null;
  const cfg = BADGE_STYLE[state];
  return (
    <span
      className={`inline-flex items-center rounded-full px-[10px] py-[3px] text-[11.5px] font-medium leading-[1.4] ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export default function ProgressWidget({
  goalId,
  currentMonth,
  monthWeights,
  tasks,
  onOpenCoach,
}: ProgressWidgetProps) {
  const [expanded, setExpanded] = useState(true);

  const { pct, velocity } = useMemo(() => {
    const pct = calculateProgressPct(tasks);
    if (!currentMonth) {
      return {
        pct,
        velocity: {
          state: 'ZERO' as const,
          paceRatio: null,
          expectedProgress: 0,
          actualProgress: 0,
          tasksCompletedThisMonth: 0,
          tasksTotalThisMonth: 0,
          daysElapsed: 0,
          daysInMonth: 30,
          daysRemaining: 0,
        },
      };
    }
    const monthWeight = getMonthWeight(monthWeights ?? [], currentMonth);
    return {
      pct,
      velocity: calculateVelocity({
        tasks,
        currentMonth,
        monthWeight,
        today: new Date(),
      }),
    };
  }, [tasks, currentMonth, monthWeights]);

  const state = velocity.state;

  // Coach note state — fetched/cached per (goalId, month, state).
  const [noteText, setNoteText] = useState<string | null>(null);
  const [ctaText, setCtaText] = useState<string | null>(null);
  // Tracks the state for which we have a successfully fetched AI note. Reset
  // whenever the page (re-)mounts. We re-fire generation whenever progress
  // changes until this matches the current state — that catches both clean
  // state transitions AND ticks that happen while the static zero-state copy
  // is still showing (e.g., first tick of the month, or after a failed fetch).
  const successfulFetchStateRef = useRef<VelocityState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentMonth) return;

    if (state === 'ZERO') {
      setNoteText('Complete a task to see your progress here.');
      setCtaText(null);
      successfulFetchStateRef.current = null;
      return;
    }

    if (successfulFetchStateRef.current === state) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Clear stale text so the "Coach is thinking…" placeholder takes over
    // while the AI note is being fetched/generated.
    setNoteText(null);
    setCtaText(null);

    const params = new URLSearchParams({ goalId, month: currentMonth, state });
    fetch(`/api/ai/coach-note?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setNoteText(json.note_text ?? null);
          setCtaText(json.cta_text ?? null);
          successfulFetchStateRef.current = state;
          return;
        }
        if (res.status !== 404) throw new Error('coach-note GET failed');
        // Cache miss → generate.
        const post = await fetch('/api/ai/coach-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId, month: currentMonth, state }),
          signal: controller.signal,
        });
        if (!post.ok) throw new Error('coach-note POST failed');
        const json = await post.json();
        setNoteText(json.note_text ?? null);
        setCtaText(json.cta_text ?? null);
        successfulFetchStateRef.current = state;
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error('[progress-widget] coach note error', err);
      });

    return () => controller.abort();
  }, [goalId, currentMonth, state, pct]);

  const handleCta = () => {
    onOpenCoach({
      tasksRemaining: Math.max(
        0,
        velocity.tasksTotalThisMonth - velocity.tasksCompletedThisMonth
      ),
      daysRemaining: velocity.daysRemaining,
    });
  };

  return (
    <aside className="rounded-[10px] border border-[#e4e6ea] bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-t-[10px] px-3 py-[10px] text-left hover:bg-[#f7f8fa]"
      >
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1a1d21]">
          {expanded ? (
            <ChevronDown size={14} strokeWidth={1.6} className="opacity-70" />
          ) : (
            <ChevronRight size={14} strokeWidth={1.6} className="opacity-70" />
          )}
          Progress
        </span>
        <VelocityBadge state={state} />
      </button>

      {expanded && (
        <div className="space-y-3 px-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e4e6ea]">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ease-out ${VELOCITY_BAR_FILL[state]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[12px] tabular-nums font-medium text-[#4a5058]">
              {pct}%
            </span>
          </div>

          <div
            className="relative overflow-hidden rounded-md bg-[#eaf3ff] p-3 text-[13px] leading-[1.5] text-[#1a1d21]"
          >
            {state !== 'ZERO' && (
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-2 -right-2 h-[120px] w-[140px] bg-contain bg-right-bottom bg-no-repeat opacity-60"
                style={{ backgroundImage: `url(${BODY_ARTWORK[state]})` }}
              />
            )}
            <div className="relative">
              <div className="mb-1 text-[12px] font-semibold text-[#1a1d21]">
                Coach&apos;s note
              </div>
              <p className="m-0 whitespace-pre-wrap text-[#4a5058]">
                {noteText ??
                  (state === 'ZERO'
                    ? 'Complete a task to see your progress here.'
                    : 'Coach is thinking…')}
              </p>
              {state === 'LAGGING' && ctaText && (
                <button
                  type="button"
                  onClick={handleCta}
                  className="mt-2 text-[13px] font-semibold text-[#2563eb] hover:underline"
                >
                  {ctaText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
