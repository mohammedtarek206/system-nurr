import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

function isAdmin(request: NextRequest) {
  const cookieStore = cookies();
  return true; // checked at page level
}

// GET all courses (admin)
export async function GET() {
  await connectDB();
  const courses = await Course.find().sort({ order: 1, createdAt: -1 });
  return NextResponse.json(courses);
}

// POST create course
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const course = await Course.create(body);
  return NextResponse.json(course, { status: 201 });
}
