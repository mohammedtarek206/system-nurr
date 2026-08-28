import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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
    await connectDB();
    const cats = await SummaryCategory.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(cats);
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { name, arName, order } = await req.json();
    if (!name || !arName) return NextResponse.json({ message: 'الاسم مطلوب' }, { status: 400 });
    const cat = await SummaryCategory.create({ name, arName, order: order || 0 });
    return NextResponse.json(cat, { status: 201 });
}

export async function DELETE(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { id } = await req.json();
    await SummaryCategory.findByIdAndDelete(id);
    return NextResponse.json({ message: 'تم حذف الفئة' });
}
