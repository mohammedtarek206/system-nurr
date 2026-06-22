import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  score: number;
  percentage: number;
  totalQuestions: number;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
}, { timestamps: true });

export const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
