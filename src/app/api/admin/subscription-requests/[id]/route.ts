import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SubscriptionRequest } from '@/models/SubscriptionRequest';
import { Subscription } from '@/models/Subscription';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { status, startDate, endDate, durationDays } = body;

  const request = await SubscriptionRequest.findByIdAndUpdate(id, { status }, { new: true });

  if (status === 'approved' && request) {
    const start = startDate ? new Date(startDate) : new Date();
    let end: Date;
    if (endDate) {
      end = new Date(endDate);
    } else if (durationDays) {
      end = new Date(start);
      end.setDate(end.getDate() + durationDays);
    } else {
      end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
    }

    // Check if subscription exists
    const existing = await Subscription.findOne({ requestId: id });
    if (existing) {
      await Subscription.findByIdAndUpdate(existing._id, {
        startDate: start,
        endDate: end,
        status: 'active'
      });
    } else {
      await Subscription.create({
        studentId: body.studentId || null,
        courseId: request.courseId,
        accessType: 'course',
        startDate: start,
        endDate: end,
        status: 'active',
        requestId: id
      });
    }
  }

  return NextResponse.json(request);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  await SubscriptionRequest.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
