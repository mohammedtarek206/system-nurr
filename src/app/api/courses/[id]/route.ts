import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkCourseSubscriptionAccess, getCourseProgressionState } from '@/lib/progressionEngine';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const token = (await cookies()).get('token')?.value;

    let user: any = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      } catch { }
    }

    // REQUIREMENT 1: Guest check -> Return 401 requiring login
    if (!user) {
      return NextResponse.json({
        error: 'Login required',
        message: 'يرجى تسجيل الدخول أولاً للوصول إلى هذا المحتوى.'
      }, { status: 401 });
    }

    const courseDoc = await Course.findById(id);
    if (!courseDoc) {
      return NextResponse.json({ error: 'Not found', message: 'الكورس غير موجود' }, { status: 404 });
    }

    // REQUIREMENT 3: Subscription & Specialization access check
    const accessCheck = await checkCourseSubscriptionAccess(user, courseDoc);
    if (!accessCheck.accessible) {
      return NextResponse.json({
        error: 'Forbidden',
        message: accessCheck.reason || 'لا يتاح لك الوصول لهذا الكورس.'
      }, { status: 403 });
    }

    // REQUIREMENT 10: Fetch progression tree
    const progressionState = await getCourseProgressionState(user.id, id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        specializationId: user.specializationId
      },
      ...progressionState
    });

  } catch (error: any) {
    console.error('[GET COURSE DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
