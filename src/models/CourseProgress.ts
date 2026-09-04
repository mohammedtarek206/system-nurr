import mongoose, { Schema, Document } from 'mongoose';

export type CourseProgressStatus = 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface ICourseProgress extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    completedLessons: mongoose.Types.ObjectId[];
    completedSections: mongoose.Types.ObjectId[];
    currentLessonId?: mongoose.Types.ObjectId;
    progressPercentage: number;
    status: CourseProgressStatus;
    manuallyUnlocked?: boolean;
    unlockedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    completedSections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    currentLessonId: { type: Schema.Types.ObjectId, ref: 'Video' },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'COMPLETED', 'LOCKED'],
        default: 'IN_PROGRESS'
    },
    manuallyUnlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true });

CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseProgress = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
