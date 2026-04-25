import { createClient } from '@/lib/supabase/server';
import { generateTaskBreakdown } from '@/lib/ai/claude';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';
import { snapToWeekdayInRange } from '@/lib/utils/weekdays';

const MODEL = 'gemini-2.5-flash-lite';
const API_ENDPOINT = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

interface TaskDecision {
  taskId: string;
  action: 'carry_forward' | 'drop' | 'break_down';
}

/**
 * Extract task decisions from the monthly check-in conversation using AI
 */
async function extractTaskDecisions(
  conversationHistory: Array<{ role: string; content: string }>,
  pendingTasks: Array<{ id: string; title: string }>
): Promise<TaskDecision[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  const pendingTasksList = pendingTasks.map((t) => `- [${t.id}] ${t.title}`).join('\n');

  const extractionPrompt = `Based on the following conversation, extract what the user decided to do with each pending task.

Pending Tasks:
${pendingTasksList}

Conversation:
${conversationHistory.map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`).join('\n\n')}

For each pending task, determine the user's decision:
- "carry_forward": User decided to move it to the new month
- "drop": User decided to drop/cancel the task
- "break_down": User decided to break it down into smaller tasks

Return a JSON array with this format:
[
  {
    "taskId": "task-uuid",
    "action": "carry_forward" | "drop" | "break_down"
  }
]

If a task is not mentioned in the conversation, assume "carry_forward" as default.
Return ONLY the JSON array, no additional text.`;

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
          parts: [{ text: extractionPrompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[resolve-and-generate] Decision extraction error:', errorText);
    // On failure, default all to carry_forward
    return pendingTasks.map((t) => ({
      taskId: t.id,
      action: 'carry_forward' as const,
    }));
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return pendingTasks.map((t) => ({
      taskId: t.id,
      action: 'carry_forward' as const,
    }));
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[resolve-and-generate] Failed to parse decisions:', e);
    return pendingTasks.map((t) => ({
      taskId: t.id,
      action: 'carry_forward' as const,
    }));
  }
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

    const { goalId, newMonth, conversationHistory } = await request.json();

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: goalId is required' },
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

    const previousMonth = goal.current_month;
    if (!previousMonth) {
      return NextResponse.json(
        { error: 'Goal has no current month set' },
        { status: 400 }
      );
    }

    // Fetch pending tasks from previous month
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .eq('month', previousMonth);

    const pendingTasks = (allTasks || []).filter(
      (t) => t.status === 'pending' || t.status === 'todo'
    );

    // Extract decisions from conversation
    console.log('[resolve-and-generate] Extracting task decisions from conversation...');
    const taskDecisions = await extractTaskDecisions(
      conversationHistory,
      pendingTasks.map((t) => ({ id: t.id, title: t.title }))
    );

    // Execute task decisions
    console.log('[resolve-and-generate] Executing task decisions...');
    for (const decision of taskDecisions) {
      const task = pendingTasks.find((t) => t.id === decision.taskId);
      if (!task) continue;

      if (decision.action === 'carry_forward') {
        // Move task to new month and increment reschedule_count
        await supabase
          .from('tasks')
          .update({
            month: newMonth,
            reschedule_count: (task.reschedule_count || 0) + 1,
          })
          .eq('id', decision.taskId);

        console.log(`[resolve-and-generate] Carried forward task ${decision.taskId}`);
      } else if (decision.action === 'drop') {
        // Mark task as dropped
        await supabase
          .from('tasks')
          .update({ status: 'dropped' })
          .eq('id', decision.taskId);

        console.log(`[resolve-and-generate] Dropped task ${decision.taskId}`);
      } else if (decision.action === 'break_down') {
        // Mark original task as dropped (user will create subtasks manually or via new generation)
        await supabase
          .from('tasks')
          .update({ status: 'dropped' })
          .eq('id', decision.taskId);

        console.log(`[resolve-and-generate] Marked task ${decision.taskId} as dropped for break-down`);
      }
    }

    // Extract conversation context for task generation
    const contextFromConversation = conversationHistory
      .filter((msg) => msg.role === 'user')
      .map((msg) => msg.content)
      .join('\n\n');

    // Generate new month's tasks
    // Range = full newMonth (start of newMonth → end of newMonth). The check-in
    // flow can target a future month, so we don't clamp to "today" here.
    console.log('[resolve-and-generate] Generating tasks for new month...');
    const [yearStr, monthStr] = newMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10);
    const startDate = `${newMonth}-01`;
    const endDate = new Date(Date.UTC(year, monthIdx, 0)).toISOString().slice(0, 10);

    const newTasks = await generateTaskBreakdown(
      {
        title: goal.title,
        specific: goal.specific || '',
        measurable: goal.measurable || '',
        achievable: goal.achievable || '',
        relevant: goal.relevant || '',
        time_bound: goal.time_bound || '',
      },
      { startDate, endDate },
      contextFromConversation
    );

    // Get the next order index
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: false })
      .limit(1);

    let startOrderIndex = 1;
    if (existingTasks && existingTasks.length > 0) {
      startOrderIndex = (existingTasks[0].order_index || 0) + 1;
    }

    // Insert new tasks. Snap any weekend due_date the model returned back
    // to the nearest weekday inside [startDate, endDate].
    const tasksToInsert = (newTasks || []).map((task: any, index: number) => ({
      goal_id: goalId,
      title: task.title,
      description: task.description || null,
      due_date: task.due_date ? snapToWeekdayInRange(task.due_date, startDate, endDate) : null,
      month: newMonth,
      status: 'todo',
      order_index: startOrderIndex + index,
      ai_generated: true,
      is_manual: false,
      reschedule_count: 0,
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('[resolve-and-generate] Task insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create tasks' },
        { status: 500 }
      );
    }

    // Update goal: set current_month to new month and add to months_generated
    const monthsGenerated = goal.months_generated || [];
    if (!monthsGenerated.includes(newMonth)) {
      monthsGenerated.push(newMonth);
      monthsGenerated.sort();
    }

    const { error: goalUpdateError } = await supabase
      .from('goals')
      .update({
        current_month: newMonth,
        months_generated: monthsGenerated,
      })
      .eq('id', goalId);

    if (goalUpdateError) {
      console.error('[resolve-and-generate] Goal update error:', goalUpdateError);
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      );
    }

    console.log('[resolve-and-generate] Successfully generated tasks for', newMonth);

    return NextResponse.json({
      success: true,
      tasks: insertedTasks || [],
    });
  } catch (error) {
    console.error('[resolve-and-generate] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
