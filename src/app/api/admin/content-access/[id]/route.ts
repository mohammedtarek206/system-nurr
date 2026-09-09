import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
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

        const accessDoc = await ContentAccess.findById(id);
        if (!accessDoc) {
            return NextResponse.json({ message: "سجل الوصول غير موجود" }, { status: 404 });
        }

        const { action, newEndAt, extensionDays, startAt } = await req.json();

        if (action === 'EXTEND') {
            let oldEnd = new Date(accessDoc.endAt);
            let updatedEnd: Date;

            if (newEndAt) {
                updatedEnd = new Date(newEndAt);
            } else if (extensionDays) {
                updatedEnd = new Date(oldEnd > new Date() ? oldEnd : new Date());
                updatedEnd.setDate(updatedEnd.getDate() + Number(extensionDays));
            } else {
                return NextResponse.json({ message: "يرجى تحديد تاريخ انتهاء جديد أو عدد أصل الأيام للتمديد." }, { status: 400 });
            }

            if (startAt) {
                accessDoc.startAt = new Date(startAt);
            }

            accessDoc.endAt = updatedEnd;
            accessDoc.status = 'ACTIVE';
            await accessDoc.save();

            // Notify student
            await Notification.create({
                userId: accessDoc.userId,
                title: "تم تمديد صلاحية الوصول",
                message: `تم تمديد صلاحية الوصول إلى المحتوى حتى ${updatedEnd.toLocaleDateString('ar-EG')}.`,
                type: 'system',
                read: false
            });

            // Audit Log
            await AuditLog.create({
                adminId: adminUser._id,
                action: 'EXTEND_CONTENT_ACCESS',
                studentId: accessDoc.userId,
                targetId: accessDoc.contentId,
                targetType: accessDoc.contentType,
                reason: `Extended access from ${oldEnd.toISOString()} to ${updatedEnd.toISOString()}`
            });

            return NextResponse.json({
                message: "تم تمديد الصلاحية بنجاح.",
                access: accessDoc
            }, { status: 200 });

        } else if (action === 'REVOKE') {
            accessDoc.status = 'REVOKED';
            accessDoc.revokedAt = new Date();
            await accessDoc.save();

            // Notify student
            await Notification.create({
                userId: accessDoc.userId,
                title: "إلغاء صلاحية الوصول",
                message: "تم إلغاء صلاحية الوصول إلى المحتوى بواسطة الإدارة.",
                type: 'system',
                read: false
            });

            // Audit Log
            await AuditLog.create({
                adminId: adminUser._id,
                action: 'REVOKE_CONTENT_ACCESS',
                studentId: accessDoc.userId,
                targetId: accessDoc.contentId,
                targetType: accessDoc.contentType,
                reason: 'Access revoked by admin'
            });

            return NextResponse.json({
                message: "تم إلغاء الصلاحية بنجاح.",
                access: accessDoc
            }, { status: 200 });

        } else {
            return NextResponse.json({ message: "إجراء غير معروف" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}
