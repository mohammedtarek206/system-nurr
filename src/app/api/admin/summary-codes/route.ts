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

export async function GET() {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    // Return all codes but NEVER the hash
    const codes = await SummaryAccessCode.find().sort({ createdAt: -1 }).lean();
    const safeCodes = codes.map(({ codeHash: _, ...rest }) => rest);
    return NextResponse.json(safeCodes);
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    await connectDB();
    const { code, label, active, validFrom, validUntil, maxUses } = await req.json();

    if (!code || !label || !validFrom || !validUntil) {
        return NextResponse.json({ message: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Hash the code - never store plain text
    const codeHash = await bcrypt.hash(code.trim().toUpperCase(), 12);

    const accessCode = await SummaryAccessCode.create({
        codeHash,
        label,
        active: active !== false,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUses: maxUses || 0,
        currentUses: 0,
    });

    const { codeHash: _, ...safeCode } = accessCode.toObject();
    return NextResponse.json(safeCode, { status: 201 });
}
