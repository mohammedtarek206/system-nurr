import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdmin() {
  const token = (await cookies()).get('token')?.value;
  if (!token) return false;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    return user.role === 'admin';
  } catch (e) {
    return false;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  try {
    await User.findByIdAndDelete((await params).id);
    return NextResponse.json({ message: "تم الحذف بنجاح" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "خطأ أثناء الحذف" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  try {
    const data = await req.json();
    const user = await User.findById((await params).id);
    if (!user) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    if (data.action === 'ban') {
      user.isBanned = true;
      user.banReason = data.reason || 'Admin Ban';
    } else if (data.action === 'unban') {
      user.isBanned = false;
      user.banReason = '';
    } else if (data.action === 'resetDevice') {
      user.deviceId = '';
      user.activeSession = '';
    } else if (data.action === 'updateType') {
      user.userType = data.userType;
    }

    await user.save();
    return NextResponse.json({ message: "تم تحديث بيانات الطالب بنجاح", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "خطأ أثناء التحديث" }, { status: 500 });
  }
}
