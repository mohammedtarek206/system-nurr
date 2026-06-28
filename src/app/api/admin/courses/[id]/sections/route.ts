import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Section } from '@/models/Section';
import { Lesson } from '@/models/Lesson';
import { Course } from '@/models/Course';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const sections = await Section.find({ courseId: id }).sort({ order: 1 });
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const section = await Section.create({ ...body, courseId: id });
  // Update course sections count
  const count = await Section.countDocuments({ courseId: id });
  await Course.findByIdAndUpdate(id, { sectionsCount: count });
  return NextResponse.json(section, { status: 201 });
}
