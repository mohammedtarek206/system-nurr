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

  const resultsCount = await Result.countDocuments({ userId: user.id, examId: (await params).id });

  if (resultsCount > 0) {
    if (!exam.allowRetake) {
      return NextResponse.json({ message: "لقد قمت بأداء هذا الامتحان مسبقاً ولا يسمح بإعادته." }, { status: 403 });
    }
    if (exam.maxAttempts && resultsCount >= exam.maxAttempts) {
      return NextResponse.json({ message: `لقد استنفدت الحد الأقصى للمحاولات المسموح بها (${exam.maxAttempts}).` }, { status: 403 });
    }
  }

  // Scheduling checks
  if (exam.startDate && exam.startTime) {
    const startDateTime = new Date(`${exam.startDate}T${exam.startTime}`);
    if (new Date() < startDateTime) {
      return NextResponse.json({ message: `Exam has not started yet. Starts at: ${startDateTime.toLocaleString()}` }, { status: 403 });
    }
  }
  if (exam.endDate && exam.endTime) {
    const endDateTime = new Date(`${exam.endDate}T${exam.endTime}`);
    if (new Date() > endDateTime) {
      return NextResponse.json({ message: "This exam is currently unavailable. (Time ended)" }, { status: 403 });
    }
  }

  // Exclude correctAnswer to prevent cheating via API inspection
  let questions = await Question.find({ examId: (await params).id }).select('-correctAnswer -createdAt -updatedAt').lean();

  if (exam.randomizeQuestions) {
    questions.sort(() => Math.random() - 0.5);
  }

  if (exam.randomizeAnswers) {
    questions.forEach((q: any) => {
      if (q.options && Array.isArray(q.options)) {
        const mappedOptions = q.options.map((opt: string, index: number) => ({ text: opt, originalIndex: index }));
        mappedOptions.sort(() => Math.random() - 0.5);
        q.options = mappedOptions;
      }
    });
  }

  return NextResponse.json({ exam, questions });
}
