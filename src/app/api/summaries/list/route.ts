import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { SummaryCategory } from '@/models/SummaryCategory';
import { SummaryAccessSession } from '@/models/SummaryAccessSession';
import { SummaryAccessLog } from '@/models/SummaryAccessLog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function validateSession(req: Request) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('summary_session')?.value;
    if (!sessionId) return { valid: false, userId: null };

    await connectDB();
    const session = await SummaryAccessSession.findOne({ sessionId });
    if (!session) return { valid: false, userId: null };
    if (session.expiresAt < new Date()) {
        await SummaryAccessSession.deleteOne({ sessionId });
        return { valid: false, userId: null };
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    return { valid: true, userId: session.userId, sessionId };
}

export async function GET(req: Request) {
    const { valid, userId, sessionId } = await validateSession(req);
    if (!valid) {
        return NextResponse.json({ message: 'غير مصرح بالوصول. يرجى إدخال كود الدخول.', unauthorized: true }, { status: 401 });
    }

    await connectDB();

    // Ensure SummaryCategory model is registered
    SummaryCategory;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const fileType = searchParams.get('fileType');

    // Get specialization from auth token
    let specializationId: string | null = null;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            specializationId = decoded.specializationId || null;
        } catch (e) { }
    }

    // Build query - only published summaries
    const query: any = { status: 'published' };

    // Target audience filter
    if (specializationId) {
        query.$or = [
            { targetType: 'all' },
            { targetType: 'specific', targetSpecializations: specializationId }
        ];
    } else {
        query.targetType = 'all';
    }

    if (category) query.categoryId = category;
    if (fileType) query.fileType = fileType;
    if (search) query.title = { $regex: search, $options: 'i' };

    const summaries = await Summary.find(query)
        .populate('categoryId', 'name arName')
        .sort({ order: 1, createdAt: -1 })
        .lean();

    // Strip drive URL from response (we'll proxy it)
    const safeSummaries = summaries.map(({ driveUrl, ...rest }) => ({
        ...rest,
        hasFile: !!driveUrl,
    }));

    return NextResponse.json(safeSummaries);
}
