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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const questions = await Question.find({ examId: (await params).id }).sort({ createdAt: 1 });
  return NextResponse.json(questions);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const data = await req.json();
  try {
    const question = await Question.create({
      examId: (await params).id,
      text: data.text,
      options: data.options,
      correctAnswer: data.correctAnswer
    });
    return NextResponse.json({ message: "تم إضافة السؤال بنجاح", question }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "خطأ أثناء إضافة السؤال" }, { status: 500 });
  }
}
