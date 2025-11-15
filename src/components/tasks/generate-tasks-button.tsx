'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface GenerateTasksButtonProps {
  goalId: string;
}

export default function GenerateTasksButton({ goalId }: GenerateTasksButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleGenerate() {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate tasks');
        return;
      }

      setSuccess(true);
      router.refresh();

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? 'Generating...' : '✨ Generate Tasks with AI'}
      </Button>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Tasks generated successfully!
        </div>
      )}
    </div>
  );
}
