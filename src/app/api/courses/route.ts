import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkContentAccess } from '@/lib/accessControl';

export async function GET() {
  await connectDB();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let user: any = null;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      user = await User.findById(decoded.id);
    } catch (e) { }
  }

  const courses = await Course.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });

  const result = await Promise.all(courses.map(async (course) => {
    const obj = course.toObject();

    let accessStatus = 'LOCKED';
    let hasAccess = false;
    let accessMessage = 'يرجى تسجيل الدخول أولاً للوصول إلى المحتوى.';
    let accessStart = null;
    let accessEnd = null;

    if (user) {
      const accessRes = await checkContentAccess(
        { id: user._id.toString(), role: user.role, specializationId: user.specializationId?.toString() },
        'COURSE',
        course._id.toString()
      );
      accessStatus = accessRes.status;
      hasAccess = accessRes.hasAccess;
      accessMessage = accessRes.message;
      accessStart = accessRes.accessDoc?.startAt || null;
      accessEnd = accessRes.accessDoc?.endAt || null;
    }

    return {
      ...obj,
      accessStatus,
      hasAccess,
      accessMessage,
      accessStart,
      accessEnd
    };
  }));

  return NextResponse.json(result);
}
