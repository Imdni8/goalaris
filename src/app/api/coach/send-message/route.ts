import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamCoachResponse } from '@/lib/ai/claude';
import { computeHealthMetrics } from '@/lib/coaching/context-analyzer';
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

    // Rate limiting - more lenient for coaching (conversational)
    const identifier = getClientIdentifier(user.id, request);
    const rateLimit = rateLimiter.check(
      identifier,
      RATE_LIMITS.AI_COACHING.limit,
      RATE_LIMITS.AI_COACHING.windowMs
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    // Parse request body
    const { conversationId, message, goalId } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
        },
      ]);

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Auto-generate conversation title from first user message
    if (!conversation.title) {
      // Create a concise title (first 50 chars or until first newline/question mark)
      let title = message.trim().split('\n')[0]; // Take first line
      title = title.split('?')[0]; // Take up to first question mark
      title = title.length > 50 ? title.substring(0, 47) + '...' : title;

      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      console.log('[send-message] Auto-generated conversation title:', title);
    }

    // Fetch conversation history (excluding the message we just added)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation history' },
        { status: 500 }
      );
    }

    // Fetch user context: goals with tasks and action logs
    // If goalId provided, fetch ALL data for that goal; otherwise last 30 days across all goals
    const isGoalFocused = !!goalId;

    let goalsQuery = supabase
      .from('goals')
      .select(`
        id,
        title,
        description,
        status,
        specific,
        measurable,
        time_bound,
        tasks (
          id,
          title,
          status,
          blocker_description,
          goal_id
        )
      `)
      .eq('user_id', user.id);

    if (goalId) {
      goalsQuery = goalsQuery.eq('id', goalId);
    } else {
      goalsQuery = goalsQuery.order('created_at', { ascending: false });
    }

    const { data: goals } = await goalsQuery;

    // Action logs query - conditional based on goal focus
    let logsQuery = supabase
      .from('action_logs')
      .select(`
        id,
        title,
        description,
        status,
        blocker_description,
        blocker_status,
        created_at,
        task_id,
        tasks (
          id,
          title,
          goal_id
        )
      `)
      .eq('user_id', user.id);

    if (goalId && goals && goals.length > 0 && goals[0].tasks) {
      // Goal-focused: fetch ALL logs for this goal's tasks
      const goalTasks = goals[0].tasks.map((t: any) => t.id);
      if (goalTasks.length > 0) {
        logsQuery = logsQuery.in('task_id', goalTasks);
      }
    } else {
      // General: fetch last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      logsQuery = logsQuery.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data: actionLogs } = await logsQuery.order('created_at', { ascending: false });

    // Compute health metrics from the data
    const healthMetrics = computeHealthMetrics(goals || [], actionLogs || []);

    // Build user context
    const userContext = {
      goals: goals || [],
      recentActionLogs: actionLogs || [],
    };

    // Build conversation history (include ALL messages, including the new user message)
    // The AI needs the current user question to respond to!
    const conversationHistory = messages || [];

    // Stream AI response with health metrics
    const stream = await streamCoachResponse(conversationHistory, userContext, healthMetrics);

    // Tee the stream - one for client, one for saving to DB
    const [streamForClient, streamForDB] = stream.tee();

    // Consume the DB stream in the background to save the response
    (async () => {
      try {
        let aiResponse = '';
        const reader = streamForDB.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          aiResponse += text;
          console.log('[SaveToDB] Chunk received:', text.substring(0, 50)); // Debug
        }

        console.log('[SaveToDB] Total AI response length:', aiResponse.length); // Debug

        // Save AI response to database
        const { error: aiMsgError } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: conversationId,
              role: 'assistant',
              content: aiResponse,
            },
          ]);

        if (aiMsgError) {
          console.error('Error saving AI message:', aiMsgError);
        }

        // Auto-generate conversation title if this is the first exchange
        if (!conversation.title || conversation.title === 'New Conversation') {
          const generatedTitle = message.length > 50
            ? message.substring(0, 50) + '...'
            : message;

          const { error: titleError } = await supabase
            .from('conversations')
            .update({ title: generatedTitle })
            .eq('id', conversationId);

          if (titleError) {
            console.error('Error updating conversation title:', titleError);
          }
        }
      } catch (error) {
        console.error('[SaveToDB] Error:', error);
      }
    })();

    // Return the client stream immediately
    return new Response(streamForClient, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/coach/send-message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
