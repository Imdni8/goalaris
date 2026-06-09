import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';

/**
 * POST multipart/form-data { file: <pdf> } → { text }
 *
 * Extracts text from an uploaded PDF and returns it. The binary is NEVER stored —
 * it lives only for the duration of this request (the design's "ephemeral" upload).
 * The client drops the returned text into the JD or resume field.
 */
export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  if (!isCoachAgentEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing "file"' }, { status: 400 });
    }
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'PDF is too large (max 10 MB)' }, { status: 413 });
    }

    // Dynamic import keeps the pdf.js bundle out of unrelated routes.
    const { extractText, getDocumentProxy } = await import('unpdf');
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    const clean = (text ?? '').trim();
    if (!clean) {
      return NextResponse.json(
        { error: 'No selectable text found (is this a scanned/image PDF?)' },
        { status: 422 },
      );
    }
    return NextResponse.json({ text: clean });
  } catch (error) {
    console.error('[coach-agent/extract] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read PDF' },
      { status: 500 },
    );
  }
}
