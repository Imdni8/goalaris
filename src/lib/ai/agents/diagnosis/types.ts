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
