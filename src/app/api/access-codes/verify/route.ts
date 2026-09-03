import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { AccessCode } from '@/models/AccessCode';
import { parseDateTime } from '@/lib/dateUtils';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { code, pageType } = body;

        if (!code || !code.trim()) {
            return NextResponse.json({ message: 'يرجى إدخال كود الوصول.' }, { status: 400 });
        }

        if (!pageType || !['NIGHT_EXAM', 'NCLEX'].includes(pageType)) {
            return NextResponse.json({ message: 'نوع الصفحة غير صحيح.' }, { status: 400 });
        }

        const cleanCode = code.trim().toUpperCase();

        // Find code matching string & pageType
        const matchedCode = await AccessCode.findOne({
            code: cleanCode,
            pageType: pageType
        });

        if (!matchedCode) {
            // Check if code exists under a different pageType for clearer error
            const otherCode = await AccessCode.findOne({ code: cleanCode });
            if (otherCode) {
                const otherPageName = otherCode.pageType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX';
                return NextResponse.json({
                    message: `كود الوصول هذا مخصص لصفحة ${otherPageName} ولا يعمل في هذه الصفحة.`
                }, { status: 400 });
            }

            return NextResponse.json({
                message: 'كود الوصول غير صحيح أو انتهت صلاحيته.'
            }, { status: 400 });
        }

        // 1. Status Check
        if (matchedCode.status === 'Disabled') {
            return NextResponse.json({
                message: 'تم تعطيل هذا الكود بواسطة الأدمن.'
            }, { status: 400 });
        }

        const now = new Date();

        // 2. Start Date & Time Check
        if (matchedCode.startDate) {
            const startDateTime = parseDateTime(matchedCode.startDate, matchedCode.startTime);
            if (startDateTime && now < startDateTime) {
                return NextResponse.json({
                    message: 'هذا الكود لم يبدأ استخدامه بعد.'
                }, { status: 400 });
            }
        }

        // 3. End Date & Time Check
        if (matchedCode.endDate) {
            const endDateTime = parseDateTime(matchedCode.endDate, matchedCode.endTime);
            if (endDateTime && now > endDateTime) {
                return NextResponse.json({
                    message: 'انتهت صلاحية كود الوصول.'
                }, { status: 400 });
            }
        }

        // 4. Max Uses Check
        if (matchedCode.maxUses > 0 && matchedCode.currentUses >= matchedCode.maxUses) {
            return NextResponse.json({
                message: 'انتهت صلاحية هذا الكود لكثرة الاستخدام.'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            accessCodeId: matchedCode._id,
            code: matchedCode.code,
            pageType: matchedCode.pageType
        }, { status: 200 });

    } catch (error: any) {
        console.error('[VERIFY ACCESS CODE ERROR]', error);
        return NextResponse.json({ message: 'حدث خطأ في السيرفر أثناء التحقق من الكود.' }, { status: 500 });
    }
}
