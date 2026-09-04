import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { AccessCode } from '@/models/AccessCode';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { parseDateTime } from '@/lib/dateUtils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id: examId } = await params;
  const { searchParams } = new URL(req.url);
  const codeParam = searchParams.get('code');

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ message: 'الامتحان غير موجود' }, { status: 404 });

  // Security check: backend isolation by access code and examType
  if (exam.examType === 'NIGHT_EXAM' || exam.examType === 'NCLEX') {
    if (!codeParam || !codeParam.trim()) {
      return NextResponse.json({
        message: `يتطلب كود دخول لتصفح امتحانات ${exam.examType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}`
      }, { status: 403 });
    }

    const cleanCode = codeParam.trim().toUpperCase();
    const codeRecord = await AccessCode.findOne({
      code: cleanCode,
      pageType: exam.examType
    });

    if (!codeRecord) {
      return NextResponse.json({
        message: `كود الوصول غير صحيح أو غير مصرح له بفتح امتحانات ${exam.examType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}`
      }, { status: 403 });
    }

    if (codeRecord.status === 'Disabled') {
      return NextResponse.json({ message: 'كود الوصول معطل' }, { status: 403 });
    }
  }

  // Scheduling checks using server time
  const now = new Date();
  if (exam.startDate && exam.startTime) {
    const st = parseDateTime(exam.startDate, exam.startTime);
    if (st && now < st) {
      return NextResponse.json({
        message: `الامتحان لم يبدأ بعد. موعد البداية: ${exam.startDate} ${exam.startTime}`
      }, { status: 403 });
    }
  }
  if (exam.endDate && exam.endTime) {
    const et = parseDateTime(exam.endDate, exam.endTime);
    if (et && now > et) {
      return NextResponse.json({ message: 'انتهى موعد الامتحان المحدد.' }, { status: 403 });
    }
  }

  // Count questions
  const questionsCount = await Question.countDocuments({ examId });

  return NextResponse.json({
    exam: {
      ...exam.toObject(),
      questionsCount
    }
  });
}
