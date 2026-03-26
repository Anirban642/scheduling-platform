import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface IDayAvailability {
  isAvailable: boolean;
  slots: ITimeSlot[];
}

export interface IAvailability extends Document {
  userId: mongoose.Types.ObjectId;
  monday: IDayAvailability;
  tuesday: IDayAvailability;
  wednesday: IDayAvailability;
  thursday: IDayAvailability;
  friday: IDayAvailability;
  saturday: IDayAvailability;
  sunday: IDayAvailability;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const DayAvailabilitySchema = new Schema<IDayAvailability>({
  isAvailable: { type: Boolean, default: false },
  slots: [TimeSlotSchema],
}, { _id: false });

const AvailabilitySchema = new Schema<IAvailability>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    monday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    tuesday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    wednesday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    thursday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    friday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    saturday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
    sunday: { type: DayAvailabilitySchema, default: { isAvailable: false, slots: [] } },
  },
  {
    timestamps: true,
  }
);

const Availability: Model<IAvailability> = 
  mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);

export default Availability;