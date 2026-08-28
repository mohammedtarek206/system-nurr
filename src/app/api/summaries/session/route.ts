import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SummaryAccessSession } from '@/models/SummaryAccessSession';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('summary_session')?.value;
    if (!sessionId) {
        return NextResponse.json({ valid: false });
    }

    await connectDB();
    const session = await SummaryAccessSession.findOne({ sessionId });
    if (!session || session.expiresAt < new Date()) {
        if (session) await SummaryAccessSession.deleteOne({ sessionId });
        const response = NextResponse.json({ valid: false });
        response.cookies.delete('summary_session');
        return response;
    }

    return NextResponse.json({ valid: true, expiresAt: session.expiresAt });
}

export async function DELETE() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('summary_session')?.value;
    if (sessionId) {
        await connectDB();
        await SummaryAccessSession.deleteOne({ sessionId });
    }
    const response = NextResponse.json({ message: 'تم إنهاء الجلسة' });
    response.cookies.delete('summary_session');
    return response;
}
