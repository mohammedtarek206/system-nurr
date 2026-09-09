import mongoose, { Schema, Document } from 'mongoose';

export type ExamType = 'REGULAR' | 'NIGHT_EXAM' | 'NCLEX';
export type ExamStatus = 'published' | 'draft' | 'hidden';

export interface IExam extends Document {
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  examType: ExamType;
  duration: number;
  passingScore: number;
  passingPercentage: number;
  isPublic: boolean;
  status: ExamStatus;
  assignedStudents: mongoose.Types.ObjectId[];
  courseId?: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  allowRetake?: boolean;
  maxAttempts?: number;
  targetSpecializations: mongoose.Types.ObjectId[];
  targetType: 'all' | 'specific';
  accessRequiresApproval?: boolean;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  category: { type: String, default: 'General' },
  examType: {
    type: String,
    enum: ['REGULAR', 'NIGHT_EXAM', 'NCLEX'],
    default: 'REGULAR',
    required: true
  },
  duration: { type: Number, required: true, min: 1 },
  passingScore: { type: Number, default: 50 },
  passingPercentage: { type: Number, default: 50 },
  isPublic: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['published', 'draft', 'hidden'],
    default: 'published'
  },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
  startDate: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endDate: { type: String, default: '' },
  endTime: { type: String, default: '' },
  randomizeQuestions: { type: Boolean, default: false },
  randomizeAnswers: { type: Boolean, default: false },
  allowRetake: { type: Boolean, default: false },
  maxAttempts: { type: Number, default: 1 },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
  accessRequiresApproval: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);

