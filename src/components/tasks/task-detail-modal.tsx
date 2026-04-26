'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Circle, Plus, Info, CheckCircle } from 'lucide-react';
import { safeString, ensureAnyTaskStatus } from '@/lib/utils/null-safe';

export interface TaskUpdate {
  id: string;
  completion_note?: string | null;
  status?: string;
  completed_at?: string | null;
}

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (update: TaskUpdate) => void;
}

type ReflectionMode = 'empty' | 'editing' | 'saved';

export default function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<{
    title: string;
    description: string;
    reflection: string;
    status: string;
    due_date: string;
  }>({
    title: '',
    description: '',
    reflection: '',
    status: 'pending',
    due_date: '',
  });
  const [mode, setMode] = useState<ReflectionMode>('empty');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      void fetchTask();
    } else {
      setMode('empty');
      setDraft('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId]);

  async function fetchTask() {
    if (!taskId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('title, description, completion_note, status, due_date')
        .eq('id', taskId)
        .single();

      if (error || !data) {
        console.error('Error fetching task:', error);
        return;
      }

      const reflection = safeString(data.completion_note);
      setTask({
        title: data.title,
        description: safeString(data.description),
        reflection,
        status: ensureAnyTaskStatus(data.status),
        due_date: safeString(data.due_date),
      });
      setDraft(reflection);
      setMode(reflection ? 'saved' : 'empty');
    } catch (err) {
      console.error('Unexpected error fetching task:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDone() {
    if (!taskId) return;
    const isDone = task.status === 'done';
    const newStatus = isDone ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    setTask(prev => ({ ...prev, status: newStatus }));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', taskId);

      if (error) {
        setTask(prev => ({ ...prev, status: isDone ? 'done' : 'pending' }));
        return;
      }

      onTaskUpdated?.({
        id: taskId,
        status: newStatus,
        completed_at: completedAt,
      });
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      setTask(prev => ({ ...prev, status: isDone ? 'done' : 'pending' }));
    }
  }

  function startEditing() {
    setDraft(task.reflection);
    setMode('editing');
  }

  async function handleSave() {
    if (!taskId) return;
    const next = draft.trim();

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({
          completion_note: next || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to save reflection:', error);
        return;
      }

      setTask(prev => ({ ...prev, reflection: next }));
      setMode(next ? 'saved' : 'empty');
      onTaskUpdated?.({
        id: taskId,
        completion_note: next || null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!taskId) return null;

  const isDone = task.status === 'done';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Task</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            {/* Task block (read-only) */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={handleToggleDone}
                className="flex-shrink-0 pt-1 hover:opacity-70"
                aria-label={isDone ? 'Mark not done' : 'Mark as done'}
              >
                {isDone ? (
                  <CheckCircle2 size={22} className="text-green-600" />
                ) : (
                  <Circle size={22} className="text-gray-300" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-base font-semibold ${
                    isDone ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <p className="mt-2 text-xs text-gray-500">
                    Due{' '}
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Reflection section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Reflection
              </p>

              {mode === 'empty' && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="w-full text-left rounded-lg border border-green-200 bg-green-50 p-4 hover:bg-green-100/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Add a quick note on what you did or learned
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-green-700">
                        <Info size={12} />
                        Used by the AI to write a richer self-assessment later
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md bg-green-600 text-white"
                      aria-hidden
                    >
                      <Plus size={18} />
                    </span>
                  </div>
                </button>
              )}

              {mode === 'editing' && (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="What did you do or learn?"
                    aria-label="Reflection"
                    className="w-full rounded-lg border-2 border-green-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
                  />
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1 text-xs text-green-700">
                      <Info size={12} />
                      Used by the AI to write a richer self-assessment later
                    </p>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'saved' && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {task.reflection}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs text-green-700">
                      <CheckCircle size={14} />
                      Nice — you&apos;ve made your self-assessment richer.
                    </p>
                    <button
                      type="button"
                      onClick={startEditing}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
