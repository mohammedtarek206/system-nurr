import mongoose, { Schema, Document } from 'mongoose';

export interface IAttemptAnswer {
    questionId: mongoose.Types.ObjectId;
    selectedOptionOriginalIndex: number | null; // original index in DB (null = unanswered)
    answeredAt?: Date;
}

export interface IAnswerOrder {
    questionId: mongoose.Types.ObjectId;
    shuffledOrder: number[]; // e.g. [2,0,3,1] = original indices in display order
}

export interface IExamAttempt extends Document {
    userId: mongoose.Types.ObjectId;
    examId: mongoose.Types.ObjectId;
    examType?: 'REGULAR' | 'NIGHT_EXAM' | 'NCLEX';
    studentName: string;
    // Randomized order of question IDs (as stored in DB)
    questionOrder: mongoose.Types.ObjectId[];
    // Per-question shuffled answer display order
    answerOrders: IAnswerOrder[];
    // Student's answers keyed by questionId
    answers: IAttemptAnswer[];
    // Flagged question IDs
    flaggedQuestions: mongoose.Types.ObjectId[];
    startedAt: Date;
    submittedAt?: Date;
    // Calculated on submit
    score?: number;
    earnedPoints?: number;
    totalPoints?: number;
    percentage?: number;
    correctCount?: number;
    wrongCount?: number;
    unansweredCount?: number;
    timeSpentSeconds?: number;
    status: 'IN_PROGRESS' | 'SUBMITTING' | 'COMPLETED' | 'EXPIRED';
    resultId?: mongoose.Types.ObjectId;
}

const ExamAttemptSchema = new Schema<IExamAttempt>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    examType: { type: String, enum: ['REGULAR', 'NIGHT_EXAM', 'NCLEX'], default: 'REGULAR' },
    studentName: { type: String, required: true },
    questionOrder: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    answerOrders: [{
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        shuffledOrder: [{ type: Number }]
    }],
    answers: [{
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedOptionOriginalIndex: { type: Number, default: null },
        answeredAt: { type: Date }
    }],
    flaggedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    startedAt: { type: Date, required: true, default: Date.now },
    submittedAt: { type: Date },
    score: { type: Number },
    earnedPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number },
    correctCount: { type: Number },
    wrongCount: { type: Number },
    unansweredCount: { type: Number },
    timeSpentSeconds: { type: Number },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'SUBMITTING', 'COMPLETED', 'EXPIRED'],
        default: 'IN_PROGRESS'
    },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result' }
}, { timestamps: true });

export const ExamAttempt = mongoose.models.ExamAttempt || mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
