import mongoose, { Schema, Document } from 'mongoose';

export type LessonProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface ILessonProgress extends Document {
    userId: mongoose.Types.ObjectId;
    lessonId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    status: LessonProgressStatus;
    completedAt?: Date;
    requiredExamId?: mongoose.Types.ObjectId;
    examPassed?: boolean;
    score?: number;
    attemptsCount: number;
    manuallyUnlocked?: boolean;
    unlockedByAdminId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: {
        type: String,
        enum: ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
        default: 'LOCKED'
    },
    completedAt: { type: Date },
    requiredExamId: { type: Schema.Types.ObjectId, ref: 'Exam' },
    examPassed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    attemptsCount: { type: Number, default: 0 },
    manuallyUnlocked: { type: Boolean, default: false },
    unlockedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const LessonProgress = mongoose.models.LessonProgress || mongoose.model<ILessonProgress>('LessonProgress', LessonProgressSchema);
