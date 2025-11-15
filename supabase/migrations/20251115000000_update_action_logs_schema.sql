-- Migration: Update action_logs table schema
-- This migration updates the action_logs table to support the new schema
-- with title, description, status, and blocker_description fields

-- Step 1: Add new columns (nullable at first)
ALTER TABLE public.action_logs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.action_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.action_logs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.action_logs ADD COLUMN IF NOT EXISTS blocker_description TEXT;

-- Step 2: Migrate existing data from old columns to new columns
UPDATE public.action_logs
SET
  title = COALESCE(action_description, 'Progress update'),
  description = impact_notes,
  status = 'on_track'
WHERE title IS NULL;

-- Step 3: Drop old columns
ALTER TABLE public.action_logs DROP COLUMN IF EXISTS action_description;
ALTER TABLE public.action_logs DROP COLUMN IF EXISTS impact_notes;
ALTER TABLE public.action_logs DROP COLUMN IF EXISTS time_spent_minutes;
ALTER TABLE public.action_logs DROP COLUMN IF EXISTS logged_at;

-- Step 4: Add NOT NULL constraint to title (now that data is migrated)
ALTER TABLE public.action_logs ALTER COLUMN title SET NOT NULL;

-- Step 5: Add default value and CHECK constraint to status
ALTER TABLE public.action_logs ALTER COLUMN status SET DEFAULT 'on_track';
ALTER TABLE public.action_logs ADD CONSTRAINT action_logs_status_check
  CHECK (status IN ('on_track', 'at_risk', 'blocked'));
