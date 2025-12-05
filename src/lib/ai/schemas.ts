import { z } from 'zod';

/**
 * Zod schemas for validating AI responses
 */

export const SmartGoalSchema = z.object({
  title: z.string().describe('Goal title'),
  specific: z.string().describe('Specific aspect'),
  measurable: z.string().describe('Measurable metrics'),
  achievable: z.string().describe('Why it is achievable'),
  relevant: z.string().describe('Relevance to role'),
  time_bound: z.string().describe('Target date'),
  description: z.string().optional().describe('Overall description'),
});

export type SmartGoal = z.infer<typeof SmartGoalSchema>;

export const TaskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().describe('Task description'),
  order_index: z.number().describe('Order in sequence'),
  estimated_duration: z.string().optional().describe('Time estimate'),
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskBreakdownSchema = z.array(TaskSchema).describe('Array of tasks');

export type TaskBreakdown = z.infer<typeof TaskBreakdownSchema>;

/**
 * Parse and validate AI responses
 */

export function parseSmartGoalResponse(content: string): SmartGoal {
  try {
    // Strip markdown code blocks if present
    let jsonContent = content.trim();

    console.log('[parseSmartGoalResponse] Raw content length:', content.length);
    console.log('[parseSmartGoalResponse] First 200 chars:', content.substring(0, 200));

    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Try to extract JSON if there's extra text
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    console.log('[parseSmartGoalResponse] Cleaned JSON length:', jsonContent.length);

    const parsed = JSON.parse(jsonContent);
    console.log('[parseSmartGoalResponse] Parsed object keys:', Object.keys(parsed).join(', '));

    const validated = SmartGoalSchema.parse(parsed);
    console.log('[parseSmartGoalResponse] Successfully validated SMART goal');
    return validated;
  } catch (error) {
    console.error('[parseSmartGoalResponse] Parse error:', error);
    console.error('[parseSmartGoalResponse] Content that failed to parse:', content.substring(0, 500));
    throw new Error(`Failed to parse SMART goal response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseTaskBreakdownResponse(content: string): TaskBreakdown {
  try {
    // Strip markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(jsonContent);
    return TaskBreakdownSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to parse task breakdown response: ${error}`);
  }
}
