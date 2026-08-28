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

export async function GET() {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ unreadCount: 0 });

    await connectDB();
    const unreadCount = await Notification.countDocuments({ userId: user.id, isRead: false });
    return NextResponse.json({ unreadCount });
}
