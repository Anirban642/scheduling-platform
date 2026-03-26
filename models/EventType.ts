import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEventType extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  duration: number; // in minutes
  price?: number;
  currency?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventTypeSchema = new Schema<IEventType>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
    },
    description: String,
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 30,
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique slug per user
EventTypeSchema.index({ userId: 1, slug: 1 }, { unique: true });

const EventType: Model<IEventType> = 
  mongoose.models.EventType || mongoose.model<IEventType>('EventType', EventTypeSchema);

export default EventType;