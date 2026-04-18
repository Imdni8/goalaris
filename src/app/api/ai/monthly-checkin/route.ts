import { createClient } from '@/lib/supabase/server';
import { MONTHLY_CHECKIN_PROMPT } from '@/lib/ai/prompts';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

const MODEL = 'gemini-2.5-flash-lite';
const API_ENDPOINT = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

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
      console.log(`[monthly-checkin] Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const {
      goalId,
      previousMonth,
      newMonth,
      conversationHistory,
      userMessage,
    } = await request.json();

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: goalId is required' },
        { status: 400 }
      );
    }

    if (!previousMonth || typeof previousMonth !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: previousMonth is required' },
        { status: 400 }
      );
    }

    if (!newMonth || typeof newMonth !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: newMonth is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Invalid input: conversationHistory must be an array' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('[monthly-checkin] GOOGLE_AI_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Fetch goal (ownership-checked)
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch tasks for the previous month (to review)
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .eq('month', previousMonth);

    const completedTasks = (allTasks || []).filter(
      (t) => t.status === 'done'
    );
    const pendingTasks = (allTasks || []).filter(
      (t) => t.status === 'pending' || t.status === 'todo'
    );

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('job_title, company, career_goal')
      .eq('id', user.id)
      .single();

    // Build the system prompt
    const systemPrompt = MONTHLY_CHECKIN_PROMPT({
      goal: {
        title: goal.title,
        specific: goal.specific || '',
        measurable: goal.measurable || '',
        achievable: goal.achievable || '',
        relevant: goal.relevant || '',
        time_bound: goal.time_bound || '',
      },
      userProfile: {
        jobTitle: profile?.job_title,
        company: profile?.company,
        careerGoal: profile?.career_goal,
      },
      previousMonth,
      newMonth,
      completedTasks: completedTasks.map((t) => ({
        title: t.title,
        completion_note: t.completion_note,
      })),
      pendingTasks: pendingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        reschedule_count: t.reschedule_count || 0,
      })),
      conversationHistory,
    });

    // Build contents array
    // For first message, no userMessage is provided, just use initial greeting
    let contents = [
      {
        role: 'user' as const,
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model' as const,
        parts: [
          {
            text: `I'm here to help you review ${previousMonth} and prepare for ${newMonth}. Let me start with a summary of your progress.`,
          },
        ],
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      })),
    ];

    // If there's a user message (not first call), add it
    if (userMessage && typeof userMessage === 'string') {
      contents.push({
        role: 'user' as const,
        parts: [{ text: userMessage }],
      });
    }

    const url = `${API_ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_AI_API_KEY}`;

    console.log('[monthly-checkin] Calling Gemini API for monthly check-in');
    console.log('[monthly-checkin] Goal ID:', goalId);
    console.log('[monthly-checkin] Period:', previousMonth, '→', newMonth);
    console.log('[monthly-checkin] Conversation history length:', conversationHistory.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[monthly-checkin] Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get AI response. Please try again.' },
        { status: 500 }
      );
    }

    // Stream the response back to the client
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    try {
                      const data = JSON.parse(jsonStr);
                      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                      }
                    } catch (e) {
                      console.error('[monthly-checkin] Error parsing final buffer:', e);
                    }
                  }
                }
              }
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch (e) {
                  console.error('[monthly-checkin] Error parsing SSE chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('[monthly-checkin] Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[monthly-checkin] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
