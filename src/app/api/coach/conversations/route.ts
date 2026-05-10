import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/coach/conversations - Fetch all user conversations
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch standalone coach conversations only (in-goal threads have goal_id set)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .is('goal_id', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Unexpected error in GET /api/coach/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/coach/conversations - Create a new conversation
export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create new conversation with default title
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: user.id,
          title: 'New Conversation',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/coach/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
