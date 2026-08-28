import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Notification } from '@/models/Notification';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    } catch (e) {
        return null;
    }
}

export async function PATCH() {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Notification.updateMany(
        { userId: user.id, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    return NextResponse.json({ message: "All notifications marked as read", unreadCount: 0 });
}
