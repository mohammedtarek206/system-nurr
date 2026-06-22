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

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
  return NextResponse.json(students);
}
