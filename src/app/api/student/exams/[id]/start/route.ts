import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { ExamAttempt } from '@/models/ExamAttempt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        let user: any;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const exam = await Exam.findById(examId);
        if (!exam) return NextResponse.json({ message: 'Exam not found' }, { status: 404 });

        // Check for active attempt
        const existingAttempt = await ExamAttempt.findOne({
            userId: user.id,
            examId,
            status: 'IN_PROGRESS'
        });
        if (existingAttempt) {
            // Resume existing attempt
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
                return { _id: q._id, text: q.text, clinicalCase: q.clinicalCase || '', options: displayOptions };
            });

            return NextResponse.json({
                attempt: existingAttempt,
                questions: questionsForClient
            });
        }

        // Retake checks
        const completedCount = await ExamAttempt.countDocuments({ userId: user.id, examId, status: 'COMPLETED' });
        if (completedCount > 0 && !exam.allowRetake) {
            return NextResponse.json({ message: 'لا يسمح بإعادة هذا الامتحان.' }, { status: 403 });
        }
        if (completedCount > 0 && exam.maxAttempts && completedCount >= exam.maxAttempts) {
            return NextResponse.json({ message: `استنفدت الحد الأقصى (${exam.maxAttempts}) محاولات.` }, { status: 403 });
        }

        // Scheduling
        if (exam.startDate && exam.startTime) {
            const st = new Date(`${exam.startDate}T${exam.startTime}`);
            if (new Date() < st) return NextResponse.json({ message: `الامتحان لم يبدأ بعد. يبدأ: ${st.toLocaleString('ar')}` }, { status: 403 });
        }
        if (exam.endDate && exam.endTime) {
            const et = new Date(`${exam.endDate}T${exam.endTime}`);
            if (new Date() > et) return NextResponse.json({ message: 'انتهى وقت الامتحان.' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const studentName = body.studentName || user.name || 'طالب';

        // Load all questions
        const rawQuestions = await Question.find({ examId }).select('-__v').lean();
        if (!rawQuestions.length) return NextResponse.json({ message: 'لا توجد أسئلة في هذا الامتحان.' }, { status: 400 });

        // Randomize question order
        const questionList = exam.randomizeQuestions ? shuffle(rawQuestions) : rawQuestions;
        const questionOrder = questionList.map((q: any) => q._id);

        // Randomize answer order per question
        const answerOrders = questionList.map((q: any) => {
            const indices = q.options.map((_: any, i: number) => i);
            const shuffledOrder = exam.randomizeAnswers ? shuffle(indices) : indices;
            return { questionId: q._id, shuffledOrder };
        });

        // Create attempt
        const attempt = await ExamAttempt.create({
            userId: user.id,
            examId,
            studentName,
            questionOrder,
            answerOrders,
            answers: [],
            flaggedQuestions: [],
            startedAt: new Date(),
            status: 'IN_PROGRESS'
        });

        // Build client questions (hide correctAnswer)
        const questionsForClient = questionList.map((q: any) => {
            const ao = answerOrders.find((a: any) => a.questionId.toString() === q._id.toString());
            const shuffledOrder = ao ? ao.shuffledOrder : q.options.map((_: any, i: number) => i);
            const displayOptions = shuffledOrder.map((origIdx: number) => ({
                text: q.options[origIdx],
                originalIndex: origIdx
            }));
            return { _id: q._id, text: q.text, clinicalCase: q.clinicalCase || '', options: displayOptions };
        });

        return NextResponse.json({ attempt, questions: questionsForClient }, { status: 201 });
    } catch (error: any) {
        console.error('[START EXAM ERROR]', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}
