import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/models/Category';
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
  await connectDB();
  const categories = await Category.find().sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();
  const data = await req.json();
  const category = await Category.create(data);
  return NextResponse.json({ message: "تم الإنشاء بنجاح", category }, { status: 201 });
}
