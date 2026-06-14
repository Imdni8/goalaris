import type { CoachContext } from '../coach-agent';
import { getRunnerFor } from '../providers';
import { rubricNormalizerAgent, interviewPlannerAgent, assessorAgent, diagnosisAgent } from './agents';
import {
  type Rubric,
  type Diagnosis,
  type InterviewPlan,
  type EvidenceStrength,
  STRENGTH_RANK,
  COVERED_MIN_RANK,
  AXIS_CONFIDENCE_THRESHOLD,
  OVERALL_CONFIDENCE_THRESHOLD,
} from './types';

export interface ProfileLite {
  full_name?: string | null;
  job_title?: string | null;
  team?: string | null;
  company?: string | null;
  career_goal?: string | null;
  key_skills?: string[] | null;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvidenceLite {
  type: string;
  competency_key?: string | null;
  content: string;
  source_label?: string | null;
}

function profileBlock(p?: ProfileLite | null): string {
  if (!p) return '(no profile on file)';
  return [
    p.job_title && `Role: ${p.job_title}`,
    p.team && `Team: ${p.team}`,
    p.company && `Company: ${p.company}`,
    p.career_goal && `Stated career goal: ${p.career_goal}`,
    p.key_skills?.length && `Key skills: ${p.key_skills.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n') || '(profile is sparse)';
}

function transcriptBlock(msgs: ChatMsg[]): string {
  if (!msgs.length) return '(no interview yet)';
  return msgs.map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');
}

function evidenceBlock(ev: EvidenceLite[]): string {
  if (!ev.length) return '(no evidence captured yet)';
  return ev
    .map((e) => `- [${e.type}${e.competency_key ? ` · ${e.competency_key}` : ''}]${e.source_label ? ` (${e.source_label})` : ''}: ${e.content}`)
    .join('\n');
}

// ── Stage 1: rubric ───────────────────────────────────────────────────────
export async function runRubricNormalizer(
  input: { roleTitle?: string; sourceText?: string; profile?: ProfileLite | null },
  context: CoachContext,
): Promise<Rubric> {
  const prompt = `Build the competency rubric for this target role.

TARGET ROLE TITLE: ${input.roleTitle || '(infer from the document below)'}

TARGET-ROLE DOCUMENT (JD / rubric / leveling text), if provided:
${input.sourceText?.trim() || '(none provided — generate a credible rubric from the role title and the user context below)'}

USER CONTEXT:
${profileBlock(input.profile)}`;

  const result = await getRunnerFor('rubric').run(rubricNormalizerAgent, prompt, { context });
  if (!result.finalOutput) throw new Error('rubric normalizer produced no output');
  return result.finalOutput;
}

// ── Stage 1b: interview plan (JD−résumé delta) ──────────────────────────────
export async function runPlanner(
  input: { rubric: Rubric; resumeText?: string; jdText?: string; profile?: ProfileLite | null },
  context: CoachContext,
): Promise<InterviewPlan> {
  const prompt = `TARGET ROLE: ${input.rubric.role_title}

RUBRIC (plan exactly one item per competency, using these keys):
${input.rubric.competencies.map((c) => `- ${c.key} | ${c.label} — target ${c.target_level}/5: ${c.description}`).join('\n')}

TARGET-ROLE JD / LEVELING TEXT, if provided:
${input.jdText?.trim() || '(none provided — infer the requirements from the rubric)'}

USER RÉSUMÉ:
${input.resumeText?.trim() || '(no résumé provided — treat every competency as unproven and prioritize accordingly)'}

USER CONTEXT:
${profileBlock(input.profile)}

Compute the JD−résumé delta and return the plan.`;

  const result = await getRunnerFor('planner').run(interviewPlannerAgent, prompt, { context });
  if (!result.finalOutput) throw new Error('interview planner produced no output');
  // Defensive: keep only plan items whose key exists on the rubric.
  const validKeys = new Set(input.rubric.competencies.map((c) => c.key));
  return { items: result.finalOutput.items.filter((i) => validKeys.has(i.key)) };
}

// ── Stage 2: assessor turn ──────────────────────────────────────────────────
/** Carried session state (client-held, like the transcript) merged each turn. */
export type StrengthMap = Record<string, EvidenceStrength>;

export interface AssessTurnResult {
  reply: string;
  focusKey: string;
  /** Monotonically-merged evidence strength per competency key. */
  strengths: StrengthMap;
  /** Keys with real evidence (>= self_report) — drive the chart/diagnosis. */
  coveredKeys: string[];
  /** Code-gated: true once every high-priority planned competency is settled. */
  readyToDiagnose: boolean;
}

function planBlock(plan: InterviewPlan | null, rubric: Rubric): string {
  if (!plan?.items.length) return '(no plan — cover the rubric evenly, weighting thin areas)';
  const labelOf = (k: string) => rubric.competencies.find((c) => c.key === k)?.label ?? k;
  return plan.items
    .map(
      (i) =>
        `- ${i.key} (${labelOf(i.key)}) | priority ${i.gap_priority} | budget ${i.probe_budget} | résumé shows: ${i.resume_evidence}`,
    )
    .join('\n');
}

function strengthsBlock(strengths: StrengthMap, rubric: Rubric): string {
  const entries = rubric.competencies
    .map((c) => [c.key, strengths[c.key]] as const)
    .filter(([, s]) => s);
  if (!entries.length) return '(nothing settled yet — this is the start of the interview)';
  return entries.map(([k, s]) => `- ${k}: ${s} (settled — do NOT re-probe)`).join('\n');
}

/** Strength only ratchets up; a later turn can never weaken a recorded competency. */
function mergeStrengths(prior: StrengthMap, updates: { key: string; evidence_strength: EvidenceStrength }[]): StrengthMap {
  const merged: StrengthMap = { ...prior };
  for (const u of updates) {
    const existing = merged[u.key];
    if (!existing || STRENGTH_RANK[u.evidence_strength] > STRENGTH_RANK[existing]) {
      merged[u.key] = u.evidence_strength;
    }
  }
  return merged;
}

/**
 * Readiness is a function of coverage, not LLM vibes: ready once every
 * high-priority planned competency is settled (has any recorded strength) and
 * most of the rubric is settled overall. Falls back to the model's own judgment
 * only when there's no plan to gate against.
 */
function computeReadiness(
  plan: InterviewPlan | null,
  strengths: StrengthMap,
  rubric: Rubric,
  modelSaysReady: boolean,
): boolean {
  const settled = (k: string) => Boolean(strengths[k]);
  const settledCount = rubric.competencies.filter((c) => settled(c.key)).length;
  const mostSettled = settledCount >= Math.ceil(rubric.competencies.length * 0.7);
  if (!plan?.items.length) return modelSaysReady && mostSettled;
  const highPriorityAllSettled = plan.items
    .filter((i) => i.gap_priority === 'high')
    .every((i) => settled(i.key));
  return highPriorityAllSettled && mostSettled;
}

export async function runAssessorTurn(
  input: {
    rubric: Rubric;
    plan: InterviewPlan | null;
    strengths: StrengthMap;
    transcript: ChatMsg[];
    evidence: EvidenceLite[];
    userMessage: string;
  },
  context: CoachContext,
): Promise<AssessTurnResult> {
  const prompt = `TARGET ROLE: ${input.rubric.role_title}

RUBRIC (the axes you are assessing):
${input.rubric.competencies.map((c) => `- ${c.label} (${c.key}) — target ${c.target_level}/5: ${c.description}`).join('\n')}

INTERVIEW PLAN (drive the highest-priority UNSETTLED competency):
${planBlock(input.plan, input.rubric)}

SETTLED STATE so far (evidence-strength already recorded — do NOT re-probe these):
${strengthsBlock(input.strengths, input.rubric)}

EVIDENCE CAPTURED SO FAR:
${evidenceBlock(input.evidence)}

INTERVIEW SO FAR:
${transcriptBlock(input.transcript)}

User's latest message: ${input.userMessage}

Respond with your single best next coaching turn and the structured progress fields.`;

  const result = await getRunnerFor('interview').run(assessorAgent, prompt, { context });
  if (!result.finalOutput) throw new Error('assessor produced no output');
  const out = result.finalOutput;

  // Defensive: only honor keys that actually exist on the rubric.
  const validKeys = new Set(input.rubric.competencies.map((c) => c.key));
  const updates = out.competency_updates.filter((u) => validKeys.has(u.key));
  const strengths = mergeStrengths(input.strengths, updates);
  const coveredKeys = Object.entries(strengths)
    .filter(([, s]) => STRENGTH_RANK[s] >= COVERED_MIN_RANK)
    .map(([k]) => k);

  return {
    reply: out.reply,
    focusKey: validKeys.has(out.focus_competency_key) ? out.focus_competency_key : '',
    strengths,
    coveredKeys,
    readyToDiagnose: computeReadiness(input.plan, strengths, input.rubric, out.ready_to_diagnose),
  };
}

// ── Stage 3: diagnosis (confidence-gated) ───────────────────────────────────
export async function runDiagnosis(
  input: {
    rubric: Rubric;
    transcript: ChatMsg[];
    evidence: EvidenceLite[];
    resumeText?: string;
    managerFeedback?: string;
  },
  context: CoachContext,
): Promise<Diagnosis> {
  const prompt = `Synthesize a readiness diagnosis for the target role: ${input.rubric.role_title}

RUBRIC / AXES:
${input.rubric.competencies.map((c) => `- ${c.key} | ${c.label} | target ${c.target_level}/5 | ${c.description} | scale: ${c.scale}`).join('\n')}

INTERVIEW TRANSCRIPT:
${transcriptBlock(input.transcript)}

RESUME (current):
${input.resumeText?.trim() || '(not provided)'}

MANAGER FEEDBACK (user-supplied):
${input.managerFeedback?.trim() || '(not provided)'}

UPLOADED / EXISTING EVIDENCE:
${evidenceBlock(input.evidence)}

Produce the diagnosis. Remember: mark axes "insufficient" rather than guessing, and set the
gate honestly.`;

  const result = await getRunnerFor('diagnosis').run(diagnosisAgent, prompt, { context });
  if (!result.finalOutput) throw new Error('diagnosis produced no output');
  return reconcileGate(result.finalOutput);
}

/**
 * Code-side backstop for the honesty rule: even if the model over-claims, force
 * low-confidence axes to `insufficient` and never let the gate read 'sufficient'
 * when confidence is genuinely low.
 */
export function reconcileGate(d: Diagnosis): Diagnosis {
  const axes = d.axes.map((a) =>
    a.confidence < AXIS_CONFIDENCE_THRESHOLD
      ? { ...a, state: 'insufficient' as const, current_level: null }
      : a,
  );

  const anyInsufficient = axes.some((a) => a.state === 'insufficient');
  let gate = d.gate;
  if (gate.mode === 'sufficient' && (d.overall_confidence < OVERALL_CONFIDENCE_THRESHOLD || anyInsufficient)) {
    gate = {
      mode: 'need_info',
      candidates: [],
      requested:
        gate.requested.length > 0
          ? gate.requested
          : [
              {
                info_type: 'more concrete evidence on the unscored axes',
                why: 'confidence is too low on at least one competency to stand behind the picture',
              },
            ],
    };
  }
  return { ...d, axes, gate };
}
