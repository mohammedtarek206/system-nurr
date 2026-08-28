import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { NotificationPreference } from '@/models/NotificationPreference';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    } catch (e) {
        return null;
    }
}

export async function GET() {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    let pref = await NotificationPreference.findOne({ userId: user.id });
    if (!pref) {
        pref = await NotificationPreference.create({ userId: user.id });
    }

    return NextResponse.json(pref);
}

export async function PATCH(req: Request) {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    let pref = await NotificationPreference.findOneAndUpdate(
        { userId: user.id },
        { $set: body },
        { new: true, upsert: true }
    );

    return NextResponse.json(pref);
}
