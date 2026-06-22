import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Result } from '@/models/Result';
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
  const results = await Result.find().populate('userId', 'fullName email').populate('examId', 'title category passingScore').sort({ createdAt: -1 });
  return NextResponse.json(results);
}
