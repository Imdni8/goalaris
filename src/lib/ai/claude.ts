import {
  parseSmartGoalResponse,
  parseTaskBreakdownResponse,
  type SmartGoal,
  type TaskBreakdown,
} from './schemas';
import {
  SMART_GOAL_PROMPT,
  TASK_BREAKDOWN_PROMPT,
  COACHING_PROMPT,
  ASSESSMENT_SUMMARY_PROMPT,
  SMART_REFINEMENT_PROMPT,
  COACH_SYSTEM_PROMPT,
} from './prompts';

const MODEL = 'gemini-2.5-flash-lite';
const API_ENDPOINT = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

export async function callGemini(prompt: string): Promise<string> {
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

  // Log response for debugging
  console.log('Gemini API Response:', JSON.stringify(data, null, 2));

  // Extract text from Gemini response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Failed to extract text. Full response:', data);
    throw new Error('No text response from Gemini');
  }

  return text;
}

/**
 * Generate a SMART goal from raw user input
 */
export async function generateSmartGoal(rawGoalText: string): Promise<SmartGoal> {
  const text = await callGemini(SMART_GOAL_PROMPT(rawGoalText));
  return parseSmartGoalResponse(text);
}

/**
 * Break down a goal into actionable tasks
 * @param goal The goal to break down
 * @param range Optional date range (YYYY-MM-DD) to bound task due dates
 * @param context Optional user context from check-in for task customization
 */
export async function generateTaskBreakdown(goal: {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
}, range?: { startDate: string; endDate: string }, context?: string): Promise<TaskBreakdown> {
  const text = await callGemini(TASK_BREAKDOWN_PROMPT(goal, range, context));
  return parseTaskBreakdownResponse(text);
}

/**
 * Get coaching feedback on goal progress
 */
export async function getCoachingFeedback(
  goal: {
    title: string;
    description: string;
  },
  logs: Array<{
    action_description: string;
    impact_notes?: string;
  }>
): Promise<string> {
  return await callGemini(COACHING_PROMPT(goal, logs));
}

/**
 * Generate assessment summary for self-assessment
 */
export async function generateAssessmentSummary(
  goals: Array<{
    title: string;
    description?: string;
    specific?: string;
    measurable?: string;
    logs: Array<{
      action_description: string;
      impact_notes?: string;
      logged_at: string;
    }>;
  }>,
  dateRange?: { start: string; end: string }
): Promise<string> {
  return await callGemini(ASSESSMENT_SUMMARY_PROMPT(goals, dateRange));
}

/**
 * Refine a SMART goal element based on user feedback
 */
export async function refineSmartElement(
  elementName: string,
  currentValue: string,
  userPrompt: string,
  goalContext: { title: string; description?: string }
): Promise<string> {
  const refinedText = await callGemini(
    SMART_REFINEMENT_PROMPT(elementName, currentValue, userPrompt, goalContext)
  );

  // Return the refined text, trimming any extra whitespace
  return refinedText.trim();
}

/**
 * Stream coach responses for conversational coaching
 */
export async function streamCoachResponse(
  conversationHistory: Array<{ role: string; content: string }>,
  userContext: {
    goals?: Array<{
      title: string;
      description?: string;
      status: string;
      specific?: string;
      measurable?: string;
      tasks?: Array<{
        title: string;
        status: string;
        blocker_description?: string;
      }>;
    }>;
    recentActionLogs?: Array<{
      title: string;
      description?: string;
      status?: string;
      blocker_description?: string;
      created_at: string;
    }>;
  },
  healthMetrics?: {
    goalsNeedingAttention: Array<{
      goal: string;
      reason: string;
      urgency: 'high' | 'medium' | 'low';
    }>;
    chronicBlockers: Array<{
      task: string;
      blockedSince: string;
      duration: string;
      durationDays: number;
    }>;
    blockerPatterns: {
      recurringThemes: Array<{
        theme: string;
        count: number;
        examples: string[];
      }>;
      recentlyResolved: Array<{
        task: string;
        blockedDuration: number;
        resolvedAt: string;
      }>;
    };
    progressVelocity: 'increasing' | 'steady' | 'decreasing';
    recentActivity: {
      last7Days: number;
      previous7Days: number;
      trend: string;
    };
    upcomingDeadlines: Array<{
      goal: string;
      daysUntil: number;
      targetDate: string;
    }>;
  }
): Promise<ReadableStream> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  const url = `${API_ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Build contents array with system prompt and conversation history
  const systemPrompt = COACH_SYSTEM_PROMPT(userContext, healthMetrics);

  // Combine system prompt with conversation history
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: 'I understand. I\'m your career coach, ready to help with coaching and self-assessment. How can I assist you today?' }],
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
  ];

  console.log('[streamCoachResponse] Calling Gemini API...');
  console.log('[streamCoachResponse] URL:', url.replace(/key=.+/, 'key=***'));
  console.log('[streamCoachResponse] Conversation history length:', conversationHistory.length);
  console.log('[streamCoachResponse] Total contents array length:', contents.length);

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

  console.log('[streamCoachResponse] Gemini API response status:', response.status);
  console.log('[streamCoachResponse] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[streamCoachResponse] Gemini API error response:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Create a ReadableStream that parses Server-Sent Events
  const reader = response.body?.getReader();
  if (!reader) {
    console.error('[streamCoachResponse] No response body from Gemini API!');
    throw new Error('No response body');
  }

  console.log('[streamCoachResponse] Got reader from response.body, creating ReadableStream...');

  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        let totalChunks = 0;
        let totalTextChunks = 0;
        let buffer = ''; // Buffer for incomplete SSE lines

        console.log('[StreamCoachResponse] Starting to read from Gemini stream...');

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer before closing
            if (buffer.trim()) {
              console.log(`[StreamCoachResponse] Stream done, processing remaining buffer: "${buffer.substring(0, 200)}..."`);

              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6);
                  try {
                    const data = JSON.parse(jsonStr);
                    console.log('[StreamCoachResponse] [Final] Parsed SSE data:', JSON.stringify(data).substring(0, 200));

                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      totalTextChunks++;
                      console.log(`[StreamCoachResponse] [Final] Text chunk #${totalTextChunks}: "${text.substring(0, 50)}..." (${text.length} chars)`);
                      controller.enqueue(new TextEncoder().encode(text));
                    }
                  } catch (e) {
                    console.error('[StreamCoachResponse] [Final] Error parsing remaining buffer:', e);
                  }
                }
              }
            }

            console.log(`[StreamCoachResponse] Stream complete. Total raw chunks: ${totalChunks}, Total text chunks sent: ${totalTextChunks}`);
            controller.close();
            break;
          }

          // Decode the chunk and append to buffer
          const chunk = decoder.decode(value, { stream: true });
          totalChunks++;

          console.log(`[StreamCoachResponse] Raw chunk #${totalChunks} (${chunk.length} bytes): "${chunk.substring(0, 100)}..."`);

          buffer += chunk;

          // Parse Server-Sent Events format
          const lines = buffer.split('\n');

          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || '';

          console.log(`[StreamCoachResponse] Processing ${lines.length} complete lines`);

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix

              try {
                const data = JSON.parse(jsonStr);

                console.log('[StreamCoachResponse] Parsed SSE data:', JSON.stringify(data).substring(0, 200));

                // Extract text from Gemini streaming response
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                  totalTextChunks++;
                  console.log(`[StreamCoachResponse] Text chunk #${totalTextChunks}: "${text.substring(0, 50)}..." (${text.length} chars)`);
                  // Send text chunk to client
                  controller.enqueue(new TextEncoder().encode(text));
                } else {
                  console.log('[StreamCoachResponse] No text in this SSE chunk, structure:', JSON.stringify(data));
                }
              } catch (e) {
                // Log parse errors with the problematic JSON
                console.error('[StreamCoachResponse] Error parsing SSE chunk:', e);
                console.error('[StreamCoachResponse] Problematic JSON:', jsonStr.substring(0, 200));
              }
            } else if (line.trim()) {
              console.log(`[StreamCoachResponse] Non-data SSE line: "${line.substring(0, 100)}"`);
            }
          }
        }
      } catch (error) {
        console.error('[StreamCoachResponse] Streaming error:', error);
        controller.error(error);
      }
    },
  });
}
