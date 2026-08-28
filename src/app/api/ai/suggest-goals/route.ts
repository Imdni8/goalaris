import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

const MODEL = 'gemini-3.5-flash-lite';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  const url = `${API_ENDPOINT}/${MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text response from Gemini');
  }

  return text;
}

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
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const { careerGoal, jobTitle, company } = await request.json();

    if (!careerGoal || typeof careerGoal !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: careerGoal is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('[suggest-goals] GOOGLE_AI_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const prompt = `You are an expert career coach. Generate 3 specific, actionable goal suggestions for a professional with the following context:

Career Goal: ${careerGoal}
${jobTitle ? `Current Role: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}

Generate exactly 3 goals that help achieve their career goal. Each goal should be:
- Specific and actionable
- Achievable within 3-6 months
- Aligned with their career trajectory
- Focused on career development

Return ONLY a JSON array with this format (no other text):
[
  {
    "title": "Goal title",
    "description": "2-3 sentence description of what this goal accomplishes"
  },
  {
    "title": "Goal title",
    "description": "2-3 sentence description of what this goal accomplishes"
  },
  {
    "title": "Goal title",
    "description": "2-3 sentence description of what this goal accomplishes"
  }
]`;

    console.log('[suggest-goals] Calling Gemini API');
    const responseText = await callGemini(prompt);

    // Parse JSON response - handle markdown code blocks
    let suggestions;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = responseText.trim();

      // Remove markdown code block markers if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7); // Remove ```json
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3); // Remove ```
      }

      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3); // Remove trailing ```
      }

      jsonText = jsonText.trim();
      suggestions = JSON.parse(jsonText);
    } catch (e) {
      console.error('[suggest-goals] Failed to parse JSON response:', responseText);
      console.error('[suggest-goals] Parse error:', e);
      return NextResponse.json(
        { error: 'Failed to parse goal suggestions' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!Array.isArray(suggestions) || suggestions.length !== 3) {
      console.error('[suggest-goals] Invalid suggestions structure:', suggestions);
      return NextResponse.json(
        { error: 'Invalid suggestions format' },
        { status: 500 }
      );
    }

    // Log the interaction
    try {
      await supabase.from('ai_interactions').insert([
        {
          user_id: user.id,
          interaction_type: 'goal_suggestions',
          prompt: careerGoal,
          response: JSON.stringify(suggestions),
          goal_id: null,
        },
      ]);
    } catch (dbError) {
      console.error('[suggest-goals] Failed to log AI interaction:', dbError);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[suggest-goals] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
