import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  price: number;
  isFree: boolean;
  duration: string;
  instructor: string;
  status: 'active' | 'hidden' | 'draft';
  order: number;
  sectionsCount: number;
  lessonsCount: number;
  category: string;
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  duration: { type: String, default: '' },
  instructor: { type: String, default: '' },
  status: { type: String, enum: ['active', 'hidden', 'draft'], default: 'active' },
  order: { type: Number, default: 0 },
  sectionsCount: { type: Number, default: 0 },
  lessonsCount: { type: Number, default: 0 },
  category: { type: String, default: '' },
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
