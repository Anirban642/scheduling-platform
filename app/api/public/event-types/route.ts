import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import EventType from '@/models/EventType';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const slug = searchParams.get('slug');

    if (!username || !slug) {
      return NextResponse.json(
        { error: 'Missing username or slug' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const eventType = await EventType.findOne({
      userId: user._id,
      slug,
      isActive: true,
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eventType: {
        _id: eventType._id,
        title: eventType.title,
        description: eventType.description,
        duration: eventType.duration,
        color: eventType.color,
        user: {
          name: user.name,
          username: user.username,
          image: user.image,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public event type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event type' },
      { status: 500 }
    );
  }
}