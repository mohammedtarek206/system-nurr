import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SummaryAccessCode } from '@/models/SummaryAccessCode';
import { SummaryAccessSession } from '@/models/SummaryAccessSession';
import { SummaryLoginAttempt } from '@/models/SummaryLoginAttempt';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const SESSION_DURATION_HOURS = 8;

function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const ip = getClientIp(req);

        // --- Rate Limiting ---
        let attemptRecord = await SummaryLoginAttempt.findOne({ ip });
        if (attemptRecord) {
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > new Date()) {
                const remaining = Math.ceil((attemptRecord.lockedUntil.getTime() - Date.now()) / 60000);
                return NextResponse.json(
                    { message: `تم تأمين الوصول مؤقتاً بسبب محاولات متعددة. يرجى الانتظار ${remaining} دقيقة.` },
                    { status: 429 }
                );
            }
            // Reset if lock expired
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil <= new Date()) {
                attemptRecord.attempts = 0;
                attemptRecord.lockedUntil = undefined;
            }
        } else {
            attemptRecord = new SummaryLoginAttempt({ ip, attempts: 0 });
        }

        const { code } = await req.json();

        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return NextResponse.json({ message: 'يرجى إدخال كود الدخول' }, { status: 400 });
        }

        const trimmedCode = code.trim().toUpperCase();

        // --- Find all active access codes ---
        const now = new Date();
        const activeCodes = await SummaryAccessCode.find({
            active: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now },
        });

        let matchedCode = null;
        for (const ac of activeCodes) {
            const isMatch = await bcrypt.compare(trimmedCode, ac.codeHash);
            if (isMatch) {
                // Check max uses
                if (ac.maxUses > 0 && ac.currentUses >= ac.maxUses) {
                    return NextResponse.json({ message: 'انتهى الحد الأقصى لاستخدام هذا الكود.' }, { status: 403 });
                }
                matchedCode = ac;
                break;
            }
        }

        if (!matchedCode) {
            // Record failed attempt
            attemptRecord.attempts += 1;
            attemptRecord.lastAttempt = new Date();
            if (attemptRecord.attempts >= MAX_ATTEMPTS) {
                attemptRecord.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
                await attemptRecord.save();
                return NextResponse.json(
                    { message: `كود الدخول غير صحيح. تم تأمين الوصول لمدة ${LOCK_DURATION_MINUTES} دقيقة بعد ${MAX_ATTEMPTS} محاولات فاشلة.` },
                    { status: 401 }
                );
            }
            await attemptRecord.save();
            const remaining = MAX_ATTEMPTS - attemptRecord.attempts;
            return NextResponse.json(
                { message: `كود الدخول غير صحيح. تبقى ${remaining} محاولة قبل التأمين المؤقت.` },
                { status: 401 }
            );
        }

        // Reset attempts on success
        if (attemptRecord._id) {
            await SummaryLoginAttempt.deleteOne({ ip });
        }

        // Increment code usage
        matchedCode.currentUses += 1;
        await matchedCode.save();

        // Get user from token if logged in
        let userId = null;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (token) {
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                userId = decoded.id;
            } catch (e) { }
        }

        // Create access session
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

        await SummaryAccessSession.create({
            userId: userId || null,
            sessionId,
            accessCodeId: matchedCode._id,
            expiresAt,
            lastActivity: new Date(),
            ipAddress: ip,
            userAgent: req.headers.get('user-agent') || '',
        });

        const response = NextResponse.json({ message: 'تم التحقق بنجاح. مرحباً بك في منطقة الملخصات!', success: true });

        response.cookies.set('summary_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION_HOURS * 60 * 60,
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Summary access error:', error);
        return NextResponse.json({ message: 'حدث خطأ في السيرفر.' }, { status: 500 });
    }
}
