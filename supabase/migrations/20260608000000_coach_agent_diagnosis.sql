-- Coach Agent — Iteration 1 (diagnosis half)
-- New, ISOLATED tables (ca_* namespace). Does NOT touch the existing `assessments`
-- table (PC-7 monthly check-in) or any live coaching tables.
--
-- Three tables:
--   ca_target_rubric  — the target-role rubric (uploaded or generated→approved); its
--                        `competencies` array defines the spider-chart axes.
--   ca_evidence       — the evidence ledger (extracted TEXT only, never files).
--   ca_gap_assessment — a confidence-gated diagnosis: per-axis current/target + state.

-- ── ca_target_rubric ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ca_target_rubric (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title  TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'generated' CHECK (source IN ('uploaded', 'generated')),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  -- [{ key, label, description, target_level, scale }] — these ARE the chart axes
  competencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ca_target_rubric ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_rubric_select_own" ON public.ca_target_rubric FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ca_rubric_insert_own" ON public.ca_target_rubric FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_rubric_update_own" ON public.ca_target_rubric FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ca_rubric_delete_own" ON public.ca_target_rubric FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ca_rubric_user ON public.ca_target_rubric(user_id);

-- ── ca_evidence (the ledger) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ca_evidence (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('metric', 'link', 'upload_text', 'manager_feedback')),
  competency_key TEXT,                       -- nullable until mapped to an axis
  content        TEXT NOT NULL,              -- extracted text / pasted text / URL
  source_label   TEXT,                       -- e.g. "perf review Q1", "stakeholder email"
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ca_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_evidence_select_own" ON public.ca_evidence FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ca_evidence_insert_own" ON public.ca_evidence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_evidence_update_own" ON public.ca_evidence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ca_evidence_delete_own" ON public.ca_evidence FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ca_evidence_user ON public.ca_evidence(user_id);

-- ── ca_gap_assessment ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ca_gap_assessment (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rubric_id          UUID NOT NULL REFERENCES public.ca_target_rubric(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('in_progress', 'complete')),
  overall_confidence NUMERIC,
  -- [{ competency_key, current_level, target_level, confidence, state, rationale, evidence_ids }]
  axes               JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- ranked list derived from axis deltas
  development_areas  JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- gate: { mode: 'sufficient' | 'choose' | 'need_info', candidates?, requested? }
  gate               JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ca_gap_assessment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_gap_select_own" ON public.ca_gap_assessment FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ca_gap_insert_own" ON public.ca_gap_assessment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_gap_update_own" ON public.ca_gap_assessment FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ca_gap_delete_own" ON public.ca_gap_assessment FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ca_gap_user ON public.ca_gap_assessment(user_id);
CREATE INDEX IF NOT EXISTS idx_ca_gap_rubric ON public.ca_gap_assessment(rubric_id);
