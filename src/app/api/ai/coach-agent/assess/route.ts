import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { runAssessorTurn, type ChatMsg, type StrengthMap, type ProbeMap } from '@/lib/ai/agents/diagnosis/run';
import { loadRubric, loadPlan, loadEvidence } from '@/lib/ai/agents/diagnosis/data';

/**
 * POST { rubricId, transcript, userMessage, strengths, probes }
 *   → { reply, focusKey, strengths, probes, coveredKeys, readyToDiagnose }
 *
 * One assessment-interview turn. Non-streaming for iteration 1. Coverage is
 * tracked as monotonic per-competency evidence-strength (carried in `strengths`,
 * merged server-side); `probes` counts questions per competency so a topic is
 * finished before the next begins; readiness is code-gated against the plan.
 */
export async function POST(request: NextRequest) {
  if (!isCoachAgentEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rubricId, transcript, userMessage, strengths, probes } = await request.json();
    if (!rubricId || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Missing rubricId or userMessage' }, { status: 400 });
    }

    const [rubric, plan, evidence] = await Promise.all([
      loadRubric(supabase, user.id, rubricId),
      loadPlan(supabase, user.id, rubricId),
      loadEvidence(supabase, user.id),
    ]);

    const turn = await runAssessorTurn(
      {
        rubric,
        plan,
        strengths: (strengths && typeof strengths === 'object' ? strengths : {}) as StrengthMap,
        probes: (probes && typeof probes === 'object' ? probes : {}) as ProbeMap,
        evidence,
        transcript: (Array.isArray(transcript) ? transcript : []) as ChatMsg[],
        userMessage,
      },
      { supabase, userId: user.id },
    );

    return NextResponse.json({
      reply: turn.reply,
      focusKey: turn.focusKey,
      strengths: turn.strengths,
      probes: turn.probes,
      coveredKeys: turn.coveredKeys,
      readyToDiagnose: turn.readyToDiagnose,
    });
  } catch (error) {
    console.error('[coach-agent/assess] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
