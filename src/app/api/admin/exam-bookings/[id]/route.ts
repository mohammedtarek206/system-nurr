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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const updated = await ExamBooking.findByIdAndUpdate(id, body, { new: true });
        if (!updated) {
            return NextResponse.json({ message: 'الحجز غير موجود' }, { status: 404 });
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error('[ADMIN PUT EXAM BOOKING ERROR]', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        const deleted = await ExamBooking.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ message: 'الحجز غير موجود' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'تم حذف الحجز بنجاح' }, { status: 200 });
    } catch (error: any) {
        console.error('[ADMIN DELETE EXAM BOOKING ERROR]', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}
