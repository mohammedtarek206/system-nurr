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
  return NextResponse.json(course);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const course = await Course.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(course);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  await Course.findByIdAndDelete(id);
  // Also delete sections and lessons
  const sections = await Section.find({ courseId: id });
  const sectionIds = sections.map(s => s._id);
  await Lesson.deleteMany({ sectionId: { $in: sectionIds } });
  await Section.deleteMany({ courseId: id });
  return NextResponse.json({ success: true });
}
