'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateTasksButtonModalProps {
  goalId: string;
  onClose: (success?: boolean) => void;
}

interface ConfirmNextMonthState {
  currentMonthLabel: string;
  proposedMonthLabel: string;
}

export default function GenerateTasksButtonModal({ goalId, onClose }: GenerateTasksButtonModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNextMonth, setConfirmNextMonth] = useState<ConfirmNextMonthState | null>(null);

  async function handleGenerateTasks(acceptNextMonth = false) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, acceptNextMonth }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tasks');
      }

      if (data.needsConfirmation) {
        setConfirmNextMonth({
          currentMonthLabel: data.currentMonthLabel,
          proposedMonthLabel: data.proposedMonthLabel,
        });
        return;
      }

      router.refresh();
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Generate Tasks</h2>
          <button
            type="button"
            onClick={() => onClose()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {confirmNextMonth ? (
            <p className="text-gray-700">
              No weekdays remain in {confirmNextMonth.currentMonthLabel}. Generate tasks for {confirmNextMonth.proposedMonthLabel} instead?
            </p>
          ) : (
            <p className="text-gray-700">
              Generate AI-powered tasks for this goal. Tasks will be created from today through the end of the current month, on weekdays only.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleGenerateTasks(!!confirmNextMonth)}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? 'Generating...'
              : confirmNextMonth
                ? `Generate for ${confirmNextMonth.proposedMonthLabel}`
                : 'Generate Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
