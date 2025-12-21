import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use service role key to access beta_whitelist table (no RLS)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if email is whitelisted
    const { data, error } = await supabase
      .from('beta_whitelist')
      .select('email, signup_completed_at')
      .eq('email', email.toLowerCase().trim());

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        allowed: false,
        message: 'This email is not authorized for beta access. Request access by joining the waitlist.'
      });
    }

    const whitelistEntry = data[0];

    // Check if already signed up
    if (whitelistEntry.signup_completed_at) {
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
