'use client';

import { useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GoalSmartCard from './goal-smart-card';
import MonthlyTaskBoard from '@/components/tasks/monthly-task-board';
import ProgressWidget from './progress-widget';
import {
  InGoalCoachWidget,
  type InGoalCoachWidgetHandle,
  type TaggedTask,
  type CheckInMode,
} from './in-goal-coach-widget';

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
  task_value: number | null;
}

interface GoalPageClientProps {
  goal: any;
  tasks: TaskRow[];
}

export default function GoalPageClient({ goal: initialGoal, tasks: initialTasks }: GoalPageClientProps) {
  const supabase = createClient();
  const [checkInMode, setCheckInMode] = useState<CheckInMode | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [goal, setGoal] = useState<any>(initialGoal);
  const [taggedTasks, setTaggedTasks] = useState<TaggedTask[]>([]);
  const coachRef = useRef<InGoalCoachWidgetHandle>(null);

  const taggedTaskIds = useMemo(
    () => new Set(taggedTasks.map((t) => t.id)),
    [taggedTasks]
  );

  const handleAskCoachAboutTask = (task: { id: string; title: string }) => {
    setTaggedTasks((prev) =>
      prev.find((t) => t.id === task.id)
        ? prev.filter((t) => t.id !== task.id) // toggle off if already tagged
        : [...prev, { id: task.id, title: task.title }]
    );
    coachRef.current?.open('task_sparkle');
  };

  const handleGenerateNewMonth = (newMonth: string) => {
    const previousMonth = goal.current_month;
    setCheckInMode({ newMonth, previousMonth });
  };

  const handleTaskUpdate = (update: {
    id: string;
    status?: string;
    completed_at?: string | null;
    completion_note?: string | null;
  }) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === update.id
          ? {
              ...t,
              ...(update.status !== undefined ? { status: update.status } : {}),
              ...(update.completed_at !== undefined
                ? { completed_at: update.completed_at }
                : {}),
              ...(update.completion_note !== undefined
                ? { completion_note: update.completion_note }
                : {}),
            }
          : t
      )
    );
  };

  const handleTasksGenerated = async () => {
    // Refetch tasks AND goal so months_generated / current_month are fresh.
    const [tasksRes, goalRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('goal_id', goal.id)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('goals').select('*').eq('id', goal.id).single(),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as TaskRow[]);
    if (goalRes.data) setGoal(goalRes.data);

    setCheckInMode(null);
  };

  return (
    <div className="flex gap-8">
      {/* Left sidebar: Goal card + progress widget */}
      <aside className="w-72 flex-shrink-0">
        <div className="sticky top-8 flex flex-col gap-[10px]">
          <GoalSmartCard goal={goal} />
          <ProgressWidget
            goalId={goal.id}
            currentMonth={goal.current_month}
            monthWeights={goal.month_weights}
            tasks={tasks}
            onOpenCoach={(seed) => coachRef.current?.open('progress_cta', seed)}
          />
        </div>
      </aside>

      {/* Main area: Tasks */}
      <main className="flex-1 min-w-0">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Tasks</h2>
        <MonthlyTaskBoard
          goalId={goal.id}
          currentMonth={goal.current_month}
          monthsGenerated={goal.months_generated || []}
          tasks={tasks}
          onGenerateNewMonth={handleGenerateNewMonth}
          onAskCoachAboutTask={handleAskCoachAboutTask}
          taggedTaskIds={taggedTaskIds}
          onTaskUpdate={handleTaskUpdate}
        />
      </main>

      {/* Floating coach widget — also hosts the monthly check-in flow */}
      <InGoalCoachWidget
        ref={coachRef}
        goalId={goal.id}
        goalTitle={goal.title}
        taggedTasks={taggedTasks}
        onTaggedTasksChange={setTaggedTasks}
        checkInMode={checkInMode}
        onCheckInClose={() => setCheckInMode(null)}
        onTasksGenerated={handleTasksGenerated}
      />
    </div>
  );
}
