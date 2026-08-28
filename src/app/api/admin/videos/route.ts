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

export async function GET(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const sectionId = searchParams.get('sectionId');
  const videoType = searchParams.get('videoType');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const query: any = {};
  if (courseId) query.courseId = courseId;
  if (sectionId) query.sectionId = sectionId;
  if (videoType) query.videoType = videoType;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const videos = await Video.find(query)
    .populate('courseId', 'title category')
    .populate('sectionId', 'title')
    .populate('targetSpecializations', 'arName name')
    .sort({ order: 1, createdAt: -1 });

  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();
  try {
    const data = await req.json();

    const urlToTest = data.videoUrl || data.youtubeUrl;
    if (!urlToTest || typeof urlToTest !== 'string' || !urlToTest.trim()) {
      return NextResponse.json({ message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
    }

    try {
      new URL(urlToTest);
    } catch {
      return NextResponse.json({ message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
    }

    const payload = {
      ...data,
      videoUrl: urlToTest,
      youtubeUrl: urlToTest,
      videoType: data.videoType || 'zoom',
      status: data.status || 'published',
      order: Number(data.order) || 0
    };

    const video = await Video.create(payload);
    const populated = await Video.findById(video._id)
      .populate('courseId', 'title category')
      .populate('sectionId', 'title')
      .populate('targetSpecializations', 'arName name');

    if (video.status === 'published') {
      const courseTitle = (populated?.courseId as any)?.title || 'الكورس';
      const { sendNotificationToTargetAudience } = await import('@/lib/notifications');
      sendNotificationToTargetAudience({
        type: 'NEW_LECTURE',
        title: 'محاضرة جديدة متاحة',
        message: `تم إضافة محاضرة جديدة "${video.title}" إلى كورس ${courseTitle}`,
        link: `/courses/${video.courseId}?lectureId=${video._id}`,
        contentId: `video_${video._id}`,
        contentType: 'video',
        targetType: (video.targetSpecializations && video.targetSpecializations.length > 0) ? 'specific' : 'all',
        targetSpecializations: video.targetSpecializations || [],
        courseId: video.courseId?.toString()
      }).catch(err => console.error('Lecture notification error:', err));
    }

    return NextResponse.json({ message: "تم إكمال إضافة المحاضرة بنجاح", video: populated }, { status: 201 });
  } catch (error: any) {
    console.error("Video creation error:", error);
    return NextResponse.json({ message: error.message || "حدث خطأ أثناء حفظ الفيديو" }, { status: 500 });
  }
}
