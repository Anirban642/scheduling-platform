import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );
}

export function getAuthUrl(userId: string) {
  const oauth2Client = getGoogleOAuthClient();

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId,
    prompt: 'consent',
  });
}

export async function getCalendarClient(tokens: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}) {
  const oauth2Client = getGoogleOAuthClient();

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Check if token is expired and refresh if needed
  const tokenInfo = await oauth2Client.getAccessToken();
  if (!tokenInfo.token) {
    throw new Error('Failed to get access token');
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createCalendarEvent(
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  },
  eventDetails: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees: string[];
    timeZone: string;
  }
) {
  try {
    const calendar = await getCalendarClient(tokens);

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: eventDetails.timeZone,
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: eventDetails.timeZone,
      },
      attendees: eventDetails.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  },
  eventId: string
) {
  try {
    const calendar = await getCalendarClient(tokens);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

export async function checkCalendarConflicts(
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  },
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const calendar = await getCalendarClient(tokens);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
    });

    const events = response.data.items || [];
    return events.length > 0;
  } catch (error) {
    console.error('Error checking calendar conflicts:', error);
    return false;
  }
}