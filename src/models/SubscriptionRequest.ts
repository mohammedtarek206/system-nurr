import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionRequest extends Document {
  name: string;
  email: string;
  phone: string;
  country: string;
  profession: string;
  courseName: string;
  courseId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, default: '' },
  profession: { type: String, default: '' },
  courseName: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export const SubscriptionRequest = mongoose.models.SubscriptionRequest || 
  mongoose.model<ISubscriptionRequest>('SubscriptionRequest', SubscriptionRequestSchema);
