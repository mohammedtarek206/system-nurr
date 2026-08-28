import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreference extends Document {
    userId: mongoose.Types.ObjectId;
    newCourses: boolean;
    newLectures: boolean;
    newExams: boolean;
    summaries: boolean;
    announcements: boolean;
    results: boolean;
    subscriptionAlerts: boolean;
    browserNotifications: boolean;
    sound: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    newCourses: { type: Boolean, default: true },
    newLectures: { type: Boolean, default: true },
    newExams: { type: Boolean, default: true },
    summaries: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    results: { type: Boolean, default: true },
    subscriptionAlerts: { type: Boolean, default: true },
    browserNotifications: { type: Boolean, default: false },
    sound: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationPreference = mongoose.models.NotificationPreference ||
    mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
