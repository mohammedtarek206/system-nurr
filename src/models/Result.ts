import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  userId?: mongoose.Types.ObjectId;
  studentName: string;
  examId: mongoose.Types.ObjectId;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  flagged: number;
  timeSpentSeconds: number;
  startTime: Date;
  endTime: Date;
  answers: {
    questionId: mongoose.Types.ObjectId;
    selectedOption: number | null;
    isCorrect: boolean;
    isFlagged: boolean;
  }[];
  comments: {
    questionId: mongoose.Types.ObjectId;
    text: string;
  }[];
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 },
  unanswered: { type: Number, default: 0 },
  flagged: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false }
  }],
  comments: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    text: { type: String, required: true }
  }],
}, { timestamps: true });

export const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
