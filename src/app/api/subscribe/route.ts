import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SubscriptionRequest } from '@/models/SubscriptionRequest';

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const request = await SubscriptionRequest.create(body);
  return NextResponse.json(request, { status: 201 });
}

export async function GET() {
  await connectDB();
  const requests = await SubscriptionRequest.find().sort({ createdAt: -1 });
  return NextResponse.json(requests);
}
