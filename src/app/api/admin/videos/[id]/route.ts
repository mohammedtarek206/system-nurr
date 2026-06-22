import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Video } from '@/models/Video';
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();
  await Video.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "تم الحذف" }, { status: 200 });
}
