import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lesson } from '@/models/Lesson';
import { Course } from '@/models/Course';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }) {
  await connectDB();
  const { lessonId } = await params;
  const body = await req.json();
  const lesson = await Lesson.findByIdAndUpdate(lessonId, body, { new: true });
  return NextResponse.json(lesson);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }) {
  await connectDB();
  const { id, lessonId } = await params;
  await Lesson.findByIdAndDelete(lessonId);
  const count = await Lesson.countDocuments({ courseId: id });
  await Course.findByIdAndUpdate(id, { lessonsCount: count });
  return NextResponse.json({ success: true });
}
