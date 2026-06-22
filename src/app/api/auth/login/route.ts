import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      { message: "تم تسجيل الدخول بنجاح", user: { id: user._id, name: user.fullName, role: user.role } },
      { status: 200 }
    );
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
