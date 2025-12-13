import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email is whitelisted
    const { data, error } = await supabase
      .from('beta_whitelist')
      .select('email, signup_completed_at')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return NextResponse.json({
        allowed: false,
        message: 'This email is not authorized for beta access. Request access by joining the waitlist.'
      });
    }

    // Check if already signed up
    if (data.signup_completed_at) {
      return NextResponse.json({
        allowed: false,
        message: 'This email has already been used to create an account.'
      });
    }

    return NextResponse.json({ allowed: true });

  } catch (error) {
    console.error('[check-whitelist] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }
}
