import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { RubricSchema } from '@/lib/ai/agents/diagnosis/types';
import { runPlanner, type ProfileLite } from '@/lib/ai/agents/diagnosis/run';
import { savePlan, loadProfile } from '@/lib/ai/agents/diagnosis/data';

/**
 * POST { rubric, source, resumeText?, jdText? } → { id }
 *
 * Persists the user-approved (possibly edited) rubric as `approved`, then computes
 * the upfront interview plan (JD−résumé delta) and stores it on the row. Planning
 * is best-effort: a failure is logged and the interview proceeds without a plan.
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

    // Compute the upfront interview plan (JD−résumé delta) and store it on the row.
    // Best-effort: if planning fails, the interview still runs (assessor degrades
    // to even rubric coverage), so we never block approval on it.
    try {
      const profile = await loadProfile(supabase, user.id);
      const plan = await runPlanner(
        {
          rubric: parsed.data,
          resumeText: typeof body.resumeText === 'string' ? body.resumeText : undefined,
          jdText: typeof body.jdText === 'string' ? body.jdText : undefined,
          profile: profile as ProfileLite | null,
        },
        { supabase, userId: user.id },
      );
      await savePlan(supabase, user.id, data.id, plan);
    } catch (planErr) {
      console.error('[coach-agent/rubric/approve] planning failed (continuing):', planErr);
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('[coach-agent/rubric/approve] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
