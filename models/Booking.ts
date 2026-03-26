import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBooking extends Document {
  eventTypeId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  googleCalendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'EventType',
      required: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
    },
    guestEmail: {
      type: String,
      required: [true, 'Guest email is required'],
    },
    guestNotes: String,
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    timeZone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    googleCalendarEventId: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BookingSchema.index({ hostId: 1, startTime: 1 });
BookingSchema.index({ guestEmail: 1 });

const Booking: Model<IBooking> = 
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;