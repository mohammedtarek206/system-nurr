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

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const notif = await Notification.findOneAndUpdate(
        { _id: id, userId: user.id },
        { isRead: true, readAt: new Date() },
        { new: true }
    );

    if (!notif) return NextResponse.json({ message: "Notification not found" }, { status: 404 });

    const unreadCount = await Notification.countDocuments({ userId: user.id, isRead: false });

    return NextResponse.json({ message: "Marked as read", notification: notif, unreadCount });
}
