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

    const { elementName, currentValue, userPrompt, goalContext } = await request.json();

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

    if (!goalContext || !goalContext.title) {
      return NextResponse.json({ error: 'Invalid input: goalContext.title is required' }, { status: 400 });
    }

    // Refine the SMART element using AI
    const refinedText = await refineSmartElement(
      elementName,
      currentValue,
      userPrompt,
      { title: goalContext.title, description: goalContext.description }
    );

    // Log the AI interaction
    await supabase.from('ai_interactions').insert([
      {
        user_id: user.id,
        interaction_type: 'smart_refinement_inline',
        input_data: { elementName, currentValue, userPrompt, goalContext },
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
