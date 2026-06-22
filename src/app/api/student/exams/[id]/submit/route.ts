import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { Result } from '@/models/Result';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
  } catch (e) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { answers } = await req.json();
  
  const exam = await Exam.findById(params.id);
  const questions = await Question.find({ examId: params.id });
  
  if (!questions || questions.length === 0) {
    return NextResponse.json({ message: "لا توجد أسئلة في هذا الامتحان" }, { status: 400 });
  }

  let score = 0;
  questions.forEach((q) => {
    if (answers[q._id.toString()] === q.correctAnswer) {
      score += 1;
    }
  });

  const percentage = Math.round((score / questions.length) * 100);

  const result = await Result.create({
    userId: user.id,
    examId: exam._id,
    score,
    percentage,
    totalQuestions: questions.length
  });

  return NextResponse.json({ 
    score, 
    percentage, 
    passed: percentage >= exam.passingScore 
  });
}
