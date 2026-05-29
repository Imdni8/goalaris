import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressFillVariants = cva('h-full rounded-full transition-all duration-150 ease-out', {
  variants: {
    tone: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: { tone: 'primary' },
});

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof progressFillVariants> {
  /** Current value, 0–100. Clamped. */
  value: number;
  /**
   * Optional marker rendered above the fill at the same horizontal position.
   * Use this for velocity icons, milestone flags, etc. The marker sits in a
   * higher stacking layer than the fill so it never bleeds through.
   */
  marker?: React.ReactNode;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, tone, marker, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn('relative h-2 w-full overflow-visible rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn(progressFillVariants({ tone }))}
          style={{ width: `${clamped}%` }}
        />
        {marker && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${clamped}%` }}
          >
            {marker}
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress, progressFillVariants };
