import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  title: string;
  category: string;
  duration: number;
  passingScore: number;
  isPublic: boolean;
  assignedStudents: mongoose.Types.ObjectId[];
  courseId?: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  passingPercentage?: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  allowRetake?: boolean;
  maxAttempts?: number;
  targetSpecializations: mongoose.Types.ObjectId[];
  targetType: 'all' | 'specific';
  createdAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true },
  passingScore: { type: Number, required: true },
  isPublic: { type: Boolean, default: true },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
  startDate: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endDate: { type: String, default: '' },
  endTime: { type: String, default: '' },
  passingPercentage: { type: Number, default: 50 },
  randomizeQuestions: { type: Boolean, default: false },
  randomizeAnswers: { type: Boolean, default: false },
  allowRetake: { type: Boolean, default: false },
  maxAttempts: { type: Number, default: 1 },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
}, { timestamps: true });

export const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
