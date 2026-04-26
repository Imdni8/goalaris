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

    // Fetch completed tasks for each goal (PC-8: progress logging is now optional;
    // we treat each completed task as evidence and use its completion_note when present)
    const goalIds_fromDb = goals.map(g => g.id);

    let tasksQuery = supabase
      .from('tasks')
      .select('goal_id, title, completed_at, completion_note')
      .in('goal_id', goalIds_fromDb)
      .eq('status', 'done')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (dateRange?.start) {
      tasksQuery = tasksQuery.gte('completed_at', dateRange.start);
    }
    if (dateRange?.end) {
      tasksQuery = tasksQuery.lte('completed_at', dateRange.end);
    }

    const { data: completedTasks } = await tasksQuery;

    // Map completed tasks to their goals
    const tasksByGoal = new Map<string, NonNullable<typeof completedTasks>>();
    completedTasks?.forEach(task => {
      const list = tasksByGoal.get(task.goal_id) || [];
      list.push(task);
      tasksByGoal.set(task.goal_id, list);
    });

    // Build goals with their completed tasks for the prompt
    const goalsWithTasks = goals.map(goal => ({
      title: goal.title,
      description: goal.description,
      specific: goal.specific,
      measurable: goal.measurable,
      completedTasks: (tasksByGoal.get(goal.id) || []).map(task => ({
        title: task.title,
        completion_note: task.completion_note || undefined,
        completed_at: task.completed_at!,
      })),
    }));

    // Filter out goals with no completed tasks in the period
    const goalsWithActivity = goalsWithTasks.filter(g => g.completedTasks.length > 0);

    if (goalsWithActivity.length === 0) {
      return NextResponse.json(
        { error: 'No completed tasks found for the selected goals and date range' },
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
    }, user.id);

    // Return the generated assessment
    return NextResponse.json({
      assessment: assessment.trim(),
      goalCount: goalsWithActivity.length,
      taskCount: completedTasks?.length || 0,
    });

  } catch (error) {
    console.error('Error generating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to generate assessment' },
      { status: 500 }
    );
  }
}
