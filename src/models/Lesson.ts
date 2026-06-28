import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson extends Document {
  sectionId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  duration: string;
  zoomLink: string;
  zoomDate: string;
  pdfFile: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '' },
  zoomLink: { type: String, default: '' },
  zoomDate: { type: String, default: '' },
  pdfFile: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
