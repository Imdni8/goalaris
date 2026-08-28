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
          parts: [{ text: prompt }],
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

    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_GENERATION.limit,
      RATE_LIMITS.AI_GENERATION.windowMs
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const { goalTitle, timeline, stakeholders, successCriteria } = await request.json();

    if (!goalTitle) {
      return NextResponse.json({ error: 'Invalid input: goalTitle is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const currentDate = new Date();
    const futureDate = new Date(currentDate);
    futureDate.setMonth(currentDate.getMonth() + 6);

    const prompt = `You are an expert career coach. Convert the following goal conversation into a structured SMART goal.

Goal Title: ${goalTitle}
Timeline: ${timeline || 'Not specified'}
Stakeholders: ${stakeholders || 'Not specified'}
Success Criteria: ${Array.isArray(successCriteria) ? successCriteria.join(', ') : successCriteria || 'Not specified'}

Create a detailed SMART goal with the following JSON format (NO markdown, ONLY JSON):
{
  "title": "${goalTitle}",
  "description": "A 2-3 sentence description of the goal",
  "specific": "How this goal is specific and clear",
  "measurable": "How success will be measured",
  "achievable": "Why this goal is realistic",
  "relevant": "How this aligns with career development",
  "time_bound": "YYYY-MM-DD format, must be between ${currentDate.toISOString().split('T')[0]} and ${futureDate.toISOString().split('T')[0]}"
}

Return ONLY valid JSON.`;

    const responseText = await callGemini(prompt);

    let smartGoal;
    try {
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();
      smartGoal = JSON.parse(jsonText);
    } catch (e) {
      console.error('[generate-goal-from-conversation] Failed to parse:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse goal generation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ smartGoal });
  } catch (error) {
    console.error('[generate-goal-from-conversation] Error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
