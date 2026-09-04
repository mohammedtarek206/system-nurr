import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { normalizeVideoItem } from '../route';

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
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "معرف المحاضرة غير صالح" }, { status: 400 });
  }

  const video = await Video.findById(id)
    .populate('courseId', 'title category')
    .populate('sectionId', 'title')
    .populate('targetSpecializations', 'arName name');

  if (!video) return NextResponse.json({ success: false, message: "محاضرة غير موجودة" }, { status: 404 });
  return NextResponse.json(normalizeVideoItem(video));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "معرف المحاضرة غير صالح" }, { status: 400 });
  }

  try {
    const data = await req.json();
    const {
      courseId,
      sectionId,
      title,
      description,
      platform,
      videoType,
      url,
      videoUrl,
      youtubeUrl,
      thumbnail,
      duration,
      targetType,
      targetSpecializations,
      status,
      order,
      startDate,
      startTime,
      endDate,
      endTime
    } = data;

    const payload: any = {};

    // Validate courseId if passed
    if (courseId !== undefined) {
      if (!courseId || typeof courseId !== 'string' || !courseId.trim()) {
        return NextResponse.json({ success: false, message: "من فضلك اختر الكورس" }, { status: 400 });
      }
      if (!mongoose.Types.ObjectId.isValid(courseId.trim())) {
        return NextResponse.json({ success: false, message: "معرف الكورس غير صالح" }, { status: 400 });
      }
      const course = await Course.findById(courseId.trim());
      if (!course) {
        return NextResponse.json({ success: false, message: "الكورس غير موجود" }, { status: 400 });
      }
      payload.courseId = course._id;
    }

    // Validate sectionId if passed
    if (sectionId !== undefined) {
      if (!sectionId || typeof sectionId !== 'string' || !sectionId.trim() || sectionId === 'null' || sectionId === 'undefined') {
        return NextResponse.json({ success: false, message: "من فضلك اختر القسم الذي ستضاف إليه المحاضرة" }, { status: 400 });
      }
      if (!mongoose.Types.ObjectId.isValid(sectionId.trim())) {
        return NextResponse.json({ success: false, message: "معرف القسم غير صالح (Invalid section ID)" }, { status: 400 });
      }
      const section = await Section.findById(sectionId.trim());
      if (!section) {
        return NextResponse.json({ success: false, message: "القسم المختار غير موجود" }, { status: 400 });
      }
      const existingVideo = await Video.findById(id);
      const targetCourseId = payload.courseId || existingVideo?.courseId;
      if (targetCourseId && section.courseId.toString() !== targetCourseId.toString()) {
        return NextResponse.json({ success: false, message: "القسم المختار لا ينتمي إلى الكورس المختار" }, { status: 400 });
      }
      payload.sectionId = section._id;
    }

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ success: false, message: "من فضلك أدخل عنوان المحاضرة" }, { status: 400 });
      }
      payload.title = title.trim();
    }

    // Validate Platform if passed
    if (platform !== undefined || videoType !== undefined) {
      const rawPlat = (platform || videoType || 'ZOOM').toString().trim().toUpperCase();
      if (rawPlat === 'ZOOM') payload.platform = 'ZOOM';
      else if (rawPlat === 'FREE_CONFERENCE' || rawPlat === 'FREECONFERENCE' || rawPlat === 'FREE CONFERENCE') payload.platform = 'FREE_CONFERENCE';
      else payload.platform = 'VIDEO';
      payload.videoType = payload.platform.toLowerCase();
    }

    // Validate URL if passed
    const rawUrl = (url !== undefined ? url : videoUrl !== undefined ? videoUrl : youtubeUrl);
    if (rawUrl !== undefined) {
      const cleanUrl = (rawUrl || '').toString().trim();
      if (!cleanUrl) {
        return NextResponse.json({ success: false, message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
      }
      try {
        const parsedUrl = new URL(cleanUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return NextResponse.json({ success: false, message: "يجب أن يبدأ رابط المحاضرة بـ http:// أو https://" }, { status: 400 });
        }
        const cleanUrlStr = parsedUrl.toString();
        payload.url = cleanUrlStr;
        payload.videoUrl = cleanUrlStr;
        payload.youtubeUrl = cleanUrlStr;
      } catch {
        return NextResponse.json({ success: false, message: "يرجى إدخال رابط صحيح للمحاضرة" }, { status: 400 });
      }
    }

    if (description !== undefined) payload.description = description ? description.trim() : '';
    if (thumbnail !== undefined) payload.thumbnail = thumbnail ? thumbnail.trim() : '';
    if (duration !== undefined) payload.duration = duration ? duration.trim() : '';
    if (targetType !== undefined) payload.targetType = targetType;
    if (targetSpecializations !== undefined) payload.targetSpecializations = Array.isArray(targetSpecializations) ? targetSpecializations : [];
    if (status !== undefined) payload.status = status;
    if (order !== undefined) payload.order = Number(order) || 0;
    if (startDate !== undefined) payload.startDate = startDate;
    if (startTime !== undefined) payload.startTime = startTime;
    if (endDate !== undefined) payload.endDate = endDate;
    if (endTime !== undefined) payload.endTime = endTime;

    const video = await Video.findByIdAndUpdate(id, payload, { new: true })
      .populate('courseId', 'title category')
      .populate('sectionId', 'title')
      .populate('targetSpecializations', 'arName name');

    if (!video) return NextResponse.json({ success: false, message: "محاضرة غير موجودة" }, { status: 404 });
    return NextResponse.json({ success: true, message: "تم تحديث بيانات المحاضرة بنجاح", video: normalizeVideoItem(video) });
  } catch (error: any) {
    console.error("Video edit error:", error);
    if (error.name === 'CastError' || error.message?.includes('Cast to ObjectId failed')) {
      return NextResponse.json({ success: false, message: "حدث خطأ في بيانات القسم، برجاء اختيار القسم مرة أخرى." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "معرف المحاضرة غير صالح" }, { status: 400 });
  }

  await Video.findByIdAndDelete(id);
  return NextResponse.json({ success: true, message: "تم حذف المحاضرة بنجاح" }, { status: 200 });
}
