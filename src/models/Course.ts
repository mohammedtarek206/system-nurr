import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
