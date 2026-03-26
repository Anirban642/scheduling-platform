import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthClient } from '@/lib/utils/googleCalendar';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', req.url));
    }

    const oauth2Client = getGoogleOAuthClient();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/dashboard?error=token_failed', req.url));
    }

    // Save tokens to user
    await connectDB();
    await User.findByIdAndUpdate(state, {
      googleCalendarToken: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
      },
    });

    return NextResponse.redirect(new URL('/dashboard?calendar=connected', req.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=oauth_error', req.url));
  }
}