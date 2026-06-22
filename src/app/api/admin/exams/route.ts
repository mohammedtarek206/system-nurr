import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
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

export async function GET() {
  await connectDB();
  const exams = await Exam.find().sort({ createdAt: -1 });
  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const data = await req.json();
  try {
    const exam = await Exam.create(data);
    return NextResponse.json({ message: "تم إنشاء الامتحان بنجاح", exam }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "خطأ أثناء الإنشاء" }, { status: 500 });
  }
}
