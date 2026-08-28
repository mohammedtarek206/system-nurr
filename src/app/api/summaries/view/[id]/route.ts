import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { SummaryAccessSession } from '@/models/SummaryAccessSession';
import { SummaryAccessLog } from '@/models/SummaryAccessLog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function validateSession() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('summary_session')?.value;
    if (!sessionId) return { valid: false, userId: null, sessionId: null };

    await connectDB();
    const session = await SummaryAccessSession.findOne({ sessionId });
    if (!session || session.expiresAt < new Date()) {
        if (session) await SummaryAccessSession.deleteOne({ sessionId });
        return { valid: false, userId: null, sessionId: null };
    }

    session.lastActivity = new Date();
    await session.save();

    return { valid: true, userId: session.userId, sessionId };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { valid, userId, sessionId } = await validateSession();

    if (!valid) {
        return NextResponse.json({ message: 'غير مصرح بالوصول', unauthorized: true }, { status: 401 });
    }

    await connectDB();

    // Get user specialization for audience check
    let specializationId: string | null = null;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            specializationId = decoded.specializationId || null;
        } catch (e) { }
    }

    const summary = await Summary.findById(id).populate('categoryId', 'name arName');
    if (!summary) {
        return NextResponse.json({ message: 'الملخص غير موجود' }, { status: 404 });
    }
    if (summary.status !== 'published') {
        return NextResponse.json({ message: 'هذا الملخص غير متاح حالياً' }, { status: 403 });
    }

    // Audience check (backend)
    if (summary.targetType === 'specific') {
        if (!specializationId || !summary.targetSpecializations?.some((id: any) => id.toString() === specializationId)) {
            return NextResponse.json({ message: 'هذا الملخص غير متاح لتخصصك الحالي' }, { status: 403 });
        }
    }

    // Increment views
    await Summary.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Log access
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
    await SummaryAccessLog.create({
        userId: userId || null,
        summaryId: summary._id,
        sessionId: sessionId || '',
        accessedAt: new Date(),
        ipAddress: ip,
        action: 'open',
    });

    // Convert Google Drive URL to embed-friendly URL
    // Never expose raw drive URL - convert to embed URL server-side
    const rawUrl = summary.driveUrl;
    let viewerUrl = '';

    // Extract Google Drive file ID and create embed
    const driveMatch = rawUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
    if (driveMatch) {
        const fileId = driveMatch[1];
        viewerUrl = summary.fileType === 'pdf'
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    } else {
        viewerUrl = rawUrl; // fallback
    }

    const { driveUrl: _stripped, ...safeData } = summary.toObject();

    return NextResponse.json({
        ...safeData,
        viewerUrl,
    });
}
