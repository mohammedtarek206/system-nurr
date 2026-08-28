import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }
    if (user.isBanned) {
      return NextResponse.json({ message: "Your account is temporarily blocked." }, { status: 403 });
    }

    // Check deviceId matching
    const reqDeviceId = cookieStore.get('deviceId')?.value;
    if (user.role === 'student' && user.deviceId && user.deviceId !== reqDeviceId) {
      return NextResponse.json({ message: "هذا الحساب مرتبط بجهاز آخر حالياً. يرجى التواصل مع الإدارة." }, { status: 403 });
    }

    return NextResponse.json({ user: { id: user._id, name: user.fullName, role: user.role, specializationId: user.specializationId } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
