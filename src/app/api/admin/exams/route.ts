import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { parseDateTime } from '@/lib/dateUtils';

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

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const examType = searchParams.get('examType');
  const search = searchParams.get('search');
  const status = searchParams.get('status');

  const query: any = {};
  if (examType && examType !== 'all') {
    query.examType = examType;
  }
  if (status && status !== 'all') {
    query.status = status;
  }
  if (search && search.trim()) {
    query.title = { $regex: search.trim(), $options: 'i' };
  }

  const exams = await Exam.find(query).sort({ order: 1, createdAt: -1 }).lean();

  // Attach total questions and total points for each exam
  const examIds = exams.map(e => e._id);
  const questions = await Question.find({ examId: { $in: examIds } }).lean();

  const examsWithStats = exams.map(exam => {
    const examQuestions = questions.filter(q => q.examId.toString() === exam._id.toString());
    const totalQuestions = examQuestions.length;
    const totalPoints = examQuestions.reduce((acc, q) => acc + (Number(q.points) || 1), 0);
    return {
      ...exam,
      totalQuestions,
      totalPoints
    };
  });

  return NextResponse.json(examsWithStats);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });

  await connectDB();
  try {
    const data = await req.json();

    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ message: "اسم الامتحان مطلوب" }, { status: 400 });
    }

    if (!data.duration || Number(data.duration) <= 0) {
      return NextResponse.json({ message: "مدة الامتحان يجب أن تكون أكبر من 0" }, { status: 400 });
    }

    // Validate Start Date & End Date
    if (data.startDate && data.endDate) {
      const startDT = parseDateTime(data.startDate, data.startTime || '00:00');
      const endDT = parseDateTime(data.endDate, data.endTime || '23:59');
      if (startDT && endDT && endDT < startDT) {
        return NextResponse.json({ message: "تاريخ نهاية الامتحان يجب أن يكون بعد تاريخ البداية." }, { status: 400 });
      }
    }

    const examData = {
      ...data,
      title: data.title.trim(),
      passingScore: Number(data.passingPercentage || data.passingScore || 50),
      passingPercentage: Number(data.passingPercentage || data.passingScore || 50),
      duration: Number(data.duration),
      examType: data.examType || 'REGULAR',
      status: data.status || 'published',
      randomizeQuestions: !!data.randomizeQuestions,
      randomizeAnswers: !!data.randomizeAnswers,
      allowRetake: !!data.allowRetake,
      maxAttempts: Number(data.maxAttempts || 0),
    };

    const exam = await Exam.create(examData);

    if (exam.status === 'published' && exam.isPublic !== false) {
      const { sendNotificationToTargetAudience } = await import('@/lib/notifications');
      sendNotificationToTargetAudience({
        type: 'NEW_EXAM',
        title: 'امتحان جديد متاح',
        message: `تم إضافة امتحان جديد: ${exam.title}`,
        link: `/exams`,
        contentId: `exam_${exam._id}`,
        contentType: 'exam',
        targetType: exam.targetType || 'all',
        targetSpecializations: exam.targetSpecializations || [],
        targetStudents: exam.assignedStudents || []
      }).catch(err => console.error('Exam notification error:', err));
    }

    return NextResponse.json({ message: "تم إنشاء الامتحان بنجاح", exam }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ message: error.message || "خطأ أثناء إنشاء الامتحان" }, { status: 500 });
  }
}
