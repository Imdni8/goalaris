import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { runDiagnosis, type ChatMsg } from '@/lib/ai/agents/diagnosis/run';
import { loadRubric, loadEvidence } from '@/lib/ai/agents/diagnosis/data';

/**
 * POST { rubricId, transcript, resumeText?, managerFeedback? } → Diagnosis
 *
 * Runs the confidence-gated diagnosis on the stronger model, persists it, and
 * returns { axes, development_areas, overall_confidence, gate }.
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

    const { rubricId, transcript, resumeText, managerFeedback } = await request.json();
    if (!rubricId) {
      return NextResponse.json({ error: 'Missing rubricId' }, { status: 400 });
    }

    const [rubric, evidence] = await Promise.all([
      loadRubric(supabase, user.id, rubricId),
      loadEvidence(supabase, user.id),
    ]);

    const diagnosis = await runDiagnosis(
      {
        rubric,
        evidence,
        resumeText,
        managerFeedback,
        transcript: (Array.isArray(transcript) ? transcript : []) as ChatMsg[],
      },
      { supabase, userId: user.id },
    );

    const { error: saveError } = await supabase.from('ca_gap_assessment').insert({
      user_id: user.id,
      rubric_id: rubricId,
      status: 'complete',
      overall_confidence: diagnosis.overall_confidence,
      axes: diagnosis.axes,
      development_areas: diagnosis.development_areas,
      gate: diagnosis.gate,
    });
    if (saveError) console.error('[coach-agent/diagnose] save failed:', saveError);

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error('[coach-agent/diagnose] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
