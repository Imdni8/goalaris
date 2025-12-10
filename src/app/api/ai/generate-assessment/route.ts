import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics';
import { NextRequest, NextResponse } from 'next/server';
import { ASSESSMENT_SUMMARY_PROMPT } from '@/lib/ai/prompts';
import { callGemini } from '@/lib/ai/claude';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Parse request body
    const { goalIds, dateRange } = await request.json();

    // Build query for goals
    let goalsQuery = supabase
      .from('goals')
      .select(`
        id,
        title,
        description,
        specific,
        measurable,
        achievable,
        relevant
      `)
      .eq('user_id', user.id);

    // Filter by specific goals if provided
    if (goalIds && goalIds.length > 0) {
      goalsQuery = goalsQuery.in('id', goalIds);
    }

    const { data: goals, error: goalsError } = await goalsQuery;

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    if (!goals || goals.length === 0) {
      return NextResponse.json(
        { error: 'No goals found for assessment' },
        { status: 404 }
      );
    }

    // Fetch action logs for each goal
    const goalIds_fromDb = goals.map(g => g.id);

    // Get tasks for these goals
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, goal_id')
      .in('goal_id', goalIds_fromDb);

    const taskIds = tasks?.map(t => t.id) || [];

    if (taskIds.length === 0) {
      return NextResponse.json(
        { error: 'No tasks found for the selected goals' },
        { status: 404 }
      );
    }

    // Fetch action logs (using correct column names: title, description, created_at)
    let logsQuery = supabase
      .from('action_logs')
      .select('task_id, title, description, created_at')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });

    // Apply date range filter if provided
    if (dateRange?.start) {
      logsQuery = logsQuery.gte('created_at', dateRange.start);
    }
    if (dateRange?.end) {
      logsQuery = logsQuery.lte('created_at', dateRange.end);
    }

    const { data: actionLogs } = await logsQuery;

    // Map action logs to goals
    const taskToGoalMap = new Map();
    tasks?.forEach(task => {
      taskToGoalMap.set(task.id, task.goal_id);
    });

    const goalLogsMap = new Map<string, typeof actionLogs>();
    actionLogs?.forEach(log => {
      const goalId = taskToGoalMap.get(log.task_id);
      if (goalId) {
        if (!goalLogsMap.has(goalId)) {
          goalLogsMap.set(goalId, []);
        }
        goalLogsMap.get(goalId)!.push(log);
      }
    });

    // Build goals with logs for prompt
    const goalsWithLogs = goals.map(goal => ({
      title: goal.title,
      description: goal.description,
      specific: goal.specific,
      measurable: goal.measurable,
      logs: (goalLogsMap.get(goal.id) || []).map(log => ({
        action_description: log.title,
        impact_notes: log.description || undefined,
        logged_at: log.created_at,
      })),
    }));

    // Filter out goals with no logs
    const goalsWithActivity = goalsWithLogs.filter(g => g.logs.length > 0);

    if (goalsWithActivity.length === 0) {
      return NextResponse.json(
        { error: 'No action logs found for the selected goals and date range' },
        { status: 404 }
      );
    }

    // Generate assessment using AI
    const prompt = ASSESSMENT_SUMMARY_PROMPT(
      goalsWithActivity,
      dateRange ? {
        start: new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        end: new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      } : undefined
    );

    const assessment = await callGemini(prompt);

    // Track assessment_generated event
    await trackEvent('assessment_generated', {
      goalCount: goalsWithActivity.length,
    });

    // Return the generated assessment
    return NextResponse.json({
      assessment: assessment.trim(),
      goalCount: goalsWithActivity.length,
      actionCount: actionLogs?.length || 0,
    });

  } catch (error) {
    console.error('Error generating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to generate assessment' },
      { status: 500 }
    );
  }
}
