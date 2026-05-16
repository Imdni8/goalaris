import { NextRequest, NextResponse } from 'next/server';

interface RefinementRequest {
  goalDraft: {
    title: string;
    description: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    time_bound: string;
  };
  refinementFeedback: string;
}

async function refineGoal(data: RefinementRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set');
  }

  const { goalDraft, refinementFeedback } = data;

  const prompt = `You are an AI career coach refining a goal based on user feedback.

Current Goal Draft:
Title: ${goalDraft.title}
Description: ${goalDraft.description}

SMART Breakdown:
- Specific: ${goalDraft.specific}
- Measurable: ${goalDraft.measurable}
- Achievable: ${goalDraft.achievable}
- Relevant: ${goalDraft.relevant}
- Time Bound: ${goalDraft.time_bound}

User's Refinement Feedback: "${refinementFeedback}"

Based on this feedback, refine and improve the goal. Make sure the refined goal:
1. Incorporates the user's feedback
2. Maintains all SMART criteria (Specific, Measurable, Achievable, Relevant, Time Bound)
3. Is clear, actionable, and realistic

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "title": "refined goal title",
  "description": "refined description incorporating the feedback",
  "specific": "refined specific component",
  "measurable": "refined measurable component",
  "achievable": "refined achievable component",
  "relevant": "refined relevant component",
  "time_bound": "refined time bound component"
}`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();
  const generatedText = result.candidates[0]?.content?.parts[0]?.text || '';

  // Parse JSON - handle potential markdown code blocks
  let jsonText = generatedText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  const refinedGoal = JSON.parse(jsonText);
  return refinedGoal;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const refinedGoal = await refineGoal(body);

    return NextResponse.json({
      smartGoal: refinedGoal,
    });
  } catch (error) {
    console.error('Error refining goal:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refine goal',
      },
      { status: 500 }
    );
  }
}
