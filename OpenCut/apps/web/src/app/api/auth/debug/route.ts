import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    expectedCallback: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/callback/google`
  };

  return NextResponse.json(config);
}