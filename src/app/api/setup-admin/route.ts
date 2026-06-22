import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    
    const email = "admin@alazhari.com";
    const password = "adminpassword123";
    
    // Check if admin already exists
    let admin = await User.findOne({ email });
    
    if (admin) {
      return NextResponse.json({ message: "حساب الأدمن موجود بالفعل!", email, password: "نفس الباسورد السابق" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    admin = await User.create({
      fullName: "المدير العام",
      email,
      phone: "0000000000",
      password: hashedPassword,
      role: 'admin'
    });

    return NextResponse.json({ 
      message: "تم إنشاء حساب الأدمن بنجاح!", 
      credentials: {
        email: email,
        password: password
      }
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء إنشاء حساب الأدمن" }, { status: 500 });
  }
}
