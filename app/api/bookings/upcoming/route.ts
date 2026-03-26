import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Booking from '@/models/Booking';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      hostId: session.user.id,
      startTime: { $gte: now, $lte: sevenDaysLater },
      status: 'confirmed',
    })
      .populate('eventTypeId', 'title')
      .sort({ startTime: 1 })
      .limit(10);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}