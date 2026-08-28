import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: 'student' | 'admin';
  specializationId?: mongoose.Types.ObjectId;
  isBanned?: boolean;
  banReason?: string;
  activeSession?: string;
  deviceId?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  specializationId: { type: Schema.Types.ObjectId, ref: 'Specialization' },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  activeSession: { type: String, default: '' },
  deviceId: { type: String, default: '' },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
