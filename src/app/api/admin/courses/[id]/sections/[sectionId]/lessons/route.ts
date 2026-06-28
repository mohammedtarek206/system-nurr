import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lesson } from '@/models/Lesson';
import { Section } from '@/models/Section';
import { Course } from '@/models/Course';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  await connectDB();
  const { sectionId } = await params;
  const lessons = await Lesson.find({ sectionId }).sort({ order: 1 });
  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  await connectDB();
  const { id, sectionId } = await params;
  const body = await req.json();
  const lesson = await Lesson.create({ ...body, sectionId, courseId: id });
  // Update lesson count
  const count = await Lesson.countDocuments({ courseId: id });
  await Course.findByIdAndUpdate(id, { lessonsCount: count });
  return NextResponse.json(lesson, { status: 201 });
}
