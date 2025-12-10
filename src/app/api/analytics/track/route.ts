import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const { eventName, properties } = await request.json();

    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    await trackEvent(eventName, properties || {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return success even on error - analytics shouldn't break the app
    return NextResponse.json({ success: true });
  }
}
