'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ActionLog = Database['public']['Tables']['action_logs']['Row'];

type ActionLogTimelineProps = {
  logs: ActionLog[];
  onUpdate?: () => void;
};

export default function ActionLogTimeline({ logs, onUpdate }: ActionLogTimelineProps) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'on_track' as 'on_track' | 'at_risk' | 'blocked',
    blocker_description: '',
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleEdit = (log: ActionLog) => {
    setEditingId(log.id);
    setEditForm({
      title: log.title,
      description: log.description || '',
      status: log.status as 'on_track' | 'at_risk' | 'blocked',
      blocker_description: log.blocker_description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      title: '',
      description: '',
      status: 'on_track',
      blocker_description: '',
    });
  };

  const handleUpdate = async (logId: string) => {
    setUpdating(true);
    try {
      const hasBlocker = editForm.status === 'blocked' && editForm.blocker_description;
      const { error } = await supabase
        .from('action_logs')
        .update({
          title: editForm.title,
          description: editForm.description || null,
          status: editForm.status,
          blocker_description: hasBlocker ? editForm.blocker_description : null,
          blocker_status: hasBlocker ? 'active' : null,
        })
        .eq('id', logId);

      if (error) {
        alert('Failed to update log: ' + error.message);
        return;
      }

      setEditingId(null);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating log:', err);
      alert('An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this progress log?')) return;

    setDeleting(logId);
    try {
      const { error } = await supabase
        .from('action_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        alert('Failed to delete log: ' + error.message);
        return;
      }

      onUpdate?.();
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('An unexpected error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const handleResolveBlocker = async (logId: string) => {
    try {
      // Get the log to find task_id
      const log = logs.find(l => l.id === logId);
      if (!log) return;

      // Update log: mark blocker as resolved and change status to on_track
      const { error: updateError } = await supabase
        .from('action_logs')
        .update({
          blocker_status: 'resolved',
          status: 'on_track'
        })
        .eq('id', logId);

      if (updateError) {
        alert('Failed to resolve blocker: ' + updateError.message);
        return;
      }

      // Check if there are any other active blockers for this task
      const { data: activeBlockers } = await supabase
        .from('action_logs')
        .select('id')
        .eq('task_id', log.task_id)
        .eq('blocker_status', 'active');

      // If no active blockers remain, update task status to in_progress
      if (!activeBlockers || activeBlockers.length === 0) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'in_progress' })
          .eq('id', log.task_id);

        if (taskError) {
          console.error('Error updating task status:', taskError);
        }
      }

      onUpdate?.();
    } catch (err) {
      console.error('Error resolving blocker:', err);
      alert('An unexpected error occurred');
    }
  };
  if (logs.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500">
        No progress logs yet. Add your first log to track progress!
      </div>
    );
  }

  const statusColors = {
    on_track: 'bg-green-100 text-green-800',
    at_risk: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    on_track: 'On Track',
    at_risk: 'At Risk',
    blocked: 'Blocked',
  };

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Progress Logs</h4>
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
        >
          {editingId === log.id ? (
            /* Edit Form */
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="on_track"
                      checked={editForm.status === 'on_track'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as any,
                        })
                      }
                    />
                    <span className="text-sm">On Track</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="at_risk"
                      checked={editForm.status === 'at_risk'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as any,
                        })
                      }
                    />
                    <span className="text-sm">At Risk</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="blocked"
                      checked={editForm.status === 'blocked'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as any,
                        })
                      }
                    />
                    <span className="text-sm">Blocked</span>
                  </label>
                </div>
              </div>

              {editForm.status === 'blocked' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Blocker Description
                  </label>
                  <Textarea
                    value={editForm.blocker_description}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        blocker_description: e.target.value,
                      })
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdate(log.id)}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <>
              <div className="mb-2 flex items-start justify-between">
                <h5 className="flex-1 font-medium text-gray-900">{log.title}</h5>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[log.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[log.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </div>

              {log.description && (
                <p className="mb-2 text-gray-600">{log.description}</p>
              )}

              {log.blocker_description && (
                <div className={`mb-2 rounded-md p-2 text-sm ${
                  log.blocker_status === 'resolved'
                    ? 'bg-gray-50 text-gray-600'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong>Blocker:</strong>
                        {log.blocker_status === 'resolved' && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            Resolved
                          </span>
                        )}
                        {log.blocker_status === 'active' && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1">{log.blocker_description}</p>
                    </div>
                    {log.blocker_status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveBlocker(log.id)}
                        className="shrink-0 text-xs"
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }) : 'Unknown date'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(log)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deleting === log.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deleting === log.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
