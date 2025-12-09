import { createClient } from '@/lib/supabase/server';
import { generateSmartGoal } from '@/lib/ai/claude';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_GENERATION.limit,
      RATE_LIMITS.AI_GENERATION.windowMs
    );

    if (!rateLimit.allowed) {
      console.log(`[generate-goal] Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const { rawGoalText } = await request.json();

    if (!rawGoalText || typeof rawGoalText !== 'string') {
      return NextResponse.json({ error: 'Invalid input: rawGoalText is required' }, { status: 400 });
    }

    // Check API key availability
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('[generate-goal] GOOGLE_AI_API_KEY not set in environment');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('[generate-goal] Starting goal generation for user:', user.id);
    console.log('[generate-goal] Raw goal text length:', rawGoalText.length);

    // Generate SMART goal using Gemini
    let smartGoal;
    try {
      smartGoal = await generateSmartGoal(rawGoalText);
      console.log('[generate-goal] Successfully generated SMART goal:', JSON.stringify(smartGoal).substring(0, 200));
    } catch (aiError) {
      console.error('[generate-goal] AI generation error - Full error object:', aiError);
      console.error('[generate-goal] Error name:', aiError instanceof Error ? aiError.name : 'unknown');
      console.error('[generate-goal] Error message:', aiError instanceof Error ? aiError.message : 'unknown');
      console.error('[generate-goal] Error stack:', aiError instanceof Error ? aiError.stack : 'unknown');

      // Return the actual error message to help debug
      return NextResponse.json(
        {
          error: aiError instanceof Error ? aiError.message : 'Failed to generate SMART goal. Please try again.'
        },
        { status: 500 }
      );
    }

    // Log the AI interaction
    try {
      await supabase.from('ai_interactions').insert([
        {
          user_id: user.id,
          interaction_type: 'smart_goal',
          prompt: rawGoalText,
          response: JSON.stringify(smartGoal),
          goal_id: null,
        },
      ]);
      console.log('[generate-goal] Successfully logged AI interaction');
    } catch (dbError) {
      // Log error but don't fail the request - the goal was generated successfully
      console.error('[generate-goal] Failed to log AI interaction (non-fatal):', dbError);
    }

    return NextResponse.json({ smartGoal });
  } catch (error) {
    console.error('[generate-goal] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
