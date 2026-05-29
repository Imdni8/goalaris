import React from 'react';
import { cn } from '@/lib/utils';

export interface MarkProps extends React.HTMLAttributes<HTMLElement> {}

const Mark = React.forwardRef<HTMLElement, MarkProps>(
  ({ className, ...props }, ref) => (
    <mark
      ref={ref}
      className={cn('rounded-sm bg-primary/20 px-px text-primary', className)}
      {...props}
    />
  )
);
Mark.displayName = 'Mark';

/**
 * highlightMatches splits `text` on case-insensitive occurrences of `query`
 * and wraps each match in a <Mark>. Returns the original text if `query` is empty.
 */
export function highlightMatches(text: string | null, query: string): React.ReactNode {
  if (!text) return null;
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(qLower, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<Mark key={key++}>{text.slice(idx, idx + q.length)}</Mark>);
    i = idx + q.length;
  }
  return <>{parts}</>;
}

export { Mark };
