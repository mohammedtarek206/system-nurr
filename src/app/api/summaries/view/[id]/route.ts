import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { User } from '@/models/User';
import { SummaryAccessLog } from '@/models/SummaryAccessLog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkContentAccess } from '@/lib/accessControl';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'يجب تسجيل الدخول أولاً للوصول إلى هذا المحتوى.', unauthorized: true }, { status: 401 });
    }

    let user: any = null;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        user = await User.findById(decoded.id);
    } catch (e) {
        return NextResponse.json({ message: 'رمز الجلسة غير صالح.', unauthorized: true }, { status: 401 });
    }

    if (!user) {
        return NextResponse.json({ message: 'المستخدم غير موجود.', unauthorized: true }, { status: 401 });
    }

    const summary = await Summary.findById(id).populate('categoryId', 'name arName');
    if (!summary) {
        return NextResponse.json({ message: 'الملخص غير موجود' }, { status: 404 });
    }

    if (summary.status !== 'published' && user.role !== 'admin') {
        return NextResponse.json({ message: 'هذا الملخص غير متاح حالياً' }, { status: 403 });
    }

    // Check Access Permission via Access System
    const accessRes = await checkContentAccess(
        { id: user._id.toString(), role: user.role, specializationId: user.specializationId?.toString() },
        'SUMMARY',
        id
    );

    if (!accessRes.hasAccess) {
        return NextResponse.json({
            message: accessRes.message || 'غير مصرح لك بالوصول لهذا الملخص.',
            accessStatus: accessRes.status,
            requestDoc: accessRes.requestDoc
        }, { status: 403 });
    }

    // Increment views
    await Summary.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Log access
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
    await SummaryAccessLog.create({
        userId: user._id,
        summaryId: summary._id,
        sessionId: 'user-session',
        accessedAt: new Date(),
        ipAddress: ip,
        action: 'open',
    });

    // Convert Google Drive URL to embed-friendly viewerUrl server-side
    // Never expose raw drive URL to client
    const rawUrl = summary.driveUrl;
    let viewerUrl = '';

    const driveMatch = rawUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
    if (driveMatch) {
        const fileId = driveMatch[1];
        viewerUrl = summary.fileType === 'pdf'
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    } else {
        viewerUrl = rawUrl;
    }

    const { driveUrl: _stripped, ...safeData } = summary.toObject();

    return NextResponse.json({
        ...safeData,
        viewerUrl,
        accessStatus: accessRes.status,
        accessStart: accessRes.accessDoc?.startAt,
        accessEnd: accessRes.accessDoc?.endAt,
    });
}
