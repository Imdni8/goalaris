/**
 * EXAMPLE: How to use error handling utilities in components
 *
 * This file demonstrates best practices for handling errors in Goalaris.
 * Copy patterns from here when building new features.
 */

'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/utils/api-error-handler';
import { Button } from '@/components/ui/button';

export default function ExampleErrorHandling() {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useErrorHandler();

  // Example 1: API call with automatic error handling
  async function handleApiCall() {
    setLoading(true);
    try {
      const result = await apiRequest('/api/some-endpoint', {
        method: 'POST',
        body: JSON.stringify({ data: 'example' }),
      });

      showSuccess('Operation completed successfully');
      return result;
    } catch (error) {
      // apiRequest already converts to user-friendly message
      showError(error, 'Operation Failed');
    } finally {
      setLoading(false);
    }
  }

  // Example 2: Manual fetch with error handling
  async function handleManualFetch() {
    setLoading(true);
    try {
      const response = await fetch('/api/some-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'example' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      showSuccess('Success!');
      return data;
    } catch (error) {
      // getUserFriendlyError is called inside showError
      showError(error, 'Failed to complete request');
    } finally {
      setLoading(false);
    }
  }

  // Example 3: Database operation with error handling
  async function handleDatabaseOp() {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('goals')
        .select('*');

      if (error) {
        throw error;
      }

      showSuccess('Data loaded successfully');
      return data;
    } catch (error) {
      showError(error, 'Database Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Error Handling Examples</h2>

      <div className="space-y-2">
        <Button onClick={handleApiCall} disabled={loading}>
          Example 1: API Request
        </Button>

        <Button onClick={handleManualFetch} disabled={loading}>
          Example 2: Manual Fetch
        </Button>

        <Button onClick={handleDatabaseOp} disabled={loading}>
          Example 3: Database Operation
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Errors will show as toast notifications at the bottom of the screen.</p>
        <p>Success messages will also appear as toasts.</p>
      </div>
    </div>
  );
}
