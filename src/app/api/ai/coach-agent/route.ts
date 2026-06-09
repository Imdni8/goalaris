import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runCoachAgent } from '@/lib/ai/agents/coach-agent';

/**
 * POC endpoint for the OpenAI Agents SDK coach.
 *
 * POST { "message": "..." } → { output, toolsCalled }
 *
 * Isolated from the existing /api/coach/send-message flow so we can validate the
 * agent setup without touching production coaching. Non-streaming on purpose.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing "message" string' }, { status: 400 });
    }

    const result = await runCoachAgent(message, { supabase, userId: user.id });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[coach-agent] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
