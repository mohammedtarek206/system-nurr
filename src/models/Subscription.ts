import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  sectionIds: mongoose.Types.ObjectId[];
  lessonIds: mongoose.Types.ObjectId[];
  accessType: 'course' | 'section' | 'lesson';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  requestId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionIds: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
  lessonIds: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  accessType: { type: String, enum: ['course', 'section', 'lesson'], default: 'course' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  requestId: { type: Schema.Types.ObjectId, ref: 'SubscriptionRequest' },
}, { timestamps: true });

export const Subscription = mongoose.models.Subscription || 
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
