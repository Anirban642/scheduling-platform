import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import EventType from '@/models/EventType';
import { eventTypeSchema } from '@/lib/validations/eventType';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = eventTypeSchema.parse(body);
    const { id } = await params; // ← Await params

    await connectDB();

    const eventType = await EventType.findOne({
      _id: id, // ← Use awaited id
      userId: session.user.id,
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it conflicts
    if (validatedData.slug !== eventType.slug) {
      const existingEvent = await EventType.findOne({
        userId: session.user.id,
        slug: validatedData.slug,
        _id: { $ne: id },
      });

      if (existingEvent) {
        return NextResponse.json(
          { error: 'An event type with this slug already exists' },
          { status: 400 }
        );
      }
    }

    eventType.title = validatedData.title;
    eventType.slug = validatedData.slug;
    eventType.description = validatedData.description || '';
    eventType.duration = validatedData.duration;
    eventType.color = validatedData.color || '#3b82f6';

    await eventType.save();

    return NextResponse.json({
      message: 'Event type updated successfully',
      eventType,
    });
  } catch (error: any) {
    console.error('Error updating event type:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event type' },
      { status: 500 }
    );
  }
}

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

    const eventType = await EventType.findOneAndDelete({
      _id: id, // ← Use awaited id
      userId: session.user.id,
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event type deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event type:', error);
    return NextResponse.json(
      { error: 'Failed to delete event type' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isActive } = body;
    const { id } = await params; // ← Await params

    await connectDB();

    const eventType = await EventType.findOne({
      _id: id, // ← Use awaited id
      userId: session.user.id,
    });

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    eventType.isActive = isActive;
    await eventType.save();

    return NextResponse.json({
      message: 'Event type status updated successfully',
      eventType,
    });
  } catch (error) {
    console.error('Error updating event type status:', error);
    return NextResponse.json(
      { error: 'Failed to update event type status' },
      { status: 500 }
    );
  }
}