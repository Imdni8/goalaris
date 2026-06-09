import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';

const EVIDENCE_TYPES = ['metric', 'link', 'upload_text', 'manager_feedback'] as const;
type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/**
 * POST { type, content, sourceLabel?, competencyKey? } → { id }
 *
 * Appends one row to the evidence ledger. Stores extracted TEXT / a URL only —
 * never a file (no blob storage in iteration 1).
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

    const { type, content, sourceLabel, competencyKey } = await request.json();
    if (!EVIDENCE_TYPES.includes(type as EvidenceType)) {
      return NextResponse.json({ error: `type must be one of ${EVIDENCE_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content string' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ca_evidence')
      .insert({
        user_id: user.id,
        type,
        content,
        source_label: sourceLabel ?? null,
        competency_key: competencyKey ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('[coach-agent/evidence] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
