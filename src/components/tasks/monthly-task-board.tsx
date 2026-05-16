'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureAnyTaskStatus } from '@/lib/utils/null-safe';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import GenerateTasksButtonModal from './generate-tasks-button-modal';
import TaskDetailModal, { TaskUpdate } from './task-detail-modal';

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
  onGenerateNewMonth?: (newMonth: string) => void;
  onAskCoachAboutTask?: (task: { id: string; title: string }) => void;
  taggedTaskIds?: Set<string>;
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
  onGenerateNewMonth,
  onAskCoachAboutTask,
  taggedTaskIds,
}: MonthlyTaskBoardProps) {
  const supabase = createClient();
  const [localTasks, setLocalTasks] = useState<TaskRow[]>(tasks);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sync local state when the parent refetches tasks (e.g., after the
  // monthly check-in generates next month's tasks).
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Show every month that has been generated. We used to gate this by
  // `m <= calendar-today`, but the monthly check-in deliberately generates
  // next month's tasks and the user must be able to see them.
  const today = new Date().toISOString().slice(0, 7);
  const visibleMonths = useMemo(
    () => [...monthsGenerated].sort(),
    [monthsGenerated]
  );

  // Calculate next unlocked month
  const nextUnlockedMonth = useMemo(() => {
    if (!currentMonth) return null;

    const calendarMonth = today; // "YYYY-MM"
    const allResolved = localTasks
      .filter(t => t.month === currentMonth)
      .every(t => t.status === 'done' || t.status === 'dropped');

    let candidate: string | null = null;
    if (allResolved || calendarMonth > currentMonth) {
      // Next month after currentMonth
      const [y, m] = currentMonth.split('-').map(Number);
      const naturalNext = m === 12
        ? `${y + 1}-01`
        : `${y}-${String(m + 1).padStart(2, '0')}`;
      // If the natural next month is already in the past (user skipped one
      // or more months), jump straight to the current calendar month so the
      // user only catches up once.
      candidate = calendarMonth > naturalNext ? calendarMonth : naturalNext;
    }

    // Don't show if already generated
    if (candidate && monthsGenerated.includes(candidate)) return null;
    return candidate;
  }, [currentMonth, localTasks, monthsGenerated, today]);

  const defaultMonth = currentMonth || visibleMonths.at(-1) || today;
  const [activeMonth, setActiveMonth] = useState(defaultMonth);

  // Legacy tasks without month assigned (exclude dropped — those are
  // soft-deleted and shouldn't surface in the active board).
  const legacyTasks = useMemo(
    () => localTasks.filter(t => !t.month && t.status !== 'dropped'),
    [localTasks]
  );

  // Tasks for the active month (exclude dropped tasks from the visible list;
  // they're preserved in the DB for audit but shouldn't show up alongside
  // active work).
  const monthTasks = useMemo(
    () =>
      localTasks
        .filter(t => t.month === activeMonth && t.status !== 'dropped')
        .sort((a, b) => {
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

  function handleTaskUpdated(update: TaskUpdate) {
    setLocalTasks(prev =>
      prev.map(t =>
        t.id === update.id
          ? {
              ...t,
              ...(update.completion_note !== undefined
                ? { completion_note: update.completion_note }
                : {}),
              ...(update.status !== undefined ? { status: update.status } : {}),
              ...(update.completed_at !== undefined
                ? { completed_at: update.completed_at }
                : {}),
            }
          : t
      )
    );
  }

  async function handleGenerateModalClose(success?: boolean) {
    setShowGenerateModal(false);
    if (success) {
      // Refetch tasks from the server
      const { data: updatedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('goal_id', goalId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (updatedTasks) {
        setLocalTasks(updatedTasks);
      }
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
              type="button"
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
                type="button"
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

        {/* Next unlocked month tab */}
        {nextUnlockedMonth && (
          <button
            type="button"
            onClick={() => setActiveMonth(nextUnlockedMonth)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-0.5 transition-colors border-dashed ${
              activeMonth === nextUnlockedMonth
                ? 'border-blue-500 text-blue-600'
                : 'border-gray-300 text-gray-500 hover:text-gray-700'
            }`}
          >
            {new Date(`${nextUnlockedMonth}-01`).toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            })}
          </button>
        )}
      </div>

      {/* Tasks for active month */}
      <div className="space-y-6">
        {monthTasks.length === 0 ? (
          activeMonth === nextUnlockedMonth ? (
            // Show generate prompt for next month
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
              <div className="text-center space-y-4">
                <p className="text-gray-700 font-medium">
                  Generate tasks for {new Date(`${activeMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-600">
                  You can give the coach context based on your experience so far to help customise tasks better for you.
                </p>
                <button
                  type="button"
                  onClick={() => onGenerateNewMonth?.(nextUnlockedMonth)}
                  className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Generate Tasks
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">No tasks for {new Date(`${activeMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          )
        ) : (
          <>
            {([1, 2, 3, 4] as const).map(week => {
              const weekTasks = tasksByWeek[week];
              if (weekTasks.length === 0) return null;

              return (
                <div key={`week-${week}`}>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">{getWeekLabel(week)}</h3>
                  <div className="space-y-2">
                    {weekTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showDueDate
                        toggleDisabled={isPastMonth}
                        onToggle={() => toggleTask(task.id, task.status)}
                        onOpen={() => setSelectedTaskId(task.id)}
                        onAskCoach={onAskCoachAboutTask}
                        isTagged={taggedTaskIds?.has(task.id) || false}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Unscheduled tasks */}
            {tasksByWeek.unscheduled.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Unscheduled</h3>
                <div className="space-y-2">
                  {tasksByWeek.unscheduled.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      toggleDisabled={isPastMonth}
                      onToggle={() => toggleTask(task.id, task.status)}
                      onOpen={() => setSelectedTaskId(task.id)}
                      onAskCoach={onAskCoachAboutTask}
                      isTagged={taggedTaskIds?.has(task.id) || false}
                    />
                  ))}
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
                  {legacyTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id, task.status)}
                      onOpen={() => setSelectedTaskId(task.id)}
                      onAskCoach={onAskCoachAboutTask}
                      isTagged={taggedTaskIds?.has(task.id) || false}
                    />
                  ))}
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
          onClose={handleGenerateModalClose}
        />
      )}

      {/* Task detail modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}

interface TaskCardProps {
  task: TaskRow;
  showDueDate?: boolean;
  toggleDisabled?: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onAskCoach?: (task: { id: string; title: string }) => void;
  isTagged?: boolean;
}

function TaskCard({ task, showDueDate, toggleDisabled, onToggle, onOpen, onAskCoach, isTagged }: TaskCardProps) {
  const isDone = ensureAnyTaskStatus(task.status) === 'done';

  return (
    <div
      className={`group relative flex gap-3 rounded-lg border border-gray-200 p-3 ${
        isDone ? 'bg-gray-50' : 'bg-white'
      } transition-colors`}
    >
      {/* Checkbox — its own hit target */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          if (!toggleDisabled) onToggle();
        }}
        className="flex-shrink-0 -m-1 p-1 hover:opacity-70 disabled:cursor-not-allowed"
        disabled={toggleDisabled}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone ? (
          <CheckCircle2 size={20} className="text-green-600" />
        ) : (
          <Circle size={20} className="text-gray-300" />
        )}
      </button>

      {/* Body — opens detail modal */}
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 text-left -m-1 p-1 rounded hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <p
          className={`text-sm font-medium ${
            isDone ? 'line-through text-gray-500' : 'text-gray-900'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className={`text-xs mt-1 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>
        )}
        {showDueDate && task.due_date && (
          <p className="text-xs text-gray-500 mt-1">
            Due:{' '}
            {new Date(task.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </button>

      {/* "Ask coach about this" sparkle — hover-revealed; pinned filled when tagged */}
      {onAskCoach && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAskCoach({ id: task.id, title: task.title });
          }}
          className={`absolute right-2 top-2 transition-all rounded-md p-1.5 ${
            isTagged
              ? 'opacity-100 bg-blue-600 text-white hover:bg-blue-700'
              : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-blue-600 hover:bg-blue-50'
          }`}
          aria-label={isTagged ? 'Untag from coach' : 'Ask coach about this'}
          title={isTagged ? 'Tagged in coach — click to remove' : 'Ask coach about this'}
        >
          <Sparkles className={`w-4 h-4 ${isTagged ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
