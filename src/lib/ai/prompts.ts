/**
 * Prompt templates for Claude AI interactions
 */

export const SMART_GOAL_PROMPT = (rawGoal: string) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const futureDate = new Date(currentDate);
  futureDate.setMonth(currentDate.getMonth() + 6); // 6 months from now

  return `
You are an expert career coach helping employees create SMART goals for their annual performance review.

IMPORTANT: Today's date is ${currentDate.toISOString().split('T')[0]} (${currentYear}). All target dates MUST be in the year ${currentYear} or later.

The user has provided the following goal: "${rawGoal}"

Transform this into a structured SMART goal with the following JSON format:
{
  "title": "Clear, concise goal title",
  "specific": "How is this goal specific and clear?",
  "measurable": "How will success be measured? List 2-4 specific, quantifiable KPIs as an ordered list (e.g., '1. Achieve X metric\n2. Complete Y deliverables\n3. Reach Z milestone')",
  "achievable": "Why is this goal realistic and achievable?",
  "relevant": "How does this goal align with your role/career development?",
  "time_bound": "Target completion date in YYYY-MM-DD format. MUST be between ${currentDate.toISOString().split('T')[0]} and ${futureDate.toISOString().split('T')[0]}. Calculate a realistic date 2-6 months from TODAY (not from 2024!) based on the goal complexity.",
  "description": "Brief overall description of the goal"
}`
};

Ensure the goal is:
- Ambitious but realistic
- Aligned with typical enterprise professional growth
- Specific enough to track progress
- Valuable for self-assessment documentation
- time_bound must be a valid date in YYYY-MM-DD format, not descriptive text

Return ONLY the JSON object, no additional text.
`;

export const TASK_BREAKDOWN_PROMPT = (goal: {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
}) => `
You are an expert project manager helping break down annual goals into actionable tasks.

Goal: ${goal.title}
- Specific: ${goal.specific}
- Measurable: ${goal.measurable}
- Achievable: ${goal.achievable}
- Relevant: ${goal.relevant}
- Target Date: ${goal.time_bound}

Break this goal into 5-8 concrete, actionable tasks that:
1. Progress logically from start to completion
2. Are specific enough to track
3. Include realistic milestones
4. Account for typical enterprise timelines

Return a JSON array with this format:
[
  {
    "title": "Task title",
    "description": "What needs to be done",
    "order_index": 1,
    "estimated_duration": "time estimate if relevant"
  }
]

Return ONLY the JSON array, no additional text.
`;

export const COACHING_PROMPT = (goal: {
  title: string;
  description: string;
}, logs: Array<{action_description: string; impact_notes?: string}>) => `
You are a supportive career coach reviewing progress on an annual goal.

Goal: ${goal.title}
Description: ${goal.description}

Progress logged so far:
${logs.map((log) => `- ${log.action_description}${log.impact_notes ? ` (Impact: ${log.impact_notes})` : ''}`).join('\n')}

Provide coaching feedback that:
1. Acknowledges progress made
2. Identifies patterns or themes in their work
3. Suggests next steps or areas to focus on
4. Encourages reflection on impact

Be encouraging but honest. Keep response to 2-3 paragraphs.
`;

export const ASSESSMENT_SUMMARY_PROMPT = (goals: Array<{
  title: string;
  logs: Array<{action_description: string}>;
}>) => `
You are helping an employee prepare their self-assessment for annual review.

Here are their goals and the progress they've logged:

${goals.map((goal) => `
Goal: ${goal.title}
Progress:
${goal.logs.map((log) => `- ${log.action_description}`).join('\n')}
`).join('\n---\n')}

Create a professional summary (2-3 paragraphs) that:
1. Highlights key accomplishments and contributions
2. Shows tangible impact and results
3. Demonstrates growth and learning
4. Is suitable for inclusion in a formal self-assessment

Make it professional, confident, and evidence-based.
`;

export const SMART_REFINEMENT_PROMPT = (
  elementName: string,
  currentValue: string,
  userPrompt: string,
  goalContext: { title: string; description?: string }
) => `
You are an expert career coach helping refine a SMART goal element.

Goal Title: ${goalContext.title}
${goalContext.description ? `Goal Description: ${goalContext.description}` : ''}

SMART Element: ${elementName}
Current Value: "${currentValue}"

User wants to refine this with the following guidance:
"${userPrompt}"

Rewrite the ${elementName} element to incorporate the user's feedback while maintaining SMART goal best practices.

Return ONLY the refined text for this specific element. Do not include JSON, markdown, or additional formatting - just the improved paragraph text.

Guidelines:
- Keep it concise but comprehensive
- Maintain professional tone suitable for performance reviews
- Make it specific and actionable
- Ensure it aligns with the overall goal

Return ONLY the refined text, nothing else.
`;
