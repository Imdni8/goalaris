'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface GoalEditModalProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    specific: string | null;
    measurable: string | null;
    achievable: string | null;
    relevant: string | null;
    time_bound: string | null;
  };
  onClose: () => void;
}

export default function GoalEditModal({ goal, onClose }: GoalEditModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || '',
    specific: goal.specific || '',
    measurable: goal.measurable || '',
    achievable: goal.achievable || '',
    relevant: goal.relevant || '',
    time_bound: goal.time_bound || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          title: formData.title,
          description: formData.description || null,
          specific: formData.specific || null,
          measurable: formData.measurable || null,
          achievable: formData.achievable || null,
          relevant: formData.relevant || null,
          time_bound: formData.time_bound || null,
        })
        .eq('id', goal.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const { error: deleteError } = await supabase.from('goals').delete().eq('id', goal.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      router.push('/dashboard/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Goal</h2>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded"
            title="Delete goal"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="goal-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="goal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="goal-specific" className="block text-sm font-medium text-gray-700">Specific</label>
            <textarea
              id="goal-specific"
              value={formData.specific}
              onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="goal-measurable" className="block text-sm font-medium text-gray-700">Measurable</label>
            <textarea
              id="goal-measurable"
              value={formData.measurable}
              onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="goal-achievable" className="block text-sm font-medium text-gray-700">Achievable</label>
            <textarea
              id="goal-achievable"
              value={formData.achievable}
              onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="goal-relevant" className="block text-sm font-medium text-gray-700">Relevant</label>
            <textarea
              id="goal-relevant"
              value={formData.relevant}
              onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="goal-time-bound" className="block text-sm font-medium text-gray-700">Time Bound</label>
            <input
              id="goal-time-bound"
              type="date"
              value={formData.time_bound}
              onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Goal</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete this goal? This action cannot be undone. All associated tasks and logs will also be deleted.
                </p>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete Goal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
