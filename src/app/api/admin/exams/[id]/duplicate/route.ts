import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return false;
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        return user.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await checkAdmin())) return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    try {
        interface LeanExamDoc { _id: Types.ObjectId; title: string; status: string; createdAt?: Date; updatedAt?: Date; __v?: number;[key: string]: unknown; }
        interface LeanQuestionDoc { _id: Types.ObjectId; examId: Types.ObjectId; createdAt?: Date; updatedAt?: Date; __v?: number;[key: string]: unknown; }

        const originalExam = await Exam.findById(id).lean<LeanExamDoc>();
        if (!originalExam) return NextResponse.json({ message: "الامتحان الأصلي غير موجود" }, { status: 404 });

        // Exclude _id, createdAt, updatedAt, __v
        const { _id, createdAt, updatedAt, __v, ...examData } = originalExam;

        const duplicatedExam = await Exam.create({
            ...examData,
            title: `${examData.title} (نسخة)`,
            status: 'draft', // default to draft for duplicated exams so admin can review
        });

        // Duplicate questions
        const originalQuestions = await Question.find({ examId: id }).lean<LeanQuestionDoc[]>();
        if (originalQuestions.length > 0) {
            const duplicatedQuestions = originalQuestions.map((q) => {
                const { _id: qId, createdAt: qCa, updatedAt: qUa, __v: qV, examId: oldExamId, ...qData } = q;
                return {
                    ...qData,
                    examId: duplicatedExam._id
                };
            });
            await Question.insertMany(duplicatedQuestions);
        }

        return NextResponse.json({
            message: "تم نسخ الامتحان وجميع أسئلته بنجاح",
            exam: duplicatedExam,
            questionsCount: originalQuestions.length
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error duplicating exam:', error);
        return NextResponse.json({ message: error.message || "خطأ أثناء نسخ الامتحان" }, { status: 500 });
    }
}
