import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics';
import { NextResponse } from 'next/server';

// GET - Fetch action logs (optionally filtered by task_id)
export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get task_id from query params
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');

  let query = supabase
    .from('action_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (taskId) {
    query = query.eq('task_id', taskId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST - Create a new action log
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { task_id, title, description, status, blocker_description } = body;

    // Validate required fields
    if (!task_id || !title) {
      return NextResponse.json(
        { error: 'task_id and title are required' },
        { status: 400 }
      );
    }

    // Verify task belongs to user (security check)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('goal_id, goals(user_id)')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // TypeScript workaround for nested query
    const taskData = task as any;
    if (taskData.goals?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to add log to this task' },
        { status: 403 }
      );
    }

    // Create action log
    const { data, error } = await supabase
      .from('action_logs')
      .insert([
        {
          task_id,
          user_id: user.id,
          title,
          description: description || null,
          status: status || 'on_track',
          blocker_description: blocker_description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track action_logged event (don't await to avoid blocking response)
    trackEvent('action_logged', {
      taskId: task_id,
    }).catch(err => console.error('Failed to track action_logged:', err));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error creating action log:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
