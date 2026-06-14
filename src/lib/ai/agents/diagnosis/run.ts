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
/** Questions the coach has asked per competency — gates topic-switching. */
export type ProbeMap = Record<string, number>;

export interface AssessTurnResult {
  reply: string;
  focusKey: string;
  /** Monotonically-merged evidence strength per competency key. */
  strengths: StrengthMap;
  /** Running count of questions asked per competency key (carried each turn). */
  probes: ProbeMap;
  /** Keys with real evidence (>= self_report) — drive the chart/diagnosis. */
  coveredKeys: string[];
  /** Code-gated: true once every high-priority planned competency is settled. */
  readyToDiagnose: boolean;
}

/** Default per-competency question budget when there's no plan to read it from. */
const DEFAULT_PROBE_BUDGET = 2;

/** Questions to spend on a competency: the plan's budget, but always at least one
 * (even a résumé-proven strength earns one confirming question, so no axis is
 * skipped silently and the timeline stays meaningful). */
function probeBudget(plan: InterviewPlan | null, key: string): number {
  const item = plan?.items.find((i) => i.key === key);
  return Math.max(1, item?.probe_budget ?? DEFAULT_PROBE_BUDGET);
}

/**
 * A competency is DONE (stop probing, safe to move on) when any of:
 *  - it's corroborated (solid proof — no need to keep digging),
 *  - the user has signalled no evidence (strength "none") after ≥1 question,
 *  - its question budget is spent.
 * Anything probed-but-not-done is IN PROGRESS; anything unprobed is TODO.
 */
function isDone(plan: InterviewPlan | null, strengths: StrengthMap, probes: ProbeMap, key: string): boolean {
  const s = strengths[key];
  const asked = probes[key] ?? 0;
  if (s === 'corroborated') return true;
  if (s === 'none' && asked >= 1) return true;
  return asked >= probeBudget(plan, key);
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

/**
 * Per-competency progress the assessor drives from: priority, questions asked vs
 * budget, evidence so far, and a DONE / IN PROGRESS / TODO status. This replaces
 * the old "any strength ⇒ settled" signal that made the coach jump topics after a
 * single answer — a topic stays IN PROGRESS until its budget is spent.
 */
function statusBlock(
  plan: InterviewPlan | null,
  strengths: StrengthMap,
  probes: ProbeMap,
  rubric: Rubric,
): string {
  const priorityOf = (k: string) => plan?.items.find((i) => i.key === k)?.gap_priority ?? 'medium';
  return rubric.competencies
    .map((c) => {
      const asked = probes[c.key] ?? 0;
      const budget = probeBudget(plan, c.key);
      const strength = strengths[c.key] ?? 'unprobed';
      const status = isDone(plan, strengths, probes, c.key)
        ? 'DONE — do NOT revisit'
        : asked > 0
          ? 'IN PROGRESS — finish this one before switching'
          : 'TODO';
      return `- ${c.key} (${c.label}) | priority ${priorityOf(c.key)} | asked ${asked}/${budget} | evidence ${strength} | ${status}`;
    })
    .join('\n');
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
 * high-priority planned competency is DONE (its budget spent / corroborated /
 * the user has nothing) and most of the rubric is DONE overall. Falls back to the
 * model's own judgment only when there's no plan to gate against. Using DONE
 * (not "has any strength") stops the diagnosis from firing after a single answer.
 */
function computeReadiness(
  plan: InterviewPlan | null,
  strengths: StrengthMap,
  probes: ProbeMap,
  rubric: Rubric,
  modelSaysReady: boolean,
): boolean {
  const done = (k: string) => isDone(plan, strengths, probes, k);
  const doneCount = rubric.competencies.filter((c) => done(c.key)).length;
  const mostDone = doneCount >= Math.ceil(rubric.competencies.length * 0.7);
  if (!plan?.items.length) return modelSaysReady && mostDone;
  const highPriorityAllDone = plan.items
    .filter((i) => i.gap_priority === 'high')
    .every((i) => done(i.key));
  return highPriorityAllDone && mostDone;
}

export async function runAssessorTurn(
  input: {
    rubric: Rubric;
    plan: InterviewPlan | null;
    strengths: StrengthMap;
    probes: ProbeMap;
    transcript: ChatMsg[];
    evidence: EvidenceLite[];
    userMessage: string;
  },
  context: CoachContext,
): Promise<AssessTurnResult> {
  const prompt = `TARGET ROLE: ${input.rubric.role_title}

RUBRIC (the axes you are assessing):
${input.rubric.competencies.map((c) => `- ${c.label} (${c.key}) — target ${c.target_level}/5: ${c.description}`).join('\n')}

INTERVIEW PLAN (what the role demands vs what the résumé already proves):
${planBlock(input.plan, input.rubric)}

COMPETENCY STATUS (your map for THIS turn — drive the IN PROGRESS one to DONE before
starting any TODO; never open a new competency while one is IN PROGRESS):
${statusBlock(input.plan, input.strengths, input.probes, input.rubric)}

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
  const focusKey = validKeys.has(out.focus_competency_key) ? out.focus_competency_key : '';

  // Count this turn's question against the competency it actually probed, so a
  // topic accrues toward its budget and the status block tracks reality.
  const probes: ProbeMap = { ...input.probes };
  if (focusKey) probes[focusKey] = (probes[focusKey] ?? 0) + 1;

  const coveredKeys = Object.entries(strengths)
    .filter(([, s]) => STRENGTH_RANK[s] >= COVERED_MIN_RANK)
    .map(([k]) => k);

  return {
    reply: out.reply,
    focusKey,
    strengths,
    probes,
    coveredKeys,
    readyToDiagnose: computeReadiness(input.plan, strengths, probes, input.rubric, out.ready_to_diagnose),
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
