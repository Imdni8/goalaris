import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { runAssessorTurn, type ChatMsg } from '@/lib/ai/agents/diagnosis/run';
import { loadRubric, loadEvidence } from '@/lib/ai/agents/diagnosis/data';

/**
 * POST { rubricId, transcript, userMessage } → { reply }
 *
 * One assessment-interview turn. Non-streaming for iteration 1.
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

    const { rubricId, transcript, userMessage } = await request.json();
    if (!rubricId || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Missing rubricId or userMessage' }, { status: 400 });
    }

    const [rubric, evidence] = await Promise.all([
      loadRubric(supabase, user.id, rubricId),
      loadEvidence(supabase, user.id),
    ]);

    const reply = await runAssessorTurn(
      {
        rubric,
        evidence,
        transcript: (Array.isArray(transcript) ? transcript : []) as ChatMsg[],
        userMessage,
      },
      { supabase, userId: user.id },
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[coach-agent/assess] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
