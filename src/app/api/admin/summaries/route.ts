import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { SummaryCategory } from '@/models/SummaryCategory';
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

export async function GET() {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    SummaryCategory; // ensure model is registered
    const summaries = await Summary.find().populate('categoryId', 'name arName').sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(summaries);
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const { title, description, categoryId, driveUrl, fileType, targetType, targetSpecializations, status, order, coverImage } = body;

    if (!title || !categoryId || !driveUrl || !fileType) {
        return NextResponse.json({ message: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 });
    }

    const summary = await Summary.create({
        title, description, categoryId, driveUrl, fileType,
        targetType: targetType || 'all',
        targetSpecializations: targetSpecializations || [],
        status: status || 'draft',
        order: order || 0,
        coverImage: coverImage || '',
    });

    return NextResponse.json(summary, { status: 201 });
}
