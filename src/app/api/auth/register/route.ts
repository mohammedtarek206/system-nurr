import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { fullName, email, phone, password } = await req.json();

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json({ message: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: 'student'
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, name: newUser.fullName },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح", user: { id: newUser._id, name: newUser.fullName, role: newUser.role } },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
