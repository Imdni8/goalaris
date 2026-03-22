'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureAnyTaskStatus } from '@/lib/utils/null-safe';
import { CheckCircle2, Circle } from 'lucide-react';
import GenerateTasksButtonModal from './generate-tasks-button-modal';

interface TaskRow {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  month: string | null;
  status: string | null;
  order_index: number;
  ai_generated: boolean | null;
  is_manual: boolean | null;
  reschedule_count: number;
  completion_note: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  blocker_description: string | null;
}

interface MonthlyTaskBoardProps {
  goalId: string;
  currentMonth: string | null;
  monthsGenerated: string[];
  tasks: TaskRow[];
}

function getWeekNumber(dateStr: string | null): 1 | 2 | 3 | 4 | null {
  if (!dateStr) return null;
  const day = new Date(dateStr).getUTCDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function getWeekLabel(week: 1 | 2 | 3 | 4): string {
  return `Week ${week}`;
}

export default function MonthlyTaskBoard({
  goalId,
  currentMonth,
  monthsGenerated,
  tasks,
}: MonthlyTaskBoardProps) {
  const supabase = createClient();
  const [localTasks, setLocalTasks] = useState<TaskRow[]>(tasks);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Determine which months to show as tabs
  const today = new Date().toISOString().slice(0, 7);
  const visibleMonths = useMemo(
    () => monthsGenerated.filter(m => m <= today).sort(),
    [monthsGenerated, today]
  );

  const defaultMonth = currentMonth || visibleMonths.at(-1) || today;
  const [activeMonth, setActiveMonth] = useState(defaultMonth);

  // Legacy tasks without month assigned
  const legacyTasks = useMemo(
    () => localTasks.filter(t => !t.month),
    [localTasks]
  );

  // Tasks for the active month
  const monthTasks = useMemo(
    () => localTasks.filter(t => t.month === activeMonth).sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }),
    [localTasks, activeMonth]
  );

  // Group tasks by week
  const tasksByWeek = useMemo(() => {
    const grouped: Record<1 | 2 | 3 | 4 | 'unscheduled', TaskRow[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      unscheduled: [],
    };

    monthTasks.forEach(task => {
      const week = getWeekNumber(task.due_date);
      if (week) {
        grouped[week].push(task);
      } else {
        grouped.unscheduled.push(task);
      }
    });

    return grouped;
  }, [monthTasks]);

  const isPastMonth = activeMonth < today;

  async function toggleTask(taskId: string, currentStatus: string | null) {
    const currentStatusNormalized = ensureAnyTaskStatus(currentStatus);
    const newStatus = currentStatusNormalized === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    // Optimistic update
    setLocalTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, completed_at: completedAt }
          : t
      )
    );

    try {
      await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: completedAt,
        })
        .eq('id', taskId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert optimistic update on error
      setLocalTasks(tasks);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* No tasks yet - show generate button */}
        {localTasks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-600 mb-4">No tasks yet for this goal. Generate AI-powered tasks to get started.</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Generate Tasks
            </button>
          </div>
        ) : (
          <>
            {/* Month tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {visibleMonths.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No tasks yet for this goal.</p>
              ) : (
          visibleMonths.map(month => {
            const monthDate = new Date(`${month}-01`);
            const monthLabel = monthDate.toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            });

            return (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-0.5 transition-colors ${
                  activeMonth === month
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {monthLabel}
              </button>
            );
          })
        )}
      </div>

      {/* Tasks for active month */}
      <div className="space-y-6">
        {monthTasks.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No tasks for {new Date(`${activeMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        ) : (
          <>
            {([1, 2, 3, 4] as const).map(week => {
              const weekTasks = tasksByWeek[week];
              if (weekTasks.length === 0) return null;

              return (
                <div key={`week-${week}`}>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">{getWeekLabel(week)}</h3>
                  <div className="space-y-2">
                    {weekTasks.map(task => {
                      const taskStatus = ensureAnyTaskStatus(task.status);
                      const isDone = taskStatus === 'done';

                      return (
                        <div
                          key={task.id}
                          className={`flex gap-3 rounded-lg border border-gray-200 p-3 ${
                            isDone ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                          } transition-colors ${isPastMonth ? 'cursor-default' : 'cursor-pointer'}`}
                          onClick={() => !isPastMonth && toggleTask(task.id, task.status)}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-0.5">
                            {isDone ? (
                              <CheckCircle2 size={20} className="text-green-600" />
                            ) : (
                              <Circle size={20} className="text-gray-300" />
                            )}
                          </div>

                          {/* Task content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                isDone
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className={`text-xs mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                                {task.description}
                              </p>
                            )}
                            {task.due_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Unscheduled tasks */}
            {tasksByWeek.unscheduled.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Unscheduled</h3>
                <div className="space-y-2">
                  {tasksByWeek.unscheduled.map(task => {
                    const taskStatus = ensureAnyTaskStatus(task.status);
                    const isDone = taskStatus === 'done';

                    return (
                      <div
                        key={task.id}
                        className={`flex gap-3 rounded-lg border border-gray-200 p-3 ${
                          isDone ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                        } transition-colors ${isPastMonth ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !isPastMonth && toggleTask(task.id, task.status)}
                      >
                        <div className="flex-shrink-0 pt-0.5">
                          {isDone ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <Circle size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isDone
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className={`text-xs mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

            {/* Legacy tasks section (if any) */}
            {legacyTasks.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Previously Created Tasks</h3>
                <div className="space-y-2">
                  {legacyTasks.map(task => {
                    const taskStatus = ensureAnyTaskStatus(task.status);
                    const isDone = taskStatus === 'done';

                    return (
                      <div
                        key={task.id}
                        className={`flex gap-3 rounded-lg border border-gray-200 p-3 ${
                          isDone ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                        } transition-colors cursor-pointer`}
                        onClick={() => toggleTask(task.id, task.status)}
                      >
                        <div className="flex-shrink-0 pt-0.5">
                          {isDone ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <Circle size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isDone
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className={`text-xs mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for generating tasks */}
      {showGenerateModal && (
        <GenerateTasksButtonModal
          goalId={goalId}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </>
  );
}
