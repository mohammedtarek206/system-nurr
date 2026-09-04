import mongoose, { Schema, Document } from 'mongoose';

export type CourseProgressionMode = 'FREE' | 'SEQUENTIAL' | 'EXAM_REQUIRED';
export type CourseUnlockRule = 'AFTER_SUBSCRIPTION' | 'AFTER_COURSE_COMPLETION' | 'AFTER_FINAL_EXAM' | 'AFTER_PASSING_PERCENTAGE';

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
  targetSpecializations: mongoose.Types.ObjectId[];
  targetType: 'all' | 'specific';
  progressionEnabled?: boolean;
  progressionMode: CourseProgressionMode;
  finalExamId?: mongoose.Types.ObjectId;
  finalPassingPercentage: number;
  nextCourseId?: mongoose.Types.ObjectId;
  unlockRule?: CourseUnlockRule;
  accessDurationDays?: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  createdAt: Date;
  updatedAt: Date;
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
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
  progressionEnabled: { type: Boolean, default: true },
  progressionMode: {
    type: String,
    enum: ['FREE', 'SEQUENTIAL', 'EXAM_REQUIRED'],
    default: 'FREE'
  },
  finalExamId: { type: Schema.Types.ObjectId, ref: 'Exam' },
  finalPassingPercentage: { type: Number, default: 80 },
  nextCourseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  unlockRule: {
    type: String,
    enum: ['AFTER_SUBSCRIPTION', 'AFTER_COURSE_COMPLETION', 'AFTER_FINAL_EXAM', 'AFTER_PASSING_PERCENTAGE'],
    default: 'AFTER_SUBSCRIPTION'
  },
  accessDurationDays: { type: Number, default: 365 },
  startDate: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endDate: { type: String, default: '' },
  endTime: { type: String, default: '' },
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
