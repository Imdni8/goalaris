import { z } from 'zod';

/**
 * Zod schemas for validating AI responses
 */

export const SmartGoalSchema = z.object({
  title: z.string().describe('Goal title'),
  specific: z.string().describe('Specific aspect'),
  measurable: z.union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (Array.isArray(val)) {
        return val.map((item, idx) => `${idx + 1}. ${item.replace(/^\d+\.\s*/, '')}`).join('\n');
      }
      return val;
    })
    .describe('Measurable metrics'),
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

    // Handle potential control characters in JSON
    // Some AI models may return strings with unescaped control characters
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.log('[parseSmartGoalResponse] First parse attempt failed:', parseError);
      console.log('[parseSmartGoalResponse] Attempting to sanitize control characters...');

      // Sanitize JSON by removing problematic control characters
      // Strategy: Remove all ASCII control characters (0x00-0x1F) except \n, \r, \t which are allowed in JSON strings
      // But remove them ALL since they should be escaped as \\n, \\r, \\t in valid JSON
      const fixedJson = jsonContent.replace(/[\x00-\x1F\x7F]/g, '');

      console.log('[parseSmartGoalResponse] Sanitized JSON (first 200 chars):', fixedJson.substring(0, 200));
      try {
        parsed = JSON.parse(fixedJson);
        console.log('[parseSmartGoalResponse] Successfully parsed after sanitization');
      } catch (retryError) {
        console.error('[parseSmartGoalResponse] Still failed after sanitization:', retryError);
        console.error('[parseSmartGoalResponse] Sanitized content:', fixedJson.substring(0, 600));
        throw retryError;
      }
    }
    console.log('[parseSmartGoalResponse] Parsed object keys:', Object.keys(parsed).join(', '));

    // Log the type of measurable for debugging
    if (parsed.measurable) {
      console.log('[parseSmartGoalResponse] measurable type:', Array.isArray(parsed.measurable) ? 'array' : typeof parsed.measurable);
      console.log('[parseSmartGoalResponse] measurable value:', JSON.stringify(parsed.measurable).substring(0, 100));
    }

    const validated = SmartGoalSchema.parse(parsed);
    console.log('[parseSmartGoalResponse] Successfully validated SMART goal');
    return validated;
  } catch (error) {
    console.error('[parseSmartGoalResponse] Parse error:', error);
    console.error('[parseSmartGoalResponse] Content that failed to parse (first 500 chars):', content.substring(0, 500));
    console.error('[parseSmartGoalResponse] Content (showing control chars):', JSON.stringify(content.substring(0, 500)));
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
