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
} from './prompts';

const MODEL = 'gemini-2.5-flash-lite';
const API_ENDPOINT = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

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
