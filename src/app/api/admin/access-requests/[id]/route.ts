import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { AccessRequest } from '@/models/AccessRequest';
import { ContentAccess } from '@/models/ContentAccess';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();

        const adminUser = await User.findById(decoded.id);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ message: "غير مصرح للآدمن فقط" }, { status: 403 });
        }

        const requestDoc = await AccessRequest.findById(id);
        if (!requestDoc) {
            return NextResponse.json({ message: "طلب الوصول غير موجود" }, { status: 404 });
        }

        const { action, durationDays, startDate, endDate, rejectionReason } = await req.json();

        if (action === 'APPROVE') {
            let start = startDate ? new Date(startDate) : new Date();
            let end: Date;

            if (endDate) {
                end = new Date(endDate);
            } else {
                const days = Number(durationDays) || 30;
                end = new Date(start);
                end.setDate(end.getDate() + days);
            }

            // Update AccessRequest
            requestDoc.status = 'APPROVED';
            requestDoc.reviewedAt = new Date();
            requestDoc.reviewedBy = adminUser._id;
            await requestDoc.save();

            // Upsert ContentAccess
            let contentAccess = await ContentAccess.findOne({
                userId: requestDoc.userId,
                contentType: requestDoc.contentType,
                contentId: requestDoc.contentId
            });

            if (contentAccess) {
                contentAccess.startAt = start;
                contentAccess.endAt = end;
                contentAccess.status = 'ACTIVE';
                contentAccess.grantedBy = adminUser._id;
                contentAccess.grantedAt = new Date();
                contentAccess.revokedAt = undefined;
                await contentAccess.save();
            } else {
                contentAccess = await ContentAccess.create({
                    userId: requestDoc.userId,
                    contentType: requestDoc.contentType,
                    contentId: requestDoc.contentId,
                    specializationId: requestDoc.specializationId,
                    startAt: start,
                    endAt: end,
                    status: 'ACTIVE',
                    grantedBy: adminUser._id,
                    grantedAt: new Date()
                });
            }

            // Notify student
            await Notification.create({
                userId: requestDoc.userId,
                title: "تمت الموافقة على طلبك",
                message: `تمت الموافقة على طلب الوصول إلى المحتوى. الصلاحية تبدأ من ${start.toLocaleDateString('ar-EG')} وتنتهي في ${end.toLocaleDateString('ar-EG')}.`,
                type: 'system',
                read: false
            });

            // Audit Log
            await AuditLog.create({
                adminId: adminUser._id,
                action: 'GRANT_CONTENT_ACCESS',
                studentId: requestDoc.userId,
                targetId: requestDoc.contentId,
                targetType: requestDoc.contentType,
                reason: `Approved access request from ${start.toISOString()} to ${end.toISOString()}`
            });

            return NextResponse.json({
                message: "تمت الموافقة على طلب الوصول بنجاح وتم تفعيل المحتوى للطالب.",
                request: requestDoc,
                access: contentAccess
            }, { status: 200 });

        } else if (action === 'REJECT') {
            requestDoc.status = 'REJECTED';
            requestDoc.reviewedAt = new Date();
            requestDoc.reviewedBy = adminUser._id;
            requestDoc.rejectionReason = rejectionReason || 'تم رفض الطلب بواسطة الإدارة.';
            await requestDoc.save();

            // Notify student
            await Notification.create({
                userId: requestDoc.userId,
                title: "تم رفض طلب الوصول",
                message: `للأسف، تم رفض طلب الوصول الخاص بك. السبب: ${requestDoc.rejectionReason}`,
                type: 'system',
                read: false
            });

            // Audit Log
            await AuditLog.create({
                adminId: adminUser._id,
                action: 'REJECT_CONTENT_ACCESS',
                studentId: requestDoc.userId,
                targetId: requestDoc.contentId,
                targetType: requestDoc.contentType,
                reason: requestDoc.rejectionReason
            });

            return NextResponse.json({
                message: "تم رفض طلب الوصول.",
                request: requestDoc
            }, { status: 200 });

        } else {
            return NextResponse.json({ message: "إجراء غير معروف" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}
