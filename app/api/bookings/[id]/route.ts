import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { deleteCalendarEvent } from '@/lib/utils/googleCalendar';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // ← Await params

    await connectDB();

    const booking = await Booking.findOne({
      _id: id, // ← Use awaited id
      hostId: session.user.id,
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete from Google Calendar if exists
    if (booking.googleCalendarEventId) {
      const user = await User.findById(session.user.id);
      if (user?.googleCalendarToken) {
        try {
          await deleteCalendarEvent(
            user.googleCalendarToken,
            booking.googleCalendarEventId
          );
        } catch (error) {
          console.error('Failed to delete from Google Calendar:', error);
        }
      }
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // TODO: Send cancellation emails

    return NextResponse.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}