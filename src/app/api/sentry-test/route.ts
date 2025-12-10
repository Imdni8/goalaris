import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('Test error for Sentry - API route');
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Test error captured by Sentry' },
      { status: 500 }
    );
  }
}
