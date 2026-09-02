import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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
  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    query.courseId = courseId;
  }
  if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
    query.sectionId = sectionId;
  }
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

    const { courseId, sectionId, title, description, videoType, videoUrl, youtubeUrl, thumbnail, duration, targetType, targetSpecializations, status, order } = data;

    // 1. Check Course ID presence and validity
    if (!courseId || typeof courseId !== 'string' || !courseId.trim()) {
      return NextResponse.json({ success: false, message: "من فضلك اختر الكورس أولاً" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId.trim())) {
      return NextResponse.json({ success: false, message: "معرف الكورس غير صالح (Invalid course ID)" }, { status: 400 });
    }

    // 2. Check Section ID presence and validity
    if (!sectionId || typeof sectionId !== 'string' || !sectionId.trim() || sectionId === 'null' || sectionId === 'undefined') {
      return NextResponse.json({ success: false, message: "من فضلك اختر القسم الذي ستضاف إليه المحاضرة" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(sectionId.trim())) {
      return NextResponse.json({ success: false, message: "معرف القسم غير صالح (Invalid section ID)" }, { status: 400 });
    }

    // 3. Check Title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, message: "من فضلك أدخل عنوان المحاضرة" }, { status: 400 });
    }

    // 4. Validate URL
    const urlToTest = videoUrl || youtubeUrl;
    if (!urlToTest || typeof urlToTest !== 'string' || !urlToTest.trim()) {
      return NextResponse.json({ success: false, message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
    }
    try {
      new URL(urlToTest);
    } catch {
      return NextResponse.json({ success: false, message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
    }

    // 5. Database Existence & Relationship Checks
    const course = await Course.findById(courseId.trim());
    if (!course) {
      return NextResponse.json({ success: false, message: "الكورس المختار غير موجود" }, { status: 400 });
    }

    const section = await Section.findById(sectionId.trim());
    if (!section) {
      return NextResponse.json({ success: false, message: "القسم المختار غير موجود" }, { status: 400 });
    }

    if (section.courseId.toString() !== courseId.trim()) {
      return NextResponse.json({ success: false, message: "القسم المختار لا ينتمي إلى الكورس المختار" }, { status: 400 });
    }

    const payload = {
      courseId: course._id,
      sectionId: section._id,
      title: title.trim(),
      description: description || '',
      videoType: videoType || 'zoom',
      videoUrl: urlToTest,
      youtubeUrl: urlToTest,
      thumbnail: thumbnail || '',
      duration: duration || '',
      targetType: targetType || 'all',
      targetSpecializations: Array.isArray(targetSpecializations) ? targetSpecializations : [],
      status: status || 'published',
      order: Number(order) || 0
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

    return NextResponse.json({
      success: true,
      message: "تم إضافة المحاضرة بنجاح",
      video: populated
    }, { status: 201 });

  } catch (error: any) {
    console.error("Video creation error:", error);
    if (error.name === 'CastError' || error.message?.includes('Cast to ObjectId failed')) {
      return NextResponse.json({ success: false, message: "حدث خطأ في بيانات القسم، برجاء اختيار القسم مرة أخرى." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || "حدث خطأ أثناء حفظ الفيديو" }, { status: 500 });
  }
}
