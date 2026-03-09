import { createClient } from '@/lib/supabase/server';
import { GOAL_CONVERSATION_PROMPT } from '@/lib/ai/prompts';
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
      console.log(`[goal-conversation] Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const {
      conversationHistory,
      userMessage,
      userProfile = {},
      questionCount = 0,
    } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: userMessage is required' },
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
      console.error('[goal-conversation] GOOGLE_AI_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Build the system prompt with user context
    const systemPrompt = GOAL_CONVERSATION_PROMPT(userProfile, conversationHistory, questionCount);

    // Build contents array
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I\'m here to help you create a SMART goal through conversation. What goal would you like to work on today?' }],
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const url = `${API_ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_AI_API_KEY}`;

    console.log('[goal-conversation] Calling Gemini API for goal conversation');
    console.log('[goal-conversation] Conversation history length:', conversationHistory.length);
    console.log('[goal-conversation] Question count:', questionCount);

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
      console.error('[goal-conversation] Gemini API error:', errorText);
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
                      console.error('[goal-conversation] Error parsing final buffer:', e);
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
                  console.error('[goal-conversation] Error parsing SSE chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('[goal-conversation] Streaming error:', error);
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
    console.error('[goal-conversation] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
