import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
import { Course } from '@/models/Course';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkCourseSubscriptionAccess, getCourseProgressionState } from '@/lib/progressionEngine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        const token = (await cookies()).get('token')?.value;
        if (!token) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'يرجى تسجيل الدخول أولاً للوصول إلى المحاضرة.'
            }, { status: 401 });
        }

        let user: any;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'جلسة التواجد غير صالحة. يرجى إعادة تسجيل الدخول.'
            }, { status: 401 });
        }

        const video = await Video.findById(id).populate('courseId').populate('sectionId');
        if (!video) {
            return NextResponse.json({ error: 'Not found', message: 'المحاضرة غير موجودة' }, { status: 404 });
        }

        // Admin bypass
        if (user.role === 'admin') {
            return NextResponse.json({
                success: true,
                lecture: video.toObject(),
                status: 'UNLOCKED'
            });
        }

        // 1. Course Subscription & Specialization Check
        const courseDoc = await Course.findById(video.courseId._id || video.courseId);
        if (!courseDoc) {
            return NextResponse.json({ error: 'Not found', message: 'الكورس الخاص بالمحاضرة غير موجود' }, { status: 404 });
        }

        const subCheck = await checkCourseSubscriptionAccess(user, courseDoc);
        if (!subCheck.accessible) {
            return NextResponse.json({
                error: 'Forbidden',
                message: subCheck.reason || 'لا يتاح لك الوصول إلى هذه المحاضرة.'
            }, { status: 403 });
        }

        // 2. Progression State Check
        const progressionState = await getCourseProgressionState(user.id, courseDoc._id.toString());
        const lessonItem = progressionState?.lessons.find((l: any) => l._id.toString() === id.toString());

        if (!lessonItem) {
            return NextResponse.json({ error: 'Not found', message: 'المحاضرة غير ممتدة بهذا الكورس' }, { status: 404 });
        }

        if (lessonItem.status === 'LOCKED') {
            return NextResponse.json({
                error: 'Forbidden',
                message: 'المحاضرة مغلقة حالياً. يلزم مشاهدة المحاضرات السابقة أو اجتياز الامتحان الخاص بها بنجاح للفتح.',
                prerequisiteExamId: lessonItem.prerequisiteExamId || lessonItem.examId,
                passingPercentage: lessonItem.passingPercentage
            }, { status: 403 });
        }

        // Return sanitized lecture object with url
        const videoObj = video.toObject();
        return NextResponse.json({
            success: true,
            lecture: {
                ...videoObj,
                url: video.url || video.videoUrl,
                status: lessonItem.status,
                latestScore: lessonItem.latestScore,
                latestPercentage: lessonItem.latestPercentage,
                examPassed: lessonItem.examPassed
            }
        });

    } catch (error: any) {
        console.error('[GET VIDEO DETAIL API ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
