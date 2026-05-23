'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-heading text-destructive">Dashboard Error</h2>
          <p className="text-muted-foreground">
            Something went wrong while loading the dashboard.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Reload Dashboard
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mt-4 text-left text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Error details (dev only)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
