import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string; // e.g., 'UNLOCK_LESSON', 'LOCK_LESSON', 'GRANT_COURSE_ACCESS', 'RESET_EXAM_ATTEMPTS'
    studentId: mongoose.Types.ObjectId;
    targetId?: mongoose.Types.ObjectId;
    targetType?: string; // 'Lesson', 'Section', 'Course', 'Exam'
    reason?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId },
    targetType: { type: String, default: '' },
    reason: { type: String, default: 'Admin manual override' },
}, { timestamps: true });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
