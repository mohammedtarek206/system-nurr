import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { LessonProgress } from '@/models/LessonProgress';
import { CourseProgress } from '@/models/CourseProgress';
import { Result } from '@/models/Result';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let admin: any;
        try {
            admin = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            if (admin.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, studentId, targetId, courseId, reason } = body;

        if (!action || !studentId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        if (action === 'UNLOCK_LESSON') {
            if (!targetId || !courseId) return NextResponse.json({ error: 'targetId and courseId required' }, { status: 400 });

            await LessonProgress.updateOne(
                { userId: studentId, lessonId: targetId },
                {
                    $set: {
                        status: 'UNLOCKED',
                        courseId,
                        manuallyUnlocked: true,
                        unlockedByAdminId: admin.id
                    }
                },
                { upsert: true }
            );
        } else if (action === 'LOCK_LESSON') {
            if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

            await LessonProgress.updateOne(
                { userId: studentId, lessonId: targetId },
                {
                    $set: {
                        status: 'LOCKED',
                        manuallyUnlocked: false
                    }
                }
            );
        } else if (action === 'GRANT_COURSE_ACCESS') {
            if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

            await CourseProgress.updateOne(
                { userId: studentId, courseId },
                {
                    $set: {
                        status: 'IN_PROGRESS',
                        manuallyUnlocked: true,
                        unlockedAt: new Date()
                    }
                },
                { upsert: true }
            );
        } else if (action === 'RESET_EXAM_ATTEMPTS') {
            if (!targetId) return NextResponse.json({ error: 'examId (targetId) required' }, { status: 400 });

            await Result.deleteMany({ userId: studentId, examId: targetId });
        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        // Log to AuditLog
        await AuditLog.create({
            adminId: admin.id,
            action,
            studentId,
            targetId,
            reason: reason || 'Admin Manual Override'
        });

        return NextResponse.json({
            success: true,
            message: `تم تنفيذ الإجراء [${action}] بنجاح وتسجيله في سجل التدقيق (Audit Log).`
        });

    } catch (error: any) {
        console.error('[ADMIN PROGRESS OVERRIDE ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
