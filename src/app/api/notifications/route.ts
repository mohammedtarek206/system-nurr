import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Notification } from '@/models/Notification';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        return decoded;
    } catch (e) {
        return null;
    }
}

export async function GET(req: Request) {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const query: any = { userId: user.id };

    if (filter === 'unread') {
        query.isRead = false;
    } else if (filter === 'exams') {
        query.type = { $in: ['NEW_EXAM', 'EXAM_RESULT', 'EXAM_PASSED', 'EXAM_FAILED', 'EXAM_PERFECT_SCORE'] };
    } else if (filter === 'courses') {
        query.type = { $in: ['NEW_COURSE', 'COURSE_ACTIVATED', 'COURSE_EXTENDED', 'COURSE_EXPIRING_SOON', 'COURSE_EXPIRED', 'SECTION_UNLOCKED'] };
    } else if (filter === 'lectures') {
        query.type = 'NEW_LECTURE';
    } else if (filter === 'summaries') {
        query.type = 'NEW_SUMMARY';
    } else if (filter === 'announcements') {
        query.type = 'NEW_ANNOUNCEMENT';
    } else if (filter === 'results') {
        query.type = { $in: ['EXAM_RESULT', 'EXAM_PASSED', 'EXAM_FAILED', 'EXAM_PERFECT_SCORE', 'CERTIFICATE_ISSUED'] };
    } else if (filter === 'system') {
        query.type = { $in: ['ADMIN_DIRECT', 'COURSE_ACTIVATED', 'COURSE_EXTENDED', 'COURSE_EXPIRING_SOON', 'COURSE_EXPIRED'] };
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const unreadCount = await Notification.countDocuments({ userId: user.id, isRead: false });

    return NextResponse.json({
        notifications,
        unreadCount
    });
}
