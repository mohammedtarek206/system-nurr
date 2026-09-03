import connectDB from '@/lib/db';
import { Notification, NotificationType, NotificationPriority } from '@/models/Notification';
import { NotificationPreference } from '@/models/NotificationPreference';
import { User } from '@/models/User';
import mongoose from 'mongoose';

interface SendNotificationOptions {
    userId: string | mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    contentId?: string;
    contentType?: 'course' | 'video' | 'exam' | 'summary' | 'announcement' | 'certificate' | 'subscription' | 'system';
    priority?: NotificationPriority;
}

interface SendToAudienceOptions {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    contentId?: string;
    contentType?: 'course' | 'video' | 'exam' | 'summary' | 'announcement' | 'certificate' | 'subscription' | 'system';
    priority?: NotificationPriority;
    targetType?: 'all' | 'specific';
    targetSpecializations?: string[];
    targetStudents?: string[];
    courseId?: string;
}

export async function sendNotificationToUser(options: SendNotificationOptions) {
    try {
        await connectDB();
        const { userId, type, title, message, link, contentId, contentType, priority = 'normal' } = options;

        const uId = userId.toString();

        // 1. Idempotency Check
        if (contentId) {
            const existing = await Notification.findOne({ userId: uId, contentId, type });
            if (existing) return existing;
        }

        // 2. Preference Check
        const pref = await NotificationPreference.findOne({ userId: uId });
        if (pref) {
            if (type === 'NEW_COURSE' && !pref.newCourses) return null;
            if (type === 'NEW_LECTURE' && !pref.newLectures) return null;
            if (type === 'NEW_EXAM' && !pref.newExams) return null;
            if (type === 'NEW_SUMMARY' && !pref.summaries) return null;
            if (type === 'NEW_ANNOUNCEMENT' && !pref.announcements) return null;
            if ((type.startsWith('EXAM_') || type === 'SECTION_UNLOCKED') && !pref.results) return null;
            if (type.startsWith('COURSE_ACTIVATED') && !pref.subscriptionAlerts) return null;
        }

        // 3. Create Notification
        const notif = await Notification.create({
            userId: uId,
            type,
            title,
            message,
            link: link || '',
            contentId: contentId || '',
            contentType: contentType || 'system',
            priority,
            isRead: false
        });

        return notif;
    } catch (error) {
        console.error('Failed to send notification to user:', error);
        return null;
    }
}

export async function sendNotificationToTargetAudience(options: SendToAudienceOptions) {
    try {
        await connectDB();
        const {
            type,
            title,
            message,
            link,
            contentId,
            contentType,
            priority = 'normal',
            targetType = 'all',
            targetSpecializations = [],
            targetStudents = [],
            courseId
        } = options;

        // Build user query for targeting
        const userQuery: any = { role: { $ne: 'admin' } };

        if (targetStudents && targetStudents.length > 0) {
            userQuery._id = { $in: targetStudents };
        } else if (targetType === 'specific' && targetSpecializations && targetSpecializations.length > 0) {
            userQuery.$or = [
                { specializationId: { $in: targetSpecializations } },
                { specialization: { $in: targetSpecializations } }
            ];
        }

        // If courseId is provided, optionally check active course subscriptions if needed
        const targetUsers = await User.find(userQuery).select('_id specialization').lean();
        if (!targetUsers.length) return 0;

        // Filter by user preference & idempotency
        const userIds = targetUsers.map((u: any) => u._id.toString());

        // Check existing notifications for idempotency
        let existingUserIds: string[] = [];
        if (contentId) {
            const existingNotifs = await Notification.find({
                contentId,
                type,
                userId: { $in: userIds }
            }).select('userId').lean();
            existingUserIds = existingNotifs.map((n: any) => n.userId.toString());
        }

        // Check preferences
        const preferences = await NotificationPreference.find({
            userId: { $in: userIds }
        }).lean();
        const prefMap = new Map<string, any>();
        preferences.forEach((p: any) => prefMap.set(p.userId.toString(), p));

        const docsToInsert: any[] = [];

        for (const userObj of targetUsers as any[]) {
            const uIdStr = (userObj._id as any).toString();
            if (existingUserIds.includes(uIdStr)) continue;

            const pref = prefMap.get(uIdStr);
            if (pref) {
                if (type === 'NEW_COURSE' && !pref.newCourses) continue;
                if (type === 'NEW_LECTURE' && !pref.newLectures) continue;
                if (type === 'NEW_EXAM' && !pref.newExams) continue;
                if (type === 'NEW_SUMMARY' && !pref.summaries) continue;
                if (type === 'NEW_ANNOUNCEMENT' && !pref.announcements) continue;
            }

            docsToInsert.push({
                userId: userObj._id,
                type,
                title,
                message,
                link: link || '',
                contentId: contentId || '',
                contentType: contentType || 'system',
                priority,
                isRead: false,
                sentAt: new Date()
            });
        }

        if (docsToInsert.length > 0) {
            await Notification.insertMany(docsToInsert, { ordered: false });
        }

        return docsToInsert.length;
    } catch (error) {
        console.error('Failed to send audience notification:', error);
        return 0;
    }
}
