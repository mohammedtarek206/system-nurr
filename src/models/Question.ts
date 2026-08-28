import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId;
  text: string;
  clinicalCase?: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  text: { type: String, required: true },
  clinicalCase: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  points: { type: Number, required: true, default: 1, min: 0.1 },
  explanation: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
