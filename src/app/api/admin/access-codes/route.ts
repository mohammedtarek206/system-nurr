import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { AccessCode } from '@/models/AccessCode';
import { getContentStatus } from '@/lib/dateUtils';
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
        const codes = await AccessCode.find().sort({ createdAt: -1 }).lean();

        // Dynamically calculate status based on date/time constraints
        const formattedCodes = codes.map((c: any) => {
            let computedStatus = c.status;
            if (c.status !== 'Disabled') {
                computedStatus = getContentStatus({
                    startDate: c.startDate,
                    startTime: c.startTime,
                    endDate: c.endDate,
                    endTime: c.endTime,
                    status: c.status
                });
            }
            return {
                ...c,
                computedStatus
            };
        });

        return NextResponse.json(formattedCodes, { status: 200 });
    } catch (error: any) {
        console.error('[ADMIN GET ACCESS CODES ERROR]', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { code, pageType, startDate, startTime, endDate, endTime, status, maxUses } = body;

        if (!code || !code.trim()) {
            return NextResponse.json({ message: 'كود الوصول مطلوب.' }, { status: 400 });
        }

        if (!pageType || !['NIGHT_EXAM', 'NCLEX'].includes(pageType)) {
            return NextResponse.json({ message: 'نوع الصفحة مطلوب (ليلة الامتحان أو NCLEX).' }, { status: 400 });
        }

        const cleanCode = code.trim().toUpperCase();

        // Check duplicate
        const existing = await AccessCode.findOne({ code: cleanCode, pageType });
        if (existing) {
            return NextResponse.json({ message: 'هذا الكود موجود بالفعل لهذه الصفحة.' }, { status: 400 });
        }

        const newCode = await AccessCode.create({
            code: cleanCode,
            pageType,
            startDate: startDate || '',
            startTime: startTime || '',
            endDate: endDate || '',
            endTime: endTime || '',
            status: status || 'Active',
            maxUses: Number(maxUses) || 0,
            currentUses: 0,
            usedUsers: []
        });

        return NextResponse.json(newCode, { status: 201 });
    } catch (error: any) {
        console.error('[ADMIN POST ACCESS CODE ERROR]', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}
