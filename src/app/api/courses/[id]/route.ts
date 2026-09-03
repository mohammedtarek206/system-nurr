import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { Lesson } from '@/models/Lesson';
import { isContentAccessible, getContentStatus } from '@/lib/dateUtils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const courseDoc = await Course.findById(id);
  if (!courseDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const courseObj = courseDoc.toObject();
  const courseSchedule = isContentAccessible(courseObj);

  const course = {
    ...courseObj,
    scheduleStatus: getContentStatus(courseObj),
    isAccessible: courseSchedule.accessible,
    scheduleReason: courseSchedule.reason || null
  };

  const sections = await Section.find({ courseId: id }).sort({ order: 1 });
  const rawLessons = await Lesson.find({ courseId: id, zoomLink: { $ne: '' } }).sort({ order: 1 });

  const lessons = rawLessons.map(l => {
    const lObj = l.toObject();
    const lSchedule = isContentAccessible(lObj);
    return {
      ...lObj,
      scheduleStatus: getContentStatus(lObj),
      isAccessible: lSchedule.accessible,
      scheduleReason: lSchedule.reason || null
    };
  });

  return NextResponse.json({ course, sections, lessons });
}
