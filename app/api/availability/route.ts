import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Availability from '@/models/Availability';
import { availabilitySchema } from '@/lib/validations/availability';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let availability = await Availability.findOne({ userId: session.user.id });

    // If no availability exists, create default one
    if (!availability) {
      availability = await Availability.create({
        userId: session.user.id,
        monday: {
          isAvailable: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
        tuesday: {
          isAvailable: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
        wednesday: {
          isAvailable: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
        thursday: {
          isAvailable: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
        friday: {
          isAvailable: true,
          slots: [{ start: '09:00', end: '17:00' }],
        },
        saturday: {
          isAvailable: false,
          slots: [],
        },
        sunday: {
          isAvailable: false,
          slots: [],
        },
      });
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = availabilitySchema.parse(body);

    await connectDB();

    const availability = await Availability.findOneAndUpdate(
      { userId: session.user.id },
      {
        monday: validatedData.monday,
        tuesday: validatedData.tuesday,
        wednesday: validatedData.wednesday,
        thursday: validatedData.thursday,
        friday: validatedData.friday,
        saturday: validatedData.saturday,
        sunday: validatedData.sunday,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'Availability updated successfully',
      availability,
    });
  } catch (error: any) {
    console.error('Error updating availability:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}