import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { ExamAttempt } from '@/models/ExamAttempt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  await connectDB();
  const { id: examId } = await params;
  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ message: 'Exam not found' }, { status: 404 });

  // Scheduling checks
  if (exam.startDate && exam.startTime) {
    const st = new Date(`${exam.startDate}T${exam.startTime}`);
    if (new Date() < st) return NextResponse.json({ message: `الامتحان لم يبدأ بعد. يبدأ: ${st.toLocaleString('ar')}` }, { status: 403 });
  }
  if (exam.endDate && exam.endTime) {
    const et = new Date(`${exam.endDate}T${exam.endTime}`);
    if (new Date() > et) return NextResponse.json({ message: 'انتهى وقت الامتحان.' }, { status: 403 });
  }

  // Count questions
  const questionsCount = await Question.countDocuments({ examId });

  return NextResponse.json({ exam: { ...exam.toObject(), questionsCount } });
}
