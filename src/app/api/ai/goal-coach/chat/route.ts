import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamGoalCoachResponse, generateThreadTitle } from '@/lib/ai/claude';
import { ensureMonthSummary, findPriorMonthsWithActivity } from '@/lib/coaching/month-summary';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_COACHING.limit,
      RATE_LIMITS.AI_COACHING.windowMs
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const body = await request.json();
    const {
      goal_id: goalId,
      conversation_id: conversationId,
      user_message: userMessage,
      tagged_task_ids: rawTaggedIds,
      seed_system_message: seedSystemMessage,
      trigger_only: triggerOnly,
    } = body;

    if (!goalId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing goal_id or conversation_id' },
        { status: 400 }
      );
    }

    if (!triggerOnly && !userMessage) {
      return NextResponse.json(
        { error: 'Missing user_message' },
        { status: 400 }
      );
    }

    const taggedTaskIds: string[] = Array.isArray(rawTaggedIds)
      ? rawTaggedIds.filter((x): x is string => typeof x === 'string').slice(0, 10)
      : [];

    // Verify goal belongs to user
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify conversation belongs to user and is scoped to this goal
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, title, goal_id, user_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('goal_id', goalId)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Resolve tagged tasks first so we can persist them with the user message metadata.
    let taggedTasks: Array<{ id: string; title: string; description: string | null; status: string | null }> = [];
    if (taggedTaskIds.length > 0) {
      const { data: rows } = await supabase
        .from('tasks')
        .select('id, title, description, status')
        .in('id', taggedTaskIds)
        .eq('goal_id', goalId);
      taggedTasks = rows || [];
    }

    // Save user message (skipped in trigger_only mode where the AI opens the chat).
    if (!triggerOnly) {
      const { error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          metadata:
            taggedTasks.length > 0
              ? { tagged_tasks: taggedTasks.map((t) => ({ id: t.id, title: t.title })) }
              : null,
        });

      if (userMsgError) {
        console.error('[goal-coach/chat] save user msg failed:', userMsgError);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
      }
    }

    // Build context: current month tasks/logs, active blockers, prior summaries
    const currentMonth: string = goal.current_month || new Date().toISOString().slice(0, 7);

    const [
      currentMonthTasksRes,
      activeBlockersRes,
      priorMonths,
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, description, status, due_date, blocker_description, order_index, month')
        .eq('goal_id', goalId)
        .eq('month', currentMonth)
        .order('order_index', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, title, blocker_description, month')
        .eq('goal_id', goalId)
        .not('blocker_description', 'is', null)
        .neq('status', 'done')
        .neq('status', 'completed')
        .neq('status', 'dropped'),
      findPriorMonthsWithActivity(supabase, goalId, currentMonth),
    ]);

    const currentMonthTasks = currentMonthTasksRes.data || [];
    const activeBlockers = (activeBlockersRes.data || []).map((t: any) => ({
      task_title: t.title,
      blocker_description: t.blocker_description,
      month: t.month,
    }));

    // Current month logs: filter by tasks of this goal + this month
    const currentMonthTaskIds = currentMonthTasks.map((t: any) => t.id);
    let currentMonthLogs: any[] = [];
    if (currentMonthTaskIds.length > 0) {
      const { data: logs } = await supabase
        .from('action_logs')
        .select('title, description, status, blocker_description, created_at')
        .in('task_id', currentMonthTaskIds)
        .order('created_at', { ascending: false })
        .limit(30);
      currentMonthLogs = logs || [];
    }

    // Lazily fill in summaries for prior months
    const priorSummaries: Array<{ month: string; summary: string }> = [];
    if (priorMonths.length > 0) {
      const results = await Promise.all(
        priorMonths.map((m) => ensureMonthSummary(supabase, goalId, m, goal.title))
      );
      priorMonths.forEach((m, i) => {
        if (results[i]) priorSummaries.push({ month: m, summary: results[i]! });
      });
    }

    // Conversation history (excludes the message we just added is fine — we'll add it via the streamed response anyway, but for the model context we want it included)
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const conversationHistory = (historyMessages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Stream
    const stream = await streamGoalCoachResponse(
      conversationHistory,
      {
        goal: {
          title: goal.title,
          description: goal.description,
          specific: goal.specific,
          measurable: goal.measurable,
          achievable: goal.achievable,
          relevant: goal.relevant,
          time_bound: goal.time_bound,
          current_month: goal.current_month,
        },
        currentMonth,
        currentMonthTasks: currentMonthTasks as any,
        currentMonthLogs,
        activeBlockers,
        priorMonthSummaries: priorSummaries,
        taggedTasks,
      },
      typeof seedSystemMessage === 'string' ? seedSystemMessage : null
    );

    const [streamForClient, streamForDB] = stream.tee();

    // Persist assistant message + auto-title in background
    (async () => {
      try {
        let aiResponse = '';
        const reader = streamForDB.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value, { stream: true });
        }

        if (aiResponse.trim()) {
          const cleaned = aiResponse
            .replace(/<READY_TO_APPLY>/g, '')
            .replace(/<OPTIONS:\s*[^>]+>/g, '')
            .trim();
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: cleaned,
          });
        }

        // Analytics
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_name: 'goal_coach_message_sent',
          properties: {
            goal_id: goalId,
            conversation_id: conversationId,
            tagged_task_count: taggedTasks.length,
          },
        });

        // Auto-title if first exchange
        if (!conversation.title) {
          try {
            const title = await generateThreadTitle(userMessage);
            if (title) {
              await supabase
                .from('conversations')
                .update({ title })
                .eq('id', conversationId);
            }
          } catch (e) {
            console.error('[goal-coach/chat] title generation failed:', e);
          }
        }
      } catch (e) {
        console.error('[goal-coach/chat] persist error:', e);
      }
    })();

    return new Response(streamForClient, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[goal-coach/chat] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
