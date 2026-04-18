'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GoalSmartCard from './goal-smart-card';
import MonthlyTaskBoard from '@/components/tasks/monthly-task-board';
import { GoalCoachPanel } from './goal-coach-panel';

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

interface GoalPageClientProps {
  goal: any;
  tasks: TaskRow[];
}

export default function GoalPageClient({ goal, tasks: initialTasks }: GoalPageClientProps) {
  const supabase = createClient();
  const [coachPanelOpen, setCoachPanelOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<{
    newMonth: string;
    previousMonth: string;
  } | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);

  const handleGenerateNewMonth = (newMonth: string) => {
    const previousMonth = goal.current_month;
    setCheckInMode({ newMonth, previousMonth });
    setCoachPanelOpen(true);
  };

  const handleTasksGenerated = async (newTasks: any[]) => {
    // Refetch all tasks from the server
    const { data: updatedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goal.id)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (updatedTasks) {
      setTasks(updatedTasks as TaskRow[]);
    }

    // Close coach panel and reset check-in mode
    setCheckInMode(null);
    setCoachPanelOpen(false);
  };

  return (
    <div className="flex gap-8">
      {/* Left sidebar: Goal card */}
      <aside className="w-72 flex-shrink-0">
        <div className="sticky top-8 flex flex-col gap-[10px]">
          <GoalSmartCard goal={goal} />
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
        />
      </main>

      {/* Coach panel */}
      <GoalCoachPanel
        open={coachPanelOpen}
        onClose={() => {
          setCoachPanelOpen(false);
          setCheckInMode(null);
        }}
        goalId={goal.id}
        goalTitle={goal.title}
        checkInMode={checkInMode}
        onTasksGenerated={handleTasksGenerated}
      />
    </div>
  );
}
