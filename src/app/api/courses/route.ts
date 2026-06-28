import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';

// Public API - get all active courses
export async function GET() {
  await connectDB();
  const courses = await Course.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });
  return NextResponse.json(courses);
}
