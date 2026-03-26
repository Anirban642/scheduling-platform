import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  username: string;
  image?: string;
  emailVerified?: Date;
  googleCalendarToken?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
    },
    image: String,
    emailVerified: Date,
    googleCalendarToken: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;