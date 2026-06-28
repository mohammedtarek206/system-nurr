import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SubscriptionRequest } from '@/models/SubscriptionRequest';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const query = phone ? { phone: { $regex: phone.replace(/[^0-9]/g, ''), $options: 'i' } } : {};
  const requests = await SubscriptionRequest.find(query).sort({ createdAt: -1 });
  return NextResponse.json(requests);
}
