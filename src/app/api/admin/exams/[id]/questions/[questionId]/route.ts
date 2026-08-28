import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { questionId } = await params;
    const data = await req.json();

    try {
        const pointsNum = Number(data.points);
        const validPoints = !isNaN(pointsNum) && pointsNum > 0 ? pointsNum : 1;

        const question = await Question.findByIdAndUpdate(
            questionId,
            {
                text: data.text,
                clinicalCase: data.clinicalCase || '',
                options: data.options,
                correctAnswer: Number(data.correctAnswer) || 0,
                points: validPoints,
                explanation: data.explanation || '',
                order: Number(data.order) || 0
            },
            { new: true }
        );

        if (!question) return NextResponse.json({ message: "السؤال غير موجود" }, { status: 404 });
        return NextResponse.json({ message: "تم تحديث السؤال بنجاح", question });
    } catch (error: any) {
        return NextResponse.json({ message: "خطأ أثناء تحديث السؤال" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { questionId } = await params;

    try {
        await Question.findByIdAndDelete(questionId);
        return NextResponse.json({ message: "تم حذف السؤال بنجاح" });
    } catch (error) {
        return NextResponse.json({ message: "خطأ أثناء حذف السؤال" }, { status: 500 });
    }
}
