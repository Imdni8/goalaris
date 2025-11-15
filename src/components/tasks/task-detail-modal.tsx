'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import ActionLogForm from './action-log-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil } from 'lucide-react';

interface ActionLog {
  id: string;
  title: string;
  description: string | null;
  status: 'on_track' | 'at_risk' | 'blocked';
  blocker_description: string | null;
  created_at: string;
}

interface TaskDetailModalProps {
  taskId: string | null;
  taskTitle: string;
  taskStatus: string;
  taskDueDate: string | null;
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({
  taskId,
  taskTitle,
  taskStatus,
  taskDueDate,
  goalId,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: taskTitle,
    description: '',
    status: taskStatus,
    blocker_description: '',
    due_date: taskDueDate || '',
  });

  useEffect(() => {
    if (isOpen && taskId) {
      fetchActionLogs();
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    if (!taskId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task details:', error);
        return;
      }

      if (data) {
        setEditForm({
          title: data.title,
          description: data.description || '',
          status: data.status,
          blocker_description: data.blocker_description || '',
          due_date: data.due_date || '',
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching task:', err);
    }
  };

  const fetchActionLogs = async () => {
    if (!taskId) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('action_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching action logs:', error);
        return;
      }

      setActionLogs(data || []);
    } catch (err) {
      console.error('Unexpected error fetching action logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogAdded = () => {
    fetchActionLogs();
    router.refresh();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    fetchTaskDetails(); // Reset form to original values
  };

  const handleSaveEdit = async () => {
    if (!taskId || !editForm.title.trim()) {
      alert('Task title is required');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editForm.title,
          description: editForm.description || null,
          status: editForm.status,
          blocker_description: editForm.blocker_description || null,
          due_date: editForm.due_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        alert('Failed to update task: ' + error.message);
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating task:', err);
      alert('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'blocked':
        return 'Blocked';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!taskId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        {/* Task Info Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blocker (if any)</label>
                <Textarea
                  value={editForm.blocker_description}
                  onChange={(e) => setEditForm({ ...editForm, blocker_description: e.target.value })}
                  rows={2}
                  placeholder="Describe what's blocking this task..."
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} disabled={saving} size="sm">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" disabled={saving} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{editForm.title}</h3>
                <Button variant="ghost" size="icon" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>

              {editForm.description && (
                <p className="text-sm text-gray-600 mb-3">{editForm.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status: </span>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      editForm.status
                    )}`}
                  >
                    {formatStatus(editForm.status)}
                  </span>
                </div>
                {editForm.due_date && (
                  <div>
                    <span className="text-gray-600">Due: </span>
                    <span className="text-gray-900">
                      {new Date(editForm.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {editForm.blocker_description && (
                <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                  <strong>Blocker:</strong> {editForm.blocker_description}
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress Logs Section */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Progress Logs</h4>

          {/* Add New Log Form */}
          <div className="mb-6">
            <ActionLogForm taskId={taskId} onSuccess={handleLogAdded} alwaysOpen />
          </div>

          {/* Timeline */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading logs...</p>
          ) : actionLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No progress logs yet. Add one above!</p>
          ) : (
            <div className="space-y-4">
              {actionLogs.map((log) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'on_track':
                      return 'border-green-400';
                    case 'at_risk':
                      return 'border-orange-400';
                    case 'blocked':
                      return 'border-red-400';
                    default:
                      return 'border-blue-400';
                  }
                };

                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'on_track':
                      return 'bg-green-100 text-green-800';
                    case 'at_risk':
                      return 'bg-orange-100 text-orange-800';
                    case 'blocked':
                      return 'bg-red-100 text-red-800';
                    default:
                      return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'on_track':
                      return 'On Track';
                    case 'at_risk':
                      return 'At Risk';
                    case 'blocked':
                      return 'Blocked';
                    default:
                      return status;
                  }
                };

                return (
                  <div key={log.id} className={`border-l-4 ${getStatusColor(log.status)} pl-4 py-2`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{log.title}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                          {getStatusLabel(log.status)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                    )}
                    {log.blocker_description && (
                      <p className="text-sm text-red-600 mt-1">
                        <span className="font-medium">Blocker: </span>
                        {log.blocker_description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
