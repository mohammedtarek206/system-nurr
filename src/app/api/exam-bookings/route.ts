import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ExamBooking } from '@/models/ExamBooking';
import { AccessCode } from '@/models/AccessCode';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { fullName, examDate, eligibilityNumber, pageType, accessCodeId, accessCode } = body;

        // Validate inputs
        if (!fullName || !fullName.trim()) {
            return NextResponse.json({ message: 'الاسم الرباعي مطلوب.' }, { status: 400 });
        }

        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length < 4) {
            return NextResponse.json({ message: 'يرجى إدخال الاسم الرباعي كاملاً (أربعة أسماء على الأقل).' }, { status: 400 });
        }

        if (!examDate || !examDate.trim()) {
            return NextResponse.json({ message: 'تاريخ الامتحان مطلوب.' }, { status: 400 });
        }

        if (!eligibilityNumber || !eligibilityNumber.trim()) {
            return NextResponse.json({ message: 'رقم الأحقية مطلوب.' }, { status: 400 });
        }

        if (!pageType || !['NIGHT_EXAM', 'NCLEX'].includes(pageType)) {
            return NextResponse.json({ message: 'نوع الصفحة غير صحيح.' }, { status: 400 });
        }

        // Optional user session lookup
        let userId = null;
        const token = (await cookies()).get('token')?.value;
        if (token) {
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                if (decoded?.id) userId = decoded.id;
            } catch (e) {
                // Guest submission allowed or token invalid
            }
        }

        // Create booking document
        const booking = await ExamBooking.create({
            userId: userId || undefined,
            fullName: fullName.trim(),
            examDate: examDate.trim(),
            eligibilityNumber: eligibilityNumber.trim(),
            pageType,
            accessCodeId: accessCodeId || undefined,
            accessCode: accessCode ? accessCode.trim().toUpperCase() : '',
            status: 'Pending'
        });

        // Increment code usage if accessCodeId is provided
        if (accessCodeId) {
            await AccessCode.findByIdAndUpdate(accessCodeId, {
                $inc: { currentUses: 1 },
                $push: {
                    usedUsers: {
                        userId: userId || undefined,
                        fullName: fullName.trim(),
                        eligibilityNumber: eligibilityNumber.trim(),
                        usedAt: new Date()
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'تم حفظ استمارة الحجز بنجاح.',
            bookingId: booking._id,
            booking
        }, { status: 201 });

    } catch (error: any) {
        console.error('[EXAM BOOKING POST ERROR]', error);
        return NextResponse.json({ message: 'حدث خطأ في السيرفر أثناء حفظ البيانات.' }, { status: 500 });
    }
}
