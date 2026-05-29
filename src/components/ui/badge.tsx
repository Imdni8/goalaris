import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium leading-none',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        default: 'px-2 py-0.5 text-xs',
      },
      shape: {
        pill: '',
        // emoji-only is a small opaque chip designed to sit on top of other
        // surfaces (e.g. a progress bar) without bleeding through. The
        // colored border carries the semantic; the background stays opaque.
        marker: 'border-2 bg-surface px-1.5 py-px',
      },
    },
    compoundVariants: [
      { shape: 'marker', variant: 'default', class: 'border-border' },
      { shape: 'marker', variant: 'primary', class: 'border-primary/40' },
      { shape: 'marker', variant: 'success', class: 'border-success/40' },
      { shape: 'marker', variant: 'warning', class: 'border-warning/40' },
      { shape: 'marker', variant: 'destructive', class: 'border-destructive/40' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'pill',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
