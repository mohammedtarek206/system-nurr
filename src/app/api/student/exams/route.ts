import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { AccessCode } from '@/models/AccessCode';
import { ExamAttempt } from '@/models/ExamAttempt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { parseDateTime } from '@/lib/dateUtils';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const examType = searchParams.get('examType') || 'REGULAR';
        const accessCode = searchParams.get('accessCode');

        // Authenticated user check (optional - student can be guest or logged in)
        const token = (await cookies()).get('token')?.value;
        let user: any = null;
        if (token) {
            try {
                user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            } catch (e) { }
        }

        // Access code check for protected page types
        if (examType === 'NIGHT_EXAM' || examType === 'NCLEX') {
            if (!accessCode || !accessCode.trim()) {
                return NextResponse.json({
                    message: 'رمز الدخول (Access Code) مطلوب للوصول لهذه الامتحانات.',
                    exams: []
                }, { status: 401 });
            }

            const cleanCode = accessCode.trim().toUpperCase();
            const codeRecord = await AccessCode.findOne({
                code: cleanCode,
                pageType: examType
            });

            if (!codeRecord) {
                return NextResponse.json({
                    message: `كود الوصول غير صحيح أو لا ينتمي لقسم ${examType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}.`,
                    exams: []
                }, { status: 403 });
            }

            if (codeRecord.status === 'Disabled') {
                return NextResponse.json({ message: 'تم تعطيل كود الدخول هذا.', exams: [] }, { status: 403 });
            }

            const now = new Date();
            if (codeRecord.startDate) {
                const startDT = parseDateTime(codeRecord.startDate, codeRecord.startTime);
                if (startDT && now < startDT) {
                    return NextResponse.json({ message: 'كود الدخول لم يبدأ تفعيله بعد.', exams: [] }, { status: 403 });
                }
            }
            if (codeRecord.endDate) {
                const endDT = parseDateTime(codeRecord.endDate, codeRecord.endTime);
                if (endDT && now > endDT) {
                    return NextResponse.json({ message: 'انتهت صلاحية كود الدخول.', exams: [] }, { status: 403 });
                }
            }
        }

        // Find exams strictly matching examType and published status
        const query: any = {
            examType: examType,
            status: 'published'
        };

        // Specialization filter if user logged in
        if (user && user.specialization) {
            query.$or = [
                { targetType: 'all' },
                { targetSpecializations: user.specialization }
            ];
        }

        const exams = await Exam.find(query).sort({ order: 1, createdAt: -1 }).lean();

        const now = new Date();
        const examIds = exams.map(e => e._id);
        const questions = await Question.find({ examId: { $in: examIds } }).lean();

        // Check user completed attempts if user logged in
        let userAttempts: any[] = [];
        if (user) {
            userAttempts = await ExamAttempt.find({
                userId: user.id,
                examId: { $in: examIds },
                status: 'COMPLETED'
            }).lean();
        }

        const processedExams = exams.map((exam: any) => {
            const examQuestions = questions.filter(q => q.examId.toString() === exam._id.toString());
            const questionsCount = examQuestions.length;

            let statusTag: 'AVAILABLE' | 'COMING_SOON' | 'EXAM_ENDED' = 'AVAILABLE';
            let canStart = true;
            let statusMessage = '';

            if (exam.startDate) {
                const startDT = parseDateTime(exam.startDate, exam.startTime || '00:00');
                if (startDT && now < startDT) {
                    statusTag = 'COMING_SOON';
                    canStart = false;
                    statusMessage = `يبدأ بتاريخ ${exam.startDate} الساعة ${exam.startTime || ''}`;
                }
            }

            if (exam.endDate) {
                const endDT = parseDateTime(exam.endDate, exam.endTime || '23:59');
                if (endDT && now > endDT) {
                    statusTag = 'EXAM_ENDED';
                    canStart = false;
                    statusMessage = `انتهى بتاريخ ${exam.endDate} الساعة ${exam.endTime || ''}`;
                }
            }

            const completedCount = userAttempts.filter(a => a.examId.toString() === exam._id.toString()).length;
            if (completedCount > 0 && !exam.allowRetake) {
                canStart = false;
                statusMessage = 'تم تأدية الامتحان مسبقاً (غير مسموح بالإعادة)';
            } else if (completedCount > 0 && exam.maxAttempts && completedCount >= exam.maxAttempts) {
                canStart = false;
                statusMessage = `استنفدت محاولات الإعادة المتاحة (${exam.maxAttempts})`;
            }

            return {
                _id: exam._id,
                title: exam.title,
                description: exam.description || '',
                thumbnail: exam.thumbnail || '',
                examType: exam.examType,
                duration: exam.duration,
                passingPercentage: exam.passingPercentage || exam.passingScore || 50,
                startDate: exam.startDate,
                startTime: exam.startTime,
                endDate: exam.endDate,
                endTime: exam.endTime,
                questionsCount,
                statusTag,
                canStart,
                statusMessage,
                completedCount
            };
        });

        return NextResponse.json({
            success: true,
            examType,
            exams: processedExams
        });

    } catch (error: any) {
        console.error('Error fetching student exams:', error);
        return NextResponse.json({ message: 'خطأ أثناء جلب الامتحانات', exams: [] }, { status: 500 });
    }
}
