import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Summary } from '@/models/Summary';
import { SummaryCategory } from '@/models/SummaryCategory';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkContentAccess } from '@/lib/accessControl';

export async function GET(req: Request) {
    await connectDB();

    // Ensure SummaryCategory model is registered
    SummaryCategory;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let user: any = null;
    if (token) {
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            user = await User.findById(decoded.id);
        } catch (e) { }
    }

    if (!user) {
        return NextResponse.json({ message: "يجب تسجيل الدخول أولاً للوصول إلى هذا المحتوى.", unauthorized: true }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const fileType = searchParams.get('fileType');

    // Build query - only published summaries
    const query: any = { status: 'published' };

    // Filter target specialization matching
    if (user.role !== 'admin' && user.specializationId) {
        query.$or = [
            { targetType: 'all' },
            { targetType: 'specific', targetSpecializations: user.specializationId }
        ];
    }

    if (category) query.categoryId = category;
    if (fileType) query.fileType = fileType;
    if (search) query.title = { $regex: search, $options: 'i' };

    const summaries = await Summary.find(query)
        .populate('categoryId', 'name arName')
        .sort({ order: 1, createdAt: -1 })
        .lean();

    // Check access for each summary for this user
    const formattedSummaries = await Promise.all(
        summaries.map(async (summary: any) => {
            const accessRes = await checkContentAccess(
                { id: user._id.toString(), role: user.role, specializationId: user.specializationId?.toString() },
                'SUMMARY',
                summary._id.toString()
            );

            return {
                _id: summary._id,
                title: summary.title,
                description: summary.description,
                categoryId: summary.categoryId,
                fileType: summary.fileType,
                coverImage: summary.coverImage,
                views: summary.views,
                targetType: summary.targetType,
                targetSpecializations: summary.targetSpecializations,
                accessStatus: accessRes.status,
                hasAccess: accessRes.hasAccess,
                accessMessage: accessRes.message,
                startAt: accessRes.accessDoc?.startAt,
                endAt: accessRes.accessDoc?.endAt,
                // NEVER return driveUrl or viewerUrl in listing before verification!
            };
        })
    );

    return NextResponse.json(formattedSummaries);
}
