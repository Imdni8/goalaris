import { createClient } from '@/lib/supabase/server';
import { generateSmartGoal } from '@/lib/ai/claude';
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

    const { rawGoalText } = await request.json();

    if (!rawGoalText || typeof rawGoalText !== 'string') {
      return NextResponse.json({ error: 'Invalid input: rawGoalText is required' }, { status: 400 });
    }

    // Generate SMART goal using Claude
    const smartGoal = await generateSmartGoal(rawGoalText);

    // Log the AI interaction
    await supabase.from('ai_interactions').insert([
      {
        user_id: user.id,
        interaction_type: 'goal_generation',
        input_data: { rawGoalText },
        output_data: smartGoal,
      },
    ]);

    return NextResponse.json({ smartGoal });
  } catch (error) {
    console.error('AI Goal Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SMART goal. Please try again.' },
      { status: 500 }
    );
  }
}
