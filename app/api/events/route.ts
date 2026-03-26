import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import EventType from '@/models/EventType';
import { eventTypeSchema } from '@/lib/validations/eventType';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const eventTypes = await EventType.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = eventTypeSchema.parse(body);

    await connectDB();

    // Check if slug already exists for this user
    const existingEvent = await EventType.findOne({
      userId: session.user.id,
      slug: validatedData.slug,
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event type with this slug already exists' },
        { status: 400 }
      );
    }

    // Create event type
    const eventType = await EventType.create({
      userId: session.user.id,
      title: validatedData.title,
      slug: validatedData.slug,
      description: validatedData.description || '',
      duration: validatedData.duration,
      color: validatedData.color || '#3b82f6',
      isActive: true,
    });

    return NextResponse.json(
      { message: 'Event type created successfully', eventType },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating event type:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    );
  }
}