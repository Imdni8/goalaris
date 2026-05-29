'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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

  const inputClass =
    'mt-1 w-full rounded border border-input bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div
        className="flex w-full max-w-2xl flex-col rounded-lg bg-surface shadow-lg"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <h2 className="text-heading">Edit Goal</h2>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded p-1.5 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Delete goal"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-label text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="goal-title" className="block text-label text-foreground">Title</label>
            <input
              id="goal-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-label text-foreground">Description</label>
            <textarea
              id="goal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-specific" className="block text-label text-foreground">Specific</label>
            <textarea
              id="goal-specific"
              value={formData.specific}
              onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-measurable" className="block text-label text-foreground">Measurable</label>
            <textarea
              id="goal-measurable"
              value={formData.measurable}
              onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-achievable" className="block text-label text-foreground">Achievable</label>
            <textarea
              id="goal-achievable"
              value={formData.achievable}
              onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-relevant" className="block text-label text-foreground">Relevant</label>
            <textarea
              id="goal-relevant"
              value={formData.relevant}
              onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-time-bound" className="block text-label text-foreground">Time Bound</label>
            <input
              id="goal-time-bound"
              type="date"
              value={formData.time_bound}
              onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
              className={inputClass}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-surface px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-label text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-label text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          variant="destructive"
          title="Delete Goal"
          description="Are you sure you want to delete this goal? This action cannot be undone. All associated tasks and logs will also be deleted."
          confirmLabel="Delete Goal"
          loading={deleting}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
