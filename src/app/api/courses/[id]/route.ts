import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { Lesson } from '@/models/Lesson';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const course = await Course.findById(id);
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const sections = await Section.find({ courseId: id }).sort({ order: 1 });
  const lessons = await Lesson.find({ courseId: id, zoomLink: { $ne: '' } }).sort({ order: 1 });
  return NextResponse.json({ course, sections, lessons });
}
