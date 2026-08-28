import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { DeviceSession } from '@/models/DeviceSession';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "البريد الإلكتروني وكلمة المرور مطلوبة" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ message: "Your account has been temporarily blocked. Please contact the administrator." }, { status: 403 });
    }

    const cookieStore = await cookies();
    let reqDeviceId = cookieStore.get('deviceId')?.value;
    if (!reqDeviceId) {
      reqDeviceId = crypto.randomUUID();
    }

    if (user.role === 'student' && user.deviceId && user.deviceId !== reqDeviceId) {
      user.isBanned = true;
      user.banReason = 'Attempted login from another device.';
      await user.save();
      return NextResponse.json({ message: "هذا الحساب مرتبط بجهاز آخر حالياً. يرجى التواصل مع الإدارة." }, { status: 403 });
    }

    const sessionId = crypto.randomUUID();
    const session = await DeviceSession.create({
      userId: user._id,
      sessionId,
      deviceId: reqDeviceId,
      ipAddress: req.headers.get('x-forwarded-for') || '',
      browserInfo: req.headers.get('user-agent') || '',
    });

    user.deviceId = reqDeviceId;
    user.activeSession = session._id.toString();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName, specializationId: user.specializationId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      { message: "تم تسجيل الدخول بنجاح", user: { id: user._id, name: user.fullName, role: user.role, specializationId: user.specializationId } },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    response.cookies.set('deviceId', reqDeviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365 * 10,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
