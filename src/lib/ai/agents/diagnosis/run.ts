import type { CoachContext } from '../coach-agent';
import { getRunnerFor } from '../providers';
import { rubricNormalizerAgent, assessorAgent, diagnosisAgent } from './agents';
import {
  type Rubric,
  type Diagnosis,
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

// ── Stage 2: assessor turn ──────────────────────────────────────────────────
export async function runAssessorTurn(
  input: { rubric: Rubric; transcript: ChatMsg[]; evidence: EvidenceLite[]; userMessage: string },
  context: CoachContext,
): Promise<string> {
  const prompt = `TARGET ROLE: ${input.rubric.role_title}

RUBRIC (the axes you are assessing):
${input.rubric.competencies.map((c) => `- ${c.label} (${c.key}) — target ${c.target_level}/5: ${c.description}`).join('\n')}

EVIDENCE CAPTURED SO FAR:
${evidenceBlock(input.evidence)}

INTERVIEW SO FAR:
${transcriptBlock(input.transcript)}

User's latest message: ${input.userMessage}

Respond with your single best next coaching turn.`;

  const result = await getRunnerFor('interview').run(assessorAgent, prompt, { context });
  return result.finalOutput ?? '';
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
