import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Mark as used
    const { error } = await supabase
      .from('beta_whitelist')
      .update({ signup_completed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.error('[mark-signup-complete] Error:', error);
      // Don't fail signup if this fails - it's just tracking
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[mark-signup-complete] Error:', error);
    // Non-critical - don't fail signup
    return NextResponse.json({ success: true });
  }
}
