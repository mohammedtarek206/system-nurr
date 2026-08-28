import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return decoded.role === 'admin';
    } catch { return false; }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updated = await Summary.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ message: 'الملخص غير موجود' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { id } = await params;
    await Summary.findByIdAndDelete(id);
    return NextResponse.json({ message: 'تم حذف الملخص بنجاح' });
}
