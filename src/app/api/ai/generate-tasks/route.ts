import { createClient } from '@/lib/supabase/server';
import { generateTaskBreakdown } from '@/lib/ai/claude';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await request.json();

    if (!goalId) {
      return NextResponse.json({ error: 'Invalid input: goalId is required' }, { status: 400 });
    }

    // Fetch the goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Generate task breakdown using Gemini
    const taskBreakdown = await generateTaskBreakdown({
      title: goal.title,
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      time_bound: goal.time_bound || '',
    });

    // Get current max order_index for this goal
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: false })
      .limit(1);

    const startOrderIndex = existingTasks && existingTasks.length > 0
      ? existingTasks[0].order_index + 1
      : 0;

    // Insert generated tasks
    const tasksToInsert = taskBreakdown.map((task, index) => ({
      goal_id: goalId,
      title: task.title,
      description: task.description,
      due_date: null,
      status: 'todo' as const,
      order_index: task.order_index !== undefined ? task.order_index : startOrderIndex + index,
      ai_generated: true,
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('Task insertion error:', insertError);
      return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 });
    }

    // Log the AI interaction
    await supabase.from('ai_interactions').insert([
      {
        user_id: user.id,
        interaction_type: 'task_breakdown',
        goal_id: goalId,
        prompt: `Generate tasks for goal: ${goal.title}`,
        response: JSON.stringify(taskBreakdown),
      },
    ]);

    return NextResponse.json({
      tasks: insertedTasks,
    });
  } catch (error) {
    console.error('AI Task Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks. Please try again.' },
      { status: 500 }
    );
  }
}
