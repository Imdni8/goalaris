'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type ActionLogFormProps = {
  taskId: string;
  onSuccess?: () => void;
};

export default function ActionLogForm({ taskId, onSuccess }: ActionLogFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    action_description: '',
    impact_notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in');
        return;
      }

      const { error } = await supabase.from('action_logs').insert([
        {
          task_id: taskId,
          user_id: user.id,
          action_description: formData.action_description,
          impact_notes: formData.impact_notes || null,
        },
      ]);

      if (error) {
        alert('Failed to add progress log: ' + error.message);
        return;
      }

      // Reset form
      setFormData({
        action_description: '',
        impact_notes: '',
      });
      setIsOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error('Error adding progress log:', err);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="mt-2"
      >
        + Add Progress Log
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Progress Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="e.g., Completed initial setup"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Describe what you did..."
          className="text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="on_track"
              checked={formData.status === 'on_track'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">On Track</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="at_risk"
              checked={formData.status === 'at_risk'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="text-orange-600"
            />
            <span className="text-sm text-gray-700">At Risk</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="blocked"
              checked={formData.status === 'blocked'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="text-red-600"
            />
            <span className="text-sm text-gray-700">Blocked</span>
          </label>
        </div>
      </div>

      {formData.status === 'blocked' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What's blocking you?
          </label>
          <Textarea
            value={formData.blocker_description}
            onChange={(e) => setFormData({ ...formData, blocker_description: e.target.value })}
            rows={2}
            placeholder="Describe the blocker..."
            className="text-sm"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Adding...' : 'Add Log'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
