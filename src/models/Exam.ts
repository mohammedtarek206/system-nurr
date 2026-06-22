import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  title: string;
  category: string;
  duration: number;
  passingScore: number;
  isPublic: boolean;
  assignedStudents: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true },
  passingScore: { type: Number, required: true },
  isPublic: { type: Boolean, default: true },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
