import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId;
  text: string;
  clinicalCase?: string;
  options: string[];
  correctAnswer: number;
}

const QuestionSchema = new Schema<IQuestion>({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  text: { type: String, required: true },
  clinicalCase: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
}, { timestamps: true });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
