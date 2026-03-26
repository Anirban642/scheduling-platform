import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Availability from '@/models/Availability';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }, { username: validatedData.username }],
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === validatedData.username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });

    // Create default availability (9 AM - 5 PM, Monday to Friday)
    await Availability.create({
      userId: user._id,
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

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}