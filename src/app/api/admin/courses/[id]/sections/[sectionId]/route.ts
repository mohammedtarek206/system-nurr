import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Section } from '@/models/Section';
import { Lesson } from '@/models/Lesson';
import { Course } from '@/models/Course';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  await connectDB();
  const { sectionId } = await params;
  const body = await req.json();
  const section = await Section.findByIdAndUpdate(sectionId, body, { new: true });
  return NextResponse.json(section);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  await connectDB();
  const { id, sectionId } = await params;
  await Lesson.deleteMany({ sectionId });
  await Section.findByIdAndDelete(sectionId);
  // Update counts
  const sectionsCount = await Section.countDocuments({ courseId: id });
  const lessonsCount = await Lesson.countDocuments({ courseId: id });
  await Course.findByIdAndUpdate(id, { sectionsCount, lessonsCount });
  return NextResponse.json({ success: true });
}
