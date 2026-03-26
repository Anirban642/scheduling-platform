import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // ← ADD THIS IMPORT
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import EventType from '@/models/EventType';
import Booking from '@/models/Booking';
import { addMinutes, parseISO } from 'date-fns';
import { z } from 'zod';
import { createCalendarEvent } from '@/lib/utils/googleCalendar';

const bookingSchema = z.object({
  username: z.string(),
  eventSlug: z.string(),
  startTime: z.string(),
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestNotes: z.string().optional(),
  timeZone: z.string(),
});

// GET method - Fetch user's bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'upcoming';

    await connectDB();

    const now = new Date();
    let query: any = { hostId: session.user.id };

    if (filter === 'upcoming') {
      query.startTime = { $gte: now };
      query.status = 'confirmed';
    } else if (filter === 'past') {
      query.startTime = { $lt: now };
      query.status = 'confirmed';
    } else if (filter === 'cancelled') {
      query.status = 'cancelled';
    }

    const bookings = await Booking.find(query)
      .populate('eventTypeId', 'title duration')
      .sort({ startTime: filter === 'past' ? -1 : 1 })
      .limit(50);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST method - Create new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = bookingSchema.parse(body);

    await connectDB();

    // Find user
    const user = await User.findOne({ username: validatedData.username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find event type
    const eventType = await EventType.findOne({
      userId: user._id,
      slug: validatedData.eventSlug,
      isActive: true,
    });

    if (!eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    // Parse start time and calculate end time
    const startTime = parseISO(validatedData.startTime);
    const endTime = addMinutes(startTime, eventType.duration);

    // Check if slot is still available
    const conflictingBooking = await Booking.findOne({
      hostId: user._id,
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await Booking.create({
      eventTypeId: eventType._id,
      hostId: user._id,
      guestName: validatedData.guestName,
      guestEmail: validatedData.guestEmail,
      guestNotes: validatedData.guestNotes || '',
      startTime,
      endTime,
      timeZone: validatedData.timeZone,
      status: 'confirmed',
    });

    // Add to Google Calendar if user has connected
    let googleEventId = null;
    if (user.googleCalendarToken) {
      try {
        const calendarEvent = await createCalendarEvent(
          user.googleCalendarToken,
          {
            summary: `${eventType.title} with ${validatedData.guestName}`,
            description: `Meeting scheduled via ScheduleMe\n\nGuest: ${validatedData.guestName}\nEmail: ${validatedData.guestEmail}\n\nNotes: ${validatedData.guestNotes || 'None'}`,
            startTime,
            endTime,
            attendees: [validatedData.guestEmail],
            timeZone: validatedData.timeZone,
          }
        );

        googleEventId = calendarEvent.id || null;

        // Update booking with Google Calendar event ID
        if (googleEventId) {
          await Booking.findByIdAndUpdate(booking._id, {
            googleCalendarEventId: googleEventId,
          });
        }
      } catch (calendarError) {
        console.error('Failed to add to Google Calendar:', calendarError);
        // Continue even if calendar sync fails
      }
    }

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: {
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          eventTitle: eventType.title,
          hostName: user.name,
          calendarSynced: !!googleEventId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}