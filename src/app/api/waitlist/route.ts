import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to the Google Form waitlist
  const googleFormUrl =
    'https://docs.google.com/forms/d/e/1FAIpQLSecrDKYly6QRscuAoZ56Qp9kFdEVhLA6gbfZ4WtQKIMx0Oldg/viewform?usp=dialog';

  return NextResponse.redirect(googleFormUrl);
}
