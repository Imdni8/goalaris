import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { runRubricNormalizer, type ProfileLite } from '@/lib/ai/agents/diagnosis/run';

/**
 * POST { roleTitle?, jdText? } → { rubric }
 *
 * Generates (or normalizes an uploaded JD into) a draft competency rubric for the
 * target role. Does NOT persist — the client reviews/edits, then calls /rubric/approve.
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

    const { roleTitle, jdText } = await request.json();
    if (!roleTitle && !jdText) {
      return NextResponse.json({ error: 'Provide roleTitle or jdText' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, job_title, team, company, career_goal, key_skills')
      .eq('id', user.id)
      .single();

    const rubric = await runRubricNormalizer(
      { roleTitle, sourceText: jdText, profile: profile as ProfileLite | null },
      { supabase, userId: user.id },
    );

    return NextResponse.json({ rubric });
  } catch (error) {
    console.error('[coach-agent/rubric] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
