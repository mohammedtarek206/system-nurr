import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { Result } from '@/models/Result';
import { Certificate } from '@/models/Certificate';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const exam = await Exam.findById((await params).id);
  const questions = await Question.find({ examId: (await params).id });

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

  const processedAnswers = questions.map(q => {
    const selected = answers[q._id.toString()];
    return {
      questionId: q._id,
      selectedOption: selected !== undefined ? selected : null,
      isCorrect: selected === q.correctAnswer,
      isFlagged: false // We will accept flagged from client in payload later
    };
  });

  const result = await Result.create({
    userId: user.id,
    examId: exam._id,
    score,
    percentage,
    totalQuestions: questions.length,
    answers: processedAnswers,
    status: percentage >= exam.passingScore ? 'PASSED' : 'FAILED',
    questionOrder: questions.map(q => q._id),
  });

  const passed = percentage >= exam.passingScore;

  if (passed && exam.courseId) {
    const existingCert = await Certificate.findOne({ userId: user.id, courseId: exam.courseId });
    if (!existingCert) {
      const certNumber = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await Certificate.create({
        userId: user.id,
        courseId: exam.courseId,
        examId: exam._id,
        score,
        percentage,
        certificateNumber: certNumber
      });
    }
  }

  return NextResponse.json({
    score,
    percentage,
    passed,
    answers: processedAnswers,
    questions: questions.map(q => ({
      _id: q._id,
      text: q.text,
      clinicalCase: q.clinicalCase,
      options: q.options,
      correctAnswer: q.correctAnswer
    }))
  });
}
