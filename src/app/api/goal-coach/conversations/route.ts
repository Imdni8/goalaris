import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/goal-coach/conversations?goal_id=... — list threads for a goal
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = request.nextUrl.searchParams.get('goal_id');
  if (!goalId) {
    return NextResponse.json({ error: 'Missing goal_id' }, { status: 400 });
  }

  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[goal-coach/conversations] list error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }

  return NextResponse.json({ conversations });
}

// POST /api/goal-coach/conversations — create a new thread for a goal
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { goal_id: goalId, title } = await request.json();
  if (!goalId) {
    return NextResponse.json({ error: 'Missing goal_id' }, { status: 400 });
  }

  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      goal_id: goalId,
      title: typeof title === 'string' && title.trim() ? title.trim() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('[goal-coach/conversations] create error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
