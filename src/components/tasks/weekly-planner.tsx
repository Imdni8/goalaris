'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureAnyTaskStatus } from '@/lib/utils/null-safe';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

interface GoalRow {
  id: string;
  title: string;
  status: string | null;
  goal_number: number | null;
  user_id: string;
}

interface WeeklyPlannerProps {
  initialTasks: TaskRow[];
  goals: GoalRow[];
}

const GOAL_COLORS = [
  { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  { border: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-700' },
  { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
  { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
  { border: 'border-teal-400', bg: 'bg-teal-50', text: 'text-teal-700' },
  { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-700' },
  { border: 'border-cyan-400', bg: 'bg-cyan-50', text: 'text-cyan-700' },
];

function getGoalColor(goalNumber: number | null) {
  if (!goalNumber) return GOAL_COLORS[0];
  return GOAL_COLORS[goalNumber % GOAL_COLORS.length];
}

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  monday.setDate(diff);

  // Apply offset (in weeks)
  monday.setDate(monday.getDate() + offset * 7);

  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeeklyPlanner({ initialTasks, goals }: WeeklyPlannerProps) {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [localTasks, setLocalTasks] = useState<TaskRow[]>(initialTasks);
  const [notePrompt, setNotePrompt] = useState<{
    taskId: string;
    show: boolean;
  } | null>(null);
  const [noteText, setNoteText] = useState('');

  const today = new Date();
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const currentWeekStart = formatDate(weekDays[0]);

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const grouped: Record<string, TaskRow[]> = {};

    weekDays.forEach(day => {
      const dayKey = formatDate(day);
      grouped[dayKey] = localTasks.filter(t => t.due_date === dayKey);
    });

    return grouped;
  }, [localTasks, weekDays]);

  // Goal title map
  const goalMap = useMemo(() => {
    const map: Record<string, GoalRow> = {};
    goals.forEach(g => {
      map[g.id] = g;
    });
    return map;
  }, [goals]);

  async function toggleTask(taskId: string, currentStatus: string | null) {
    const currentStatusNormalized = ensureAnyTaskStatus(currentStatus);
    const newStatus = currentStatusNormalized === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    // If transitioning to done, show note prompt
    if (newStatus === 'done') {
      setNotePrompt({ taskId, show: true });
      setNoteText('');
    }

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
      setLocalTasks(initialTasks);
    }
  }

  async function saveCompletionNote(taskId: string) {
    try {
      await supabase
        .from('tasks')
        .update({
          completion_note: noteText,
        })
        .eq('id', taskId);

      setNotePrompt(null);
      setNoteText('');
    } catch (error) {
      console.error('Failed to save completion note:', error);
    }
  }

  function skipNote() {
    setNotePrompt(null);
    setNoteText('');
  }

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <p className="mt-1 text-sm text-gray-600">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
            >
              Today
            </button>
          )}

          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-5 gap-4">
        {weekDays.map((day, idx) => {
          const dayKey = formatDate(day);
          const tasksForDay = tasksByDay[dayKey] || [];
          const isToday =
            day.toDateString() === today.toDateString();
          const isPast = day < today && !isToday;

          return (
            <div
              key={dayKey}
              className={`rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-96`}
            >
              {/* Day header */}
              <div
                className={`px-4 py-3 ${
                  isToday
                    ? 'bg-blue-500'
                    : 'bg-gray-50'
                } border-b border-gray-200`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isToday ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {getDayName(day)}
                </p>
                <p
                  className={`text-xs ${
                    isToday ? 'text-blue-100' : 'text-gray-600'
                  }`}
                >
                  {getDateLabel(day)}
                </p>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {tasksForDay.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No tasks
                  </p>
                ) : (
                  tasksForDay.map(task => {
                    const taskStatus = ensureAnyTaskStatus(task.status);
                    const isDone = taskStatus === 'done';
                    const goalData = goalMap[task.goal_id];
                    const goalColor = getGoalColor(
                      goalData?.goal_number || null
                    );
                    const showNotePrompt =
                      notePrompt?.taskId === task.id &&
                      notePrompt?.show &&
                      isDone;

                    return (
                      <div key={task.id} className="space-y-1">
                        {/* Task chip */}
                        <div
                          className={`rounded-lg border border-l-4 p-2 transition-colors ${
                            isDone
                              ? 'bg-gray-50'
                              : goalColor.bg
                          } ${goalColor.border} ${
                            isPast && !isDone
                              ? 'opacity-60'
                              : ''
                          }`}
                        >
                          <div
                            className="flex gap-2 cursor-pointer"
                            onClick={e => {
                              e.preventDefault();
                            }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() =>
                                !isPast &&
                                toggleTask(
                                  task.id,
                                  task.status
                                )
                              }
                              className="flex-shrink-0 pt-0.5 hover:opacity-70"
                              disabled={isPast && !isDone}
                              aria-label={
                                isDone
                                  ? 'Mark incomplete'
                                  : 'Mark complete'
                              }
                            >
                              {isDone ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Circle
                                  size={16}
                                  className="text-gray-300"
                                />
                              )}
                            </button>

                            {/* Task content */}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/dashboard/goals/${task.goal_id}`}
                                className={`text-xs font-medium block hover:underline ${
                                  isDone
                                    ? 'line-through text-gray-500'
                                    : goalColor.text
                                }`}
                              >
                                {task.title}
                              </Link>

                              {/* Goal name */}
                              {goalData && (
                                <Link
                                  href={`/dashboard/goals/${task.goal_id}`}
                                  className="text-xs text-gray-500 hover:text-gray-700 truncate block"
                                  onClick={e =>
                                    e.stopPropagation()
                                  }
                                >
                                  {goalData.title.length > 20
                                    ? `${goalData.title.substring(
                                        0,
                                        20
                                      )}...`
                                    : goalData.title}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Completion note prompt */}
                        {showNotePrompt && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              Quick note?
                            </label>
                            <input
                              type="text"
                              value={noteText}
                              onChange={e =>
                                setNoteText(e.target.value)
                              }
                              placeholder="What did you do..."
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  saveCompletionNote(
                                    task.id
                                  )
                                }
                                className="flex-1 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={skipNote}
                                className="flex-1 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                              >
                                Skip
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {localTasks.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600 mb-4">
            No tasks for this week. Ready to create your first goal?
          </p>
          <Link
            href="/dashboard/goals/new-ai"
            className="inline-block rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Create Goal
          </Link>
        </div>
      )}
    </div>
  );
}
