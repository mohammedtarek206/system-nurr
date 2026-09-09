import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getCourseProgressionState } from '@/lib/progressionEngine';
import { checkContentAccess } from '@/lib/accessControl';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({
        error: 'Login required',
        message: 'يجب تسجيل الدخول أولاً للوصول إلى هذا المحتوى.'
      }, { status: 401 });
    }

    let decoded: any = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return NextResponse.json({ error: 'Invalid token', message: 'رمز الجلسة غير صالح.' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found', message: 'المستخدم غير موجود.' }, { status: 401 });
    }

    const courseDoc = await Course.findById(id);
    if (!courseDoc) {
      return NextResponse.json({ error: 'Not found', message: 'الكورس غير موجود' }, { status: 404 });
    }

    // Access Check using content access control system
    const accessRes = await checkContentAccess(
      { id: user._id.toString(), role: user.role, specializationId: user.specializationId?.toString() },
      'COURSE',
      id
    );

    if (!accessRes.hasAccess) {
      return NextResponse.json({
        error: 'Access Restricted',
        message: accessRes.message || 'لا يتاح لك الوصول لهذا الكورس.',
        accessStatus: accessRes.status,
        requestDoc: accessRes.requestDoc,
        course: {
          _id: courseDoc._id,
          title: courseDoc.title,
          description: courseDoc.description,
          image: courseDoc.image,
          price: courseDoc.price,
          targetSpecializations: courseDoc.targetSpecializations
        }
      }, { status: 403 });
    }

    // Fetch progression tree
    const progressionState = await getCourseProgressionState(user._id.toString(), id);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.fullName,
        specializationId: user.specializationId
      },
      accessStatus: accessRes.status,
      accessStart: accessRes.accessDoc?.startAt,
      accessEnd: accessRes.accessDoc?.endAt,
      ...progressionState
    });

  } catch (error: any) {
    console.error('[GET COURSE DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
