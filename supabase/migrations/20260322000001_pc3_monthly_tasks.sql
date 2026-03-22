-- Phase 3 & 6: Monthly Task Generation & Weekly Grouping
-- Add month scoping, reschedule tracking, manual task flag, and completion tracking to tasks
-- Add month generation tracking to goals

-- Extend tasks table with new Phase 3 fields
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS month TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion_note TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Drop the old status check constraint and replace with expanded one
-- Supporting both legacy statuses (todo, in_progress, blocked, completed) and new statuses (pending, done, dropped)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed', 'pending', 'done', 'dropped'));

-- Create index on month for efficient month-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_month ON public.tasks(month);

-- Extend goals table with month generation tracking
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS current_month TEXT,
  ADD COLUMN IF NOT EXISTS months_generated TEXT[];
