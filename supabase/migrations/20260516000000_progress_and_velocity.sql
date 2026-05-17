-- Progress Quantification & Velocity
-- See: docs/product-changes/progress-&-velocity-nudges/progress-velocity-prd.md

-- 1. Per-task value: percentage points earned when the task is marked done.
ALTER TABLE public.tasks
  ADD COLUMN task_value NUMERIC(6,4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tasks.task_value IS
  'Progress percentage points earned when this task is done. Sum across done tasks in a goal = overall progress %.';

-- 2. Per-goal month weights: JSONB array of {month: "YYYY-MM", weight: number}.
ALTER TABLE public.goals
  ADD COLUMN month_weights JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.goals.month_weights IS
  'Array of {month, weight}. Re-distributed on monthly check-in. Sum of weights <= 100.';

-- 3. Cache table for AI-generated coach notes, keyed by (goal, month, velocity_state).
CREATE TABLE public.goal_progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  velocity_state TEXT NOT NULL CHECK (velocity_state IN ('AHEAD', 'STEADY', 'LAGGING')),
  note_text TEXT NOT NULL,
  cta_text TEXT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, month, velocity_state)
);

CREATE INDEX idx_goal_progress_notes_lookup
  ON public.goal_progress_notes(goal_id, month);

ALTER TABLE public.goal_progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress notes"
  ON public.goal_progress_notes
  FOR SELECT
  USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own progress notes"
  ON public.goal_progress_notes
  FOR INSERT
  WITH CHECK (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own progress notes"
  ON public.goal_progress_notes
  FOR UPDATE
  USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

-- 4. Backfill existing goals + tasks.
DO $$
DECLARE
  g RECORD;
  total_months INT;
  initial_weight NUMERIC(8,4);
  weights JSONB;
  m TEXT;
  cursor_date DATE;
  start_date DATE;
  end_date DATE;
  task_count INT;
  v_task_value NUMERIC(6,4);
BEGIN
  FOR g IN
    SELECT id, created_at, time_bound, months_generated
    FROM public.goals
  LOOP
    start_date := (g.created_at AT TIME ZONE 'UTC')::date;
    end_date := g.time_bound;

    IF end_date IS NULL OR end_date < start_date THEN
      total_months := 1;
    ELSE
      total_months :=
        (EXTRACT(YEAR FROM end_date)::int * 12 + EXTRACT(MONTH FROM end_date)::int)
        - (EXTRACT(YEAR FROM start_date)::int * 12 + EXTRACT(MONTH FROM start_date)::int)
        + 1;
      IF total_months < 1 THEN
        total_months := 1;
      END IF;
    END IF;

    initial_weight := ROUND(100.0 / total_months, 4);

    weights := '[]'::jsonb;
    cursor_date := date_trunc('month', start_date)::date;
    FOR i IN 1..total_months LOOP
      m := to_char(cursor_date, 'YYYY-MM');
      weights := weights || jsonb_build_object('month', m, 'weight', initial_weight);
      cursor_date := (cursor_date + interval '1 month')::date;
    END LOOP;

    UPDATE public.goals SET month_weights = weights WHERE id = g.id;

    IF g.months_generated IS NOT NULL THEN
      FOREACH m IN ARRAY g.months_generated LOOP
        SELECT COUNT(*) INTO task_count
        FROM public.tasks
        WHERE goal_id = g.id
          AND month = m
          AND COALESCE(status, '') <> 'dropped';

        IF task_count > 0 THEN
          v_task_value := ROUND(initial_weight / task_count, 4);
          UPDATE public.tasks
          SET task_value = v_task_value
          WHERE goal_id = g.id
            AND month = m
            AND COALESCE(status, '') <> 'dropped';
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;
