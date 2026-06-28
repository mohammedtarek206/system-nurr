import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Result } from '@/models/Result';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const token = (await cookies()).get('token')?.value;
    let userId = undefined;
    
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.id;
      } catch (e) {
        // Not logged in, but we have studentName in body
      }
    }

    const newResult = await Result.create({
      ...body,
      userId
    });

    return NextResponse.json({ success: true, resultId: newResult._id }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}
