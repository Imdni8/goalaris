import { z } from 'zod';

/**
 * Shared schemas for the iteration-1 diagnosis pipeline.
 *
 * Levels are on a 1–5 scale. A rubric competency IS a spider-chart axis.
 * The diagnosis is CONFIDENCE-GATED: when evidence is thin the synthesizer must
 * mark an axis `insufficient` (never invent a number) and the overall gate asks
 * the user to choose between candidate diagnoses or supply specific info.
 */

export const LEVEL_SCALE_MAX = 5;

// ── Rubric ────────────────────────────────────────────────────────────────
export const CompetencyAxisSchema = z.object({
  key: z.string().describe('stable snake_case identifier, e.g. cross_team_influence'),
  label: z.string().describe('short human label for the chart axis'),
  description: z.string().describe('what demonstrating this competency looks like at the target level'),
  target_level: z.number().min(1).max(LEVEL_SCALE_MAX).describe('expected level for the target role (1–5)'),
  scale: z.string().describe('one-line description of what the 1–5 scale means for this axis'),
});
export type CompetencyAxis = z.infer<typeof CompetencyAxisSchema>;

export const RubricSchema = z.object({
  role_title: z.string(),
  competencies: z.array(CompetencyAxisSchema).min(3).max(10),
});
export type Rubric = z.infer<typeof RubricSchema>;

// ── Interview plan (upfront JD−résumé delta) ────────────────────────────────
/**
 * Computed ONCE at rubric-approval time from the rubric + résumé (+ JD). It turns
 * coverage from an improvised, per-turn LLM guess into a planned thing: for each
 * competency, what the role demands, what the résumé already proves, the gap
 * priority, and how many questions to spend. The interviewer reads this each turn
 * to front-load the silent (high-priority) areas and avoid re-confirming strengths.
 */
export const GAP_PRIORITIES = ['high', 'medium', 'low'] as const;
export const InterviewPlanItemSchema = z.object({
  key: z.string().describe('the rubric competency key this item plans for'),
  jd_requirement: z.string().describe('what the target role demands for this competency'),
  resume_evidence: z
    .string()
    .describe('what the résumé/profile already evidences for it, or "(none found)" when silent'),
  gap_priority: z
    .enum(GAP_PRIORITIES)
    .describe('interview attention this needs — "high" when the JD demands it and the résumé is silent'),
  probe_budget: z
    .number()
    .int()
    .min(0)
    .max(4)
    .describe('how many interview questions to spend here (0 for an already well-evidenced strength)'),
});
export type InterviewPlanItem = z.infer<typeof InterviewPlanItemSchema>;

export const InterviewPlanSchema = z.object({
  items: z.array(InterviewPlanItemSchema),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

// ── Evidence strength (tracked, monotonic) ──────────────────────────────────
/**
 * How well-evidenced a competency is, ordered weakest→strongest. Replaces the
 * old "covered: yes/no" so that an absence of evidence ("none") is a settled,
 * recorded result the coach acts on — not a prompt to keep re-drilling.
 */
export const EVIDENCE_STRENGTHS = ['none', 'self_report', 'corroborated'] as const;
export const EvidenceStrengthSchema = z.enum(EVIDENCE_STRENGTHS);
export type EvidenceStrength = z.infer<typeof EvidenceStrengthSchema>;
/** Rank for monotonic merge — strength only ever ratchets up across turns. */
export const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  none: 1,
  self_report: 2,
  corroborated: 3,
};
/** Strengths at/above this rank count as "covered" (real evidence) for the chart/diagnosis. */
export const COVERED_MIN_RANK = STRENGTH_RANK.self_report;

// ── Assessor turn ─────────────────────────────────────────────────────────
/**
 * Structured output for a single interview turn. Beyond the spoken `reply`, the
 * assessor reports which competency it's probing and the evidence-strength it
 * settled THIS turn. The route merges those updates monotonically into carried
 * session state, so coverage can't regress and readiness is code-gated.
 */
export const CompetencyUpdateSchema = z.object({
  key: z.string().describe('the rubric competency key being updated'),
  evidence_strength: EvidenceStrengthSchema.describe(
    'the strength you settled on for this competency given the answer just received',
  ),
});
export type CompetencyUpdate = z.infer<typeof CompetencyUpdateSchema>;

export const AssessorTurnSchema = z.object({
  reply: z.string().describe('the single next thing the coach says to the user'),
  focus_competency_key: z
    .string()
    .describe(
      "the rubric competency 'key' this turn is primarily probing; empty string for a pure opening greeting or closing remark",
    ),
  competency_updates: z
    .array(CompetencyUpdateSchema)
    .describe(
      'evidence-strength you settled THIS turn (usually just the focus competency); merged monotonically server-side',
    ),
  ready_to_diagnose: z
    .boolean()
    .describe('your judgment that further questioning would add little; the server makes the final call'),
});
export type AssessorTurn = z.infer<typeof AssessorTurnSchema>;

// ── Diagnosis ───────────────────────────────────────────────────────────────
export const AxisDiagnosisSchema = z.object({
  competency_key: z.string(),
  current_level: z.number().min(0).max(LEVEL_SCALE_MAX).nullable()
    .describe('assessed current level, or null when state is insufficient'),
  target_level: z.number().min(1).max(LEVEL_SCALE_MAX),
  confidence: z.number().min(0).max(1).describe('0–1 confidence in the current_level estimate'),
  state: z.enum(['scored', 'insufficient'])
    .describe("'insufficient' when evidence is too thin to place a number — do NOT guess"),
  rationale: z.string().describe('what evidence supports this (or what is missing)'),
});
export type AxisDiagnosis = z.infer<typeof AxisDiagnosisSchema>;

export const DevelopmentAreaSchema = z.object({
  competency_key: z.string(),
  // Human-readable heading. Required because an "other"-lens area need not map to
  // a rubric competency, so the UI can't always resolve a label from the key —
  // without this it would surface the raw snake_case key (e.g. "documentation_practices").
  title: z.string().describe('short human-readable heading for this development area, in Title Case'),
  summary: z.string(),
  // optional coaching lens — NOT the structural taxonomy
  lens: z.enum(['knowledge', 'visibility', 'experience', 'other']),
});
export type DevelopmentArea = z.infer<typeof DevelopmentAreaSchema>;

/**
 * The confidence gate. `candidates`/`requested` are always present (empty when
 * unused) to keep the JSON schema strict-friendly for the Agents SDK.
 */
export const GateSchema = z.object({
  mode: z.enum(['sufficient', 'choose', 'need_info']),
  candidates: z.array(z.object({ label: z.string(), description: z.string() }))
    .describe("when mode='choose': 2–3 candidate diagnoses for the user to pick"),
  requested: z.array(z.object({ info_type: z.string(), why: z.string() }))
    .describe("when mode='need_info': specific info that would raise confidence"),
});
export type Gate = z.infer<typeof GateSchema>;

export const DiagnosisSchema = z.object({
  axes: z.array(AxisDiagnosisSchema),
  development_areas: z.array(DevelopmentAreaSchema),
  overall_confidence: z.number().min(0).max(1),
  gate: GateSchema,
});
export type Diagnosis = z.infer<typeof DiagnosisSchema>;

/** Below this per-axis confidence we treat an axis as not trustworthy. */
export const AXIS_CONFIDENCE_THRESHOLD = 0.5;
/** Below this overall confidence the gate should not be 'sufficient'. */
export const OVERALL_CONFIDENCE_THRESHOLD = 0.6;
