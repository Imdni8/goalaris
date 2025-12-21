import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Reorder tasks for a goal
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
    const { goal_id, task_orders } = body;

    // Validate required fields
    if (!goal_id || !task_orders || !Array.isArray(task_orders)) {
      return NextResponse.json(
        { error: 'goal_id and task_orders array are required' },
        { status: 400 }
      );
    }

    // Verify goal belongs to user (security check)
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goal_id)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found or unauthorized' },
        { status: 403 }
      );
    }

    // Update each task's order_index
    // task_orders should be an array of { id: string, order_index: number }
    const updatePromises = task_orders.map(
      (taskOrder: { id: string; order_index: number }) =>
        supabase
          .from('tasks')
          .update({ order_index: taskOrder.order_index })
          .eq('id', taskOrder.id)
          .eq('goal_id', goal_id) // Extra security check
    );

    const results = await Promise.all(updatePromises);

    // Check if any updates failed
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Task reorder errors:', errors);
      return NextResponse.json(
        { error: 'Failed to update some tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: task_orders.length,
    });
  } catch (err) {
    console.error('Error reordering tasks:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
