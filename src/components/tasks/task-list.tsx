'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/db/types';
import TaskDetailModal from './task-detail-modal';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskListProps {
  goalId: string;
  tasks: Task[];
}

export default function TaskList({ goalId, tasks: initialTasks }: TaskListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [tasks, setTasks] = useState(initialTasks);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync local state when props change (important for AI task generation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function updateTaskStatus(taskId: string, newStatus: string) {
    setUpdating(taskId);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        alert('Failed to update task: ' + error.message);
        return;
      }

      // Update local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      );

      router.refresh();
    } catch (err) {
      alert('An unexpected error occurred');
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setUpdating(taskId);

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) {
        alert('Failed to delete task: ' + error.message);
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      router.refresh();
    } catch (err) {
      alert('An unexpected error occurred');
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedTask(null);
    router.refresh();
  }

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    blocked: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' },
  ];

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No tasks yet. Add your first task to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md cursor-pointer"
          onClick={() => handleTaskClick(task)}
        >
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                {task.description && (
                  <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                )}
                {task.blocker_description && (
                  <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
                    <strong>Blocker:</strong> {task.blocker_description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={task.status || 'todo'}
                onChange={(e) => {
                  e.stopPropagation();
                  updateTaskStatus(task.id, e.target.value);
                }}
                disabled={updating === task.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[(task.status || 'todo') as keyof typeof statusColors]} cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {task.due_date && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}

              {task.ai_generated && <span className="text-xs text-blue-600">✨ AI</span>}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                disabled={updating === task.id}
                className="ml-auto text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          taskStatus={selectedTask.status}
          taskDueDate={selectedTask.due_date}
          goalId={goalId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
