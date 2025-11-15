'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { ArrowUp } from 'lucide-react';
import TaskCard from './task-card';
import TaskDetailModal from './task-detail-modal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  goal_id: string;
  created_at: string;
};

type Goal = {
  id: string;
  title: string;
  time_bound?: string | null;
};

type KanbanBoardProps = {
  initialTasks: Task[];
  goals: Goal[];
};

type Column = 'todo' | 'in_progress' | 'completed';

const COLUMNS: { id: Column; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Done' },
];

const TASKS_PER_PAGE = 10;

export default function KanbanBoard({ initialTasks, goals }: KanbanBoardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<{ [key in Column]?: boolean }>({});
  const [displayCounts, setDisplayCounts] = useState<{ [key in Column]: number }>({
    todo: TASKS_PER_PAGE,
    in_progress: TASKS_PER_PAGE,
    completed: TASKS_PER_PAGE,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter((task) => task.status === column.id)
      .slice(0, displayCounts[column.id]);
    return acc;
  }, {} as Record<Column, Task[]>);

  // Get total count per column
  const totalCounts = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id).length;
    return acc;
  }, {} as Record<Column, number>);

  // Calculate days until due
  const calculateDaysUntilDue = (goalId: string): number | null => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal?.time_bound) return null;

    const dueDate = new Date(goal.time_bound);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as Column;

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    setActiveId(null);

    // Update in database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to update task status:', error);
        // Revert on error
        router.refresh();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      router.refresh();
    }
  };

  const handleLoadMore = (columnId: Column) => {
    setDisplayCounts((prev) => ({
      ...prev,
      [columnId]: prev[columnId] + TASKS_PER_PAGE,
    }));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    router.refresh(); // Refresh to get updated data
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;
  const activeGoal = activeTask ? goals.find((g) => g.id === activeTask.goal_id) : null;

  return (
    <div className="mt-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Tasks</h2>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{column.label}</h3>
                  <ArrowUp className="h-4 w-4 text-gray-400" />
                </div>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                  {totalCounts[column.id]}
                </span>
              </div>

              {/* Droppable Area */}
              <div
                id={column.id}
                className="min-h-[400px] space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {}}
              >
                {tasksByStatus[column.id].map((task) => {
                  const goal = goals.find((g) => g.id === task.goal_id);
                  const daysUntilDue = calculateDaysUntilDue(task.goal_id);

                  return (
                    <div
                      key={task.id}
                      id={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        handleDragStart({ active: { id: task.id } } as DragStartEvent);
                      }}
                      onDragEnd={(e) => {
                        const target = document.elementFromPoint(e.clientX, e.clientY);
                        const columnElement = target?.closest('[id]') as HTMLElement;
                        if (columnElement && COLUMNS.find((c) => c.id === columnElement.id)) {
                          handleDragEnd({
                            active: { id: task.id },
                            over: { id: columnElement.id },
                          } as DragEndEvent);
                        } else {
                          setActiveId(null);
                        }
                      }}
                    >
                      <TaskCard
                        task={task}
                        goalTitle={goal?.title || 'Unknown Goal'}
                        dueDate={goal?.time_bound}
                        daysUntilDue={daysUntilDue}
                        onClick={() => handleTaskClick(task)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {displayCounts[column.id] < totalCounts[column.id] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoadMore(column.id)}
                  disabled={loadingMore[column.id]}
                  className="mt-4 w-full"
                >
                  {loadingMore[column.id] ? 'Loading...' : 'Load more tasks'}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && activeGoal && (
            <TaskCard
              task={activeTask}
              goalTitle={activeGoal.title}
              dueDate={activeGoal.time_bound}
              daysUntilDue={calculateDaysUntilDue(activeTask.goal_id)}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          taskStatus={selectedTask.status}
          taskDueDate={goals.find((g) => g.id === selectedTask.goal_id)?.time_bound || null}
          goalId={selectedTask.goal_id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
