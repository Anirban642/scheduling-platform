import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import EventType from '@/models/EventType';
import Availability from '@/models/Availability';
import Booking from '@/models/Booking';
import { generateTimeSlots, getDayOfWeek } from '@/lib/utils/timeSlots';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const eventSlug = searchParams.get('eventSlug');
    const date = searchParams.get('date');

    if (!username || !eventSlug || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find event type
    const eventType = await EventType.findOne({
      userId: user._id,
      slug: eventSlug,
      isActive: true,
    });

    if (!eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    // Get user's availability
    const availability = await Availability.findOne({ userId: user._id });
    if (!availability) {
      return NextResponse.json({ error: 'Availability not set' }, { status: 404 });
    }

    // Parse the requested date
    const selectedDate = parseISO(date);
    const dayOfWeek = getDayOfWeek(selectedDate);

    // Get day availability
    const dayAvailability = availability[dayOfWeek as keyof typeof availability];

    // Get existing bookings for the selected date
    const existingBookings = await Booking.find({
      hostId: user._id,
      startTime: {
        $gte: startOfDay(selectedDate),
        $lte: endOfDay(selectedDate),
      },
      status: 'confirmed',
    });

    // Generate available time slots
    const availableSlots = generateTimeSlots(
      selectedDate,
      dayAvailability as any,
      eventType.duration,
      existingBookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      user.timeZone
    );

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}