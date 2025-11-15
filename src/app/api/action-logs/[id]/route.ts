import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH - Update an action log
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, status, blocker_description } = body;

    // Verify action log belongs to user
    const { data: existingLog, error: fetchError } = await supabase
      .from('action_logs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingLog) {
      return NextResponse.json(
        { error: 'Action log not found' },
        { status: 404 }
      );
    }

    // Update action log
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (blocker_description !== undefined)
      updates.blocker_description = blocker_description;

    const { data, error } = await supabase
      .from('action_logs')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error updating action log:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an action log
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify action log belongs to user before deleting
    const { data: existingLog, error: fetchError } = await supabase
      .from('action_logs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingLog) {
      return NextResponse.json(
        { error: 'Action log not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('action_logs')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting action log:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
