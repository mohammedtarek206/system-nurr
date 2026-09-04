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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const exam = await Exam.findById(id).lean();
  if (!exam) return NextResponse.json({ message: "الامتحان غير موجود" }, { status: 404 });

  const questionsCount = await Question.countDocuments({ examId: id });
  return NextResponse.json({ exam: { ...exam, totalQuestions: questionsCount } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  try {
    const data = await req.json();

    if (data.title && !data.title.trim()) {
      return NextResponse.json({ message: "اسم الامتحان مطلوب" }, { status: 400 });
    }

    if (data.duration !== undefined && Number(data.duration) <= 0) {
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

    const updateFields: any = { ...data };
    if (data.passingPercentage !== undefined) {
      updateFields.passingScore = Number(data.passingPercentage);
      updateFields.passingPercentage = Number(data.passingPercentage);
    }

    const updatedExam = await Exam.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedExam) return NextResponse.json({ message: "الامتحان غير موجود" }, { status: 404 });

    return NextResponse.json({ message: "تم تحديث الامتحان بنجاح", exam: updatedExam });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "خطأ أثناء التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  try {
    await Exam.findByIdAndDelete(id);
    await Question.deleteMany({ examId: id });
    return NextResponse.json({ message: "تم حذف الامتحان وأسئلته بنجاح" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "خطأ أثناء الحذف" }, { status: 500 });
  }
}
