import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

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

    return NextResponse.json({ message: "تم إنشاء الحساب بنجاح", user: { id: newUser._id, name: newUser.fullName } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
