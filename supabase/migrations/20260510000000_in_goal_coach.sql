-- In-Goal Coach: extend coach tables and add per-month summaries
-- See: docs/product-changes/in-goals-pg-coaching/in-goal-coach-spec.md

-- 1. Scope conversations to a goal (NULL = standalone /coach thread)
ALTER TABLE public.conversations
  ADD COLUMN goal_id UUID NULL REFERENCES public.goals(id) ON DELETE CASCADE;

CREATE INDEX idx_conversations_goal_id ON public.conversations(goal_id, updated_at DESC);

-- 2. Carry proposal payloads on assistant messages
ALTER TABLE public.messages
  ADD COLUMN metadata JSONB NULL,
  ADD COLUMN status TEXT NULL CHECK (status IN ('pending', 'approved', 'discarded'));

-- 3. Per-month summaries for cheap historical context
CREATE TABLE public.goal_month_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(goal_id, month)
);

CREATE INDEX idx_goal_month_summaries_goal ON public.goal_month_summaries(goal_id);

ALTER TABLE public.goal_month_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own goal summaries"
  ON public.goal_month_summaries
  FOR SELECT
  USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own goal summaries"
  ON public.goal_month_summaries
  FOR INSERT
  WITH CHECK (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users delete own goal summaries"
  ON public.goal_month_summaries
  FOR DELETE
  USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );
