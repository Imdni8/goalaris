'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/db/types';
import TaskDetailModal from './task-detail-modal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskListProps {
  goalId: string;
  tasks: Task[];
}

// Sortable Task Item Component
function SortableTaskItem({
  task,
  updating,
  onTaskClick,
  onStatusChange,
  onDelete,
  statusColors,
  statusOptions,
}: {
  task: Task;
  updating: string | null;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onDelete: (taskId: string) => void;
  statusColors: Record<string, string>;
  statusOptions: Array<{ value: string; label: string }>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1 touch-none"
        aria-label="Drag to reorder"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </svg>
      </button>

      {/* Task Content */}
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onTaskClick(task)}
      >
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
              onStatusChange(task.id, e.target.value);
            }}
            disabled={updating === task.id}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusColors[(task.status || 'todo') as keyof typeof statusColors]
            } cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {task.due_date && (
            <span className="text-xs text-gray-500">
              Due:{' '}
              {new Date(task.due_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}

          {task.ai_generated && <span className="text-xs text-blue-600">✨ AI</span>}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            disabled={updating === task.id}
            className="ml-auto text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
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

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    // Optimistically update UI
    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);

    // Update order_index for all affected tasks
    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      order_index: index + 1,
    }));

    try {
      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_id: goalId,
          task_orders: taskOrders,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder tasks');
      }

      // Refresh to ensure consistency
      router.refresh();
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert on error
      setTasks(tasks);
      alert('Failed to reorder tasks. Please try again.');
    }
  }

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

  const taskIds = tasks.map((task) => task.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              updating={updating}
              onTaskClick={handleTaskClick}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
              statusColors={statusColors}
              statusOptions={statusOptions}
            />
          ))}
        </div>
      </SortableContext>

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
    </DndContext>
  );
}
