import { createClient } from '@/lib/supabase/server';
import { refineSmartElement } from '@/lib/ai/claude';
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

    const { elementName, currentValue, userPrompt, goalId } = await request.json();

    // Validate input
    if (!elementName || typeof elementName !== 'string') {
      return NextResponse.json({ error: 'Invalid input: elementName is required' }, { status: 400 });
    }

    if (!currentValue || typeof currentValue !== 'string') {
      return NextResponse.json({ error: 'Invalid input: currentValue is required' }, { status: 400 });
    }

    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json({ error: 'Invalid input: userPrompt is required' }, { status: 400 });
    }

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json({ error: 'Invalid input: goalId is required' }, { status: 400 });
    }

    // Fetch goal for context
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('title, description')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    // Refine the SMART element using AI
    const refinedText = await refineSmartElement(
      elementName,
      currentValue,
      userPrompt,
      { title: goal.title, description: goal.description }
    );

    // Log the AI interaction
    await supabase.from('ai_interactions').insert([
      {
        user_id: user.id,
        interaction_type: 'smart_refinement',
        input_data: { elementName, currentValue, userPrompt, goalId },
        output_data: { refinedText },
      },
    ]);

    return NextResponse.json({ refinedText });
  } catch (error) {
    console.error('AI SMART Refinement Error:', error);
    return NextResponse.json(
      { error: 'Failed to refine SMART element. Please try again.' },
      { status: 500 }
    );
  }
}
