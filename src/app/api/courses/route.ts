import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { isContentAccessible, getContentStatus } from '@/lib/dateUtils';

// Public API - get all active courses
export async function GET() {
  await connectDB();
  const courses = await Course.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });

  const result = courses.map(course => {
    const obj = course.toObject();
    const schedule = isContentAccessible(obj);
    return {
      ...obj,
      scheduleStatus: getContentStatus(obj),
      isAccessible: schedule.accessible,
      scheduleReason: schedule.reason || null
    };
  });

  return NextResponse.json(result);
}
