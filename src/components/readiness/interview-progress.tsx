'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type CompetencyAxis,
  type EvidenceStrength,
  STRENGTH_RANK,
  COVERED_MIN_RANK,
} from '@/lib/ai/agents/diagnosis/types';

/**
 * Persistent coverage timeline shown above the assessment interview.
 *
 * The interview is a free-flowing chat that can run long, so this gives the user
 * a constant sense of progress. State is driven by the per-competency evidence
 * strength the server merges each turn (monotonic — a pill never regresses):
 *  - covered: real evidence (self-report or corroborated) → green check
 *  - noted:   probed but no evidence found (strength "none") → settled gap
 *  - current: the competency being probed right now
 *  - pending: not yet probed
 */
export function InterviewProgress({
  competencies,
  strengths,
  focusKey,
}: {
  competencies: CompetencyAxis[];
  strengths: Record<string, EvidenceStrength>;
  focusKey: string | null;
}) {
  const stateOf = (key: string): 'covered' | 'noted' | 'current' | 'pending' => {
    const s = strengths[key];
    if (s) return STRENGTH_RANK[s] >= COVERED_MIN_RANK ? 'covered' : 'noted';
    return key === focusKey ? 'current' : 'pending';
  };

  const total = competencies.length;
  // Both covered and noted are "settled" — the coach is done with them.
  const settledCount = competencies.filter((c) => Boolean(strengths[c.key])).length;
  const remaining = total - settledCount;

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-caption font-medium text-foreground">Assessment progress</p>
        <p className="text-caption text-muted-foreground">
          {settledCount} of {total} assessed
          {remaining > 0 && ` · ${remaining} to go`}
        </p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {competencies.map((c) => {
          const state = stateOf(c.key);
          return (
            <li
              key={c.key}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption transition-colors',
                state === 'covered' && 'border-success/40 bg-success/15 text-success',
                state === 'noted' && 'border-border bg-muted text-muted-foreground line-through decoration-1',
                state === 'current' &&
                  'border-primary bg-primary/10 font-medium text-primary ring-1 ring-primary/30',
                state === 'pending' && 'border-border bg-muted text-muted-foreground',
              )}
            >
              {state === 'covered' ? (
                <Check className="size-3.5 shrink-0" aria-hidden />
              ) : state === 'noted' ? (
                <Minus className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    state === 'current' ? 'animate-pulse bg-primary' : 'bg-muted-foreground/40',
                  )}
                  aria-hidden
                />
              )}
              <span>{c.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
