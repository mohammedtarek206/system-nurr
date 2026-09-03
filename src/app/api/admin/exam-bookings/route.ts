import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ExamBooking } from '@/models/ExamBooking';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return false;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return decoded.role === 'admin';
    } catch {
        return false;
    }
}

export async function GET() {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const bookings = await ExamBooking.find()
            .populate('userId', 'fullName email phone')
            .populate('accessCodeId', 'code pageType')
            .sort({ createdAt: -1 });

        return NextResponse.json(bookings, { status: 200 });
    } catch (error: any) {
        console.error('[ADMIN GET EXAM BOOKINGS ERROR]', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
