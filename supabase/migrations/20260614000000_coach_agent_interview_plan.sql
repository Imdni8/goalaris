-- Coach Agent — Iteration 2 (interview redesign, minimal path)
-- Adds the upfront interview PLAN to the target rubric. The planner computes a
-- JD−résumé delta once at approval time: per competency, what the role demands,
-- what the résumé already evidences, the resulting gap priority, and a probe
-- budget. The interviewer reads this each turn to drive the highest-priority
-- under-covered competency instead of improvising coverage.
--
-- Nullable: planning is best-effort. If the planner call fails, the interview
-- still runs (the assessor degrades to its old improvised behavior).

ALTER TABLE public.ca_target_rubric
  ADD COLUMN IF NOT EXISTS plan JSONB;

COMMENT ON COLUMN public.ca_target_rubric.plan IS
  'Interview plan: { items: [{ key, jd_requirement, resume_evidence, gap_priority, probe_budget }] }';
