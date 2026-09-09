import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();

        const adminUser = await User.findById(decoded.id);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ message: "غير مصرح للآدمن فقط" }, { status: 403 });
        }

        const exam = await Exam.findById(id);
        if (!exam) {
            return NextResponse.json({ message: "الامتحان غير موجود" }, { status: 404 });
        }

        const { questions } = await req.json();
        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ message: "يرجى تقديم قائمة الأسئلة." }, { status: 400 });
        }

        // Validate each question
        const questionsToInsert: any[] = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || q.correctAnswer === undefined) {
                return NextResponse.json({ message: `السؤال رقم ${i + 1} غير مكتمل البيانات.` }, { status: 400 });
            }

            questionsToInsert.push({
                examId: exam._id,
                text: q.text,
                clinicalCase: q.clinicalCase || '',
                options: q.options,
                correctAnswer: Number(q.correctAnswer),
                points: Number(q.points) || 1,
                explanation: q.explanation || '',
                order: q.order !== undefined ? q.order : i + 1
            });
        }

        const createdQuestions = await Question.insertMany(questionsToInsert);

        return NextResponse.json({
            message: `تم حفظ ${createdQuestions.length} سؤالاً بنجاح في الامتحان.`,
            questions: createdQuestions
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}
