import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
    | 'NEW_LECTURE'
    | 'NEW_COURSE'
    | 'NEW_EXAM'
    | 'NEW_SUMMARY'
    | 'NEW_ANNOUNCEMENT'
    | 'COURSE_ACTIVATED'
    | 'COURSE_EXTENDED'
    | 'COURSE_EXPIRING_SOON'
    | 'COURSE_EXPIRED'
    | 'EXAM_RESULT'
    | 'EXAM_PASSED'
    | 'EXAM_FAILED'
    | 'EXAM_PERFECT_SCORE'
    | 'SECTION_UNLOCKED'
    | 'CERTIFICATE_ISSUED'
    | 'ADMIN_DIRECT';

export type NotificationPriority = 'normal' | 'important' | 'urgent';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    contentId?: string;
    contentType?: 'course' | 'video' | 'exam' | 'summary' | 'announcement' | 'certificate' | 'subscription' | 'system';
    priority: NotificationPriority;
    isRead: boolean;
    readAt?: Date;
    scheduledAt?: Date;
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        required: true,
        enum: [
            'NEW_LECTURE',
            'NEW_COURSE',
            'NEW_EXAM',
            'NEW_SUMMARY',
            'NEW_ANNOUNCEMENT',
            'COURSE_ACTIVATED',
            'COURSE_EXTENDED',
            'COURSE_EXPIRING_SOON',
            'COURSE_EXPIRED',
            'EXAM_RESULT',
            'EXAM_PASSED',
            'EXAM_FAILED',
            'EXAM_PERFECT_SCORE',
            'SECTION_UNLOCKED',
            'CERTIFICATE_ISSUED',
            'ADMIN_DIRECT'
        ]
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    contentId: { type: String, default: '' },
    contentType: {
        type: String,
        enum: ['course', 'video', 'exam', 'summary', 'announcement', 'certificate', 'subscription', 'system'],
        default: 'system'
    },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    scheduledAt: { type: Date },
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, contentId: 1, type: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
