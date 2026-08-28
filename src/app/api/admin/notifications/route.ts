import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Notification } from '@/models/Notification';
import { sendNotificationToTargetAudience } from '@/lib/notifications';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch (e) {
        return null;
    }
}

export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const totalNotifications = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    const readCount = await Notification.countDocuments({ isRead: true });

    const recent = await Notification.find()
        .populate('userId', 'fullName email specialization')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    return NextResponse.json({
        stats: {
            total: totalNotifications,
            unread: unreadCount,
            read: readCount,
            delivered: totalNotifications,
            failed: 0
        },
        notifications: recent
    });
}

export async function POST(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const { title, message, link, priority = 'normal', targetType = 'all', targetSpecializations = [], targetStudents = [] } = body;

    if (!title || !message) {
        return NextResponse.json({ message: "Title and message are required" }, { status: 400 });
    }

    const contentId = `custom_notif_${Date.now()}`;

    const recipientsCount = await sendNotificationToTargetAudience({
        type: 'ADMIN_DIRECT',
        title,
        message,
        link: link || '',
        contentId,
        contentType: 'system',
        priority,
        targetType,
        targetSpecializations,
        targetStudents
    });

    return NextResponse.json({
        message: "Notification sent successfully",
        recipientsCount
    });
}
