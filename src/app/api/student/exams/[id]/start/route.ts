import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { ExamAttempt } from '@/models/ExamAttempt';
import { AccessCode } from '@/models/AccessCode';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { parseDateTime } from '@/lib/dateUtils';

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id: examId } = await params;
        const body = await req.json().catch(() => ({}));
        const { studentName, accessCode } = body;

        const token = (await cookies()).get('token')?.value;
        let user: any = null;
        if (token) {
            try {
                user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            } catch { }
        }

        const exam = await Exam.findById(examId);
        if (!exam) return NextResponse.json({ message: 'الامتحان غير موجود' }, { status: 404 });

        // Access Code Check for NIGHT_EXAM & NCLEX
        if (exam.examType === 'NIGHT_EXAM' || exam.examType === 'NCLEX') {
            if (!accessCode || !accessCode.trim()) {
                return NextResponse.json({
                    message: `كود الوصول مطلوب لأداء امتحان ${exam.examType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}`
                }, { status: 403 });
            }

            const cleanCode = accessCode.trim().toUpperCase();
            const codeRecord = await AccessCode.findOne({
                code: cleanCode,
                pageType: exam.examType
            });

            if (!codeRecord) {
                return NextResponse.json({
                    message: `كود الوصول غير صحيح أو لا ينتمي لقسم ${exam.examType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}`
                }, { status: 403 });
            }

            if (codeRecord.status === 'Disabled') {
                return NextResponse.json({ message: 'كود الوصول معطل.' }, { status: 403 });
            }
        }

        const userId = user ? user.id : undefined;
        const finalStudentName = studentName || user?.name || 'طالب';

        // Check for active attempt to resume
        if (userId) {
            const existingAttempt = await ExamAttempt.findOne({
                userId,
                examId,
                status: 'IN_PROGRESS'
            });
            if (existingAttempt) {
                const questions = await Question.find({ examId }).select('-__v').lean();
                const orderedQuestions = existingAttempt.questionOrder.map((qId: any) =>
                    questions.find((q: any) => q._id.toString() === qId.toString())
                ).filter(Boolean);

                const questionsForClient = orderedQuestions.map((q: any) => {
                    const aoEntry = existingAttempt.answerOrders.find(
                        (ao: any) => ao.questionId.toString() === q._id.toString()
                    );
                    const shuffledOrder: number[] = aoEntry ? aoEntry.shuffledOrder : q.options.map((_: any, i: number) => i);
                    const displayOptions = shuffledOrder.map((origIdx: number) => ({
                        text: q.options[origIdx],
                        originalIndex: origIdx
                    }));
                    return {
                        _id: q._id,
                        text: q.text,
                        clinicalCase: q.clinicalCase || '',
                        options: displayOptions,
                        points: q.points || 1
                    };
                });

                return NextResponse.json({
                    attempt: existingAttempt,
                    questions: questionsForClient
                });
            }

            // Retake checks if user exists
            const completedCount = await ExamAttempt.countDocuments({ userId, examId, status: 'COMPLETED' });
            if (completedCount > 0 && !exam.allowRetake) {
                return NextResponse.json({ message: 'لا يسمح بإعادة هذا الامتحان.' }, { status: 403 });
            }
            if (completedCount > 0 && exam.maxAttempts && completedCount >= exam.maxAttempts) {
                return NextResponse.json({ message: `استنفدت الحد الأقصى (${exam.maxAttempts}) محاولات.` }, { status: 403 });
            }
        }

        // Scheduling checks
        const now = new Date();
        if (exam.startDate && exam.startTime) {
            const st = parseDateTime(exam.startDate, exam.startTime);
            if (st && now < st) {
                return NextResponse.json({ message: `الامتحان لم يبدأ بعد. موعد البداية: ${exam.startDate} ${exam.startTime}` }, { status: 403 });
            }
        }
        if (exam.endDate && exam.endTime) {
            const et = parseDateTime(exam.endDate, exam.endTime);
            if (et && now > et) {
                return NextResponse.json({ message: 'انتهى موعد الامتحان.' }, { status: 403 });
            }
        }

        // Load all questions
        const rawQuestions = await Question.find({ examId }).select('-__v').lean();
        if (!rawQuestions.length) return NextResponse.json({ message: 'لا توجد أسئلة في هذا الامتحان بعد.' }, { status: 400 });

        // Randomize question order if ON
        const questionList = exam.randomizeQuestions ? shuffle(rawQuestions) : rawQuestions;
        const questionOrder = questionList.map((q: any) => q._id);

        // Randomize answer order per question if ON
        const answerOrders = questionList.map((q: any) => {
            const indices = q.options.map((_: any, i: number) => i);
            const shuffledOrder = exam.randomizeAnswers ? shuffle(indices) : indices;
            return { questionId: q._id, shuffledOrder };
        });

        // Create attempt
        const attempt = await ExamAttempt.create({
            userId: userId || '000000000000000000000000', // fallback guest ObjectId format if unauthenticated
            examId,
            examType: exam.examType,
            studentName: finalStudentName,
            questionOrder,
            answerOrders,
            answers: [],
            flaggedQuestions: [],
            startedAt: new Date(),
            status: 'IN_PROGRESS'
        });

        // Build client questions hiding correctAnswer
        const questionsForClient = questionList.map((q: any) => {
            const ao = answerOrders.find((a: any) => a.questionId.toString() === q._id.toString());
            const shuffledOrder = ao ? ao.shuffledOrder : q.options.map((_: any, i: number) => i);
            const displayOptions = shuffledOrder.map((origIdx: number) => ({
                text: q.options[origIdx],
                originalIndex: origIdx
            }));
            return {
                _id: q._id,
                text: q.text,
                clinicalCase: q.clinicalCase || '',
                options: displayOptions,
                points: q.points || 1
            };
        });

        return NextResponse.json({ attempt, questions: questionsForClient }, { status: 201 });
    } catch (error: any) {
        console.error('[START EXAM ERROR]', error);
        return NextResponse.json({ message: error.message || 'خطأ في السيرفر أثناء بدء الامتحان' }, { status: 500 });
    }
}
