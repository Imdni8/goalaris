import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Use the request origin to determine redirect URL (works in any environment)
  const requestUrl = new URL(request.url);
  const redirectUrl = new URL('/', requestUrl.origin);

  // Use 303 status to force GET method on redirect (prevents POST to home page)
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
