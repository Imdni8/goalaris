import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { RubricSchema } from '@/lib/ai/agents/diagnosis/types';

/**
 * POST { rubric, source } → { id }
 *
 * Persists the user-approved (possibly edited) rubric as `approved`.
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

    const body = await request.json();
    const parsed = RubricSchema.safeParse(body.rubric);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rubric', details: parsed.error.format() }, { status: 400 });
    }
    const source = body.source === 'uploaded' ? 'uploaded' : 'generated';

    const { data, error } = await supabase
      .from('ca_target_rubric')
      .insert({
        user_id: user.id,
        role_title: parsed.data.role_title,
        source,
        status: 'approved',
        competencies: parsed.data.competencies,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('[coach-agent/rubric/approve] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
