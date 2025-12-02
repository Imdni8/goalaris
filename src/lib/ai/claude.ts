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
 */
export async function generateTaskBreakdown(goal: {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
}): Promise<TaskBreakdown> {
  const text = await callGemini(TASK_BREAKDOWN_PROMPT(goal));
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
    logs: Array<{
      action_description: string;
    }>;
  }>
): Promise<string> {
  return await callGemini(ASSESSMENT_SUMMARY_PROMPT(goals));
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
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Create a ReadableStream that parses Server-Sent Events
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        let totalChunks = 0;
        let buffer = ''; // Buffer for incomplete SSE lines

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log(`[StreamCoachResponse] Stream complete. Total chunks: ${totalChunks}`);
            controller.close();
            break;
          }

          // Decode the chunk and append to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          totalChunks++;

          // Parse Server-Sent Events format
          const lines = buffer.split('\n');

          // Keep the last line in buffer (might be incomplete)
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix

              try {
                const data = JSON.parse(jsonStr);

                // Extract text from Gemini streaming response
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                  console.log(`[StreamCoachResponse] Sending text chunk: ${text.substring(0, 50)}...`);
                  // Send text chunk to client
                  controller.enqueue(new TextEncoder().encode(text));
                }
              } catch (e) {
                // Log parse errors with the problematic JSON
                console.error('[StreamCoachResponse] Error parsing SSE chunk:', e);
                console.error('[StreamCoachResponse] Problematic JSON:', jsonStr.substring(0, 100));
              }
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
