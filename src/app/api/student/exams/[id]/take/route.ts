import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { Result } from '@/models/Result';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const exam = await Exam.findById((await params).id);
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
  } catch (e) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existingResult = await Result.findOne({ userId: user.id, examId: (await params).id });
  if (existingResult) {
    return NextResponse.json({ message: "لقد قمت بأداء هذا الامتحان مسبقاً ولا يمكنك إعادته مرة أخرى إلا بطلب من الإدارة." }, { status: 403 });
  }
  
  // Exclude correctAnswer to prevent cheating via API inspection
  const questions = await Question.find({ examId: (await params).id }).select('-correctAnswer -createdAt -updatedAt');
  
  return NextResponse.json({ exam, questions });
}
