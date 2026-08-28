import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
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
  const video = await Video.findById((await params).id)
    .populate('courseId', 'title category')
    .populate('sectionId', 'title')
    .populate('targetSpecializations', 'arName name');
  if (!video) return NextResponse.json({ message: "فيديو غير موجود" }, { status: 404 });
  return NextResponse.json(video);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();
  try {
    const data = await req.json();
    const urlToTest = data.videoUrl || data.youtubeUrl;
    if (urlToTest) {
      try {
        new URL(urlToTest);
      } catch {
        return NextResponse.json({ message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
      }
    }

    const payload = { ...data };
    if (urlToTest) {
      payload.videoUrl = urlToTest;
      payload.youtubeUrl = urlToTest;
    }

    const video = await Video.findByIdAndUpdate((await params).id, payload, { new: true })
      .populate('courseId', 'title category')
      .populate('sectionId', 'title')
      .populate('targetSpecializations', 'arName name');

    if (!video) return NextResponse.json({ message: "فيديو غير موجود" }, { status: 404 });
    return NextResponse.json({ message: "تم تحديث بيانات الفيديو بنجاح", video });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();
  await Video.findByIdAndDelete((await params).id);
  return NextResponse.json({ message: "تم حذف المحاضرة بنجاح" }, { status: 200 });
}
