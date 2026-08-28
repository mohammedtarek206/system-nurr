import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { SummaryAccessLog } from '@/models/SummaryAccessLog';
import { SummaryAccessCode } from '@/models/SummaryAccessCode';
import { SummaryAccessSession } from '@/models/SummaryAccessSession';
import { User } from '@/models/User';
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

    // Ensure User model registered for population
    User;

    const [totalSummaries, published, hidden, totalViews, totalLogs] = await Promise.all([
        Summary.countDocuments(),
        Summary.countDocuments({ status: 'published' }),
        Summary.countDocuments({ status: 'hidden' }),
        Summary.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
        SummaryAccessLog.countDocuments(),
    ]);

    // Most viewed summary
    const mostViewed = await Summary.findOne({ status: 'published' }).sort({ views: -1 }).lean();

    // Unique users (logged in)
    const uniqueUsers = await SummaryAccessLog.distinct('userId', { userId: { $ne: null } });

    // Last 20 access logs with user info
    const recentLogs = await SummaryAccessLog.find()
        .populate('userId', 'fullName email')
        .populate('summaryId', 'title')
        .sort({ accessedAt: -1 })
        .limit(20)
        .lean();

    return NextResponse.json({
        totalSummaries,
        published,
        hidden,
        draft: totalSummaries - published - hidden,
        totalViews: totalViews[0]?.total || 0,
        uniqueUsers: uniqueUsers.length,
        mostViewed,
        recentLogs,
    });
}
