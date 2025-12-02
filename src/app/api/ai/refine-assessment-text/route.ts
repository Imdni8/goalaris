import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ASSESSMENT_TEXT_REFINEMENT_PROMPT } from '@/lib/ai/prompts';
import { callGemini } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { selectedText, userInstruction, fullContext } = await request.json();

    if (!selectedText || !userInstruction) {
      return NextResponse.json(
        { error: 'Missing selectedText or userInstruction' },
        { status: 400 }
      );
    }

    // Generate refined text using AI
    const prompt = ASSESSMENT_TEXT_REFINEMENT_PROMPT(
      selectedText,
      userInstruction,
      fullContext
    );

    const refinedText = await callGemini(prompt);

    // Return the refined text
    return NextResponse.json({
      refinedText: refinedText.trim(),
    });

  } catch (error) {
    console.error('Error refining assessment text:', error);
    return NextResponse.json(
      { error: 'Failed to refine text' },
      { status: 500 }
    );
  }
}
