import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SummaryAccessCode } from '@/models/SummaryAccessCode';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    const updateData: any = {
        label: body.label,
        active: body.active,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        maxUses: body.maxUses,
    };

    // If a new code is provided, hash it
    if (body.code && body.code.trim()) {
        updateData.codeHash = await bcrypt.hash(body.code.trim().toUpperCase(), 12);
        updateData.currentUses = 0; // Reset usage when code changes
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const updated = await SummaryAccessCode.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) return NextResponse.json({ message: 'الكود غير موجود' }, { status: 404 });

    const { codeHash: _, ...safeCode } = updated as any;
    return NextResponse.json(safeCode);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { id } = await params;
    await SummaryAccessCode.findByIdAndDelete(id);
    return NextResponse.json({ message: 'تم حذف الكود' });
}
