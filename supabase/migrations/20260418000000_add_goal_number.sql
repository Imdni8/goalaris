-- Add goal_number column for human-readable sequential identifier
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_number INTEGER;

-- Backfill: assign per-user sequential numbers ordered by created_at
WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC)::integer AS num
  FROM public.goals
)
UPDATE public.goals
SET goal_number = numbered.num
FROM numbered
WHERE public.goals.id = numbered.id;
