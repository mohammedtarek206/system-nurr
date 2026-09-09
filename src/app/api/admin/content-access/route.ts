import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { ContentAccess } from '@/models/ContentAccess';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();

        const user = await User.findById(decoded.id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ message: "غير مصرح للآدمن فقط" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const contentType = searchParams.get('contentType');
        const status = searchParams.get('status');
        const specId = searchParams.get('specializationId');
        const studentId = searchParams.get('studentId');

        const query: any = {};
        if (contentType) query.contentType = contentType;
        if (status) query.status = status;
        if (specId) query.specializationId = specId;
        if (studentId) query.userId = studentId;

        const accessList = await ContentAccess.find(query)
            .populate('userId', 'fullName email phone specializationId')
            .populate('specializationId', 'name arName')
            .populate('grantedBy', 'fullName')
            .sort({ createdAt: -1 });

        return NextResponse.json({ accessList }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();

        const adminUser = await User.findById(decoded.id);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ message: "غير مصرح للآدمن فقط" }, { status: 403 });
        }

        const { userId, contentType, contentId, specializationId, startAt, endAt, durationDays } = await req.json();

        if (!userId || !contentType || !contentId) {
            return NextResponse.json({ message: "بيانات غير مكتملة." }, { status: 400 });
        }

        const student = await User.findById(userId);
        if (!student) {
            return NextResponse.json({ message: "الطالب غير موجود." }, { status: 404 });
        }

        const specId = specializationId || student.specializationId;
        let start = startAt ? new Date(startAt) : new Date();
        let end: Date;
        if (endAt) {
            end = new Date(endAt);
        } else {
            const days = Number(durationDays) || 30;
            end = new Date(start);
            end.setDate(end.getDate() + days);
        }

        let accessDoc = await ContentAccess.findOne({ userId, contentType, contentId });
        if (accessDoc) {
            accessDoc.startAt = start;
            accessDoc.endAt = end;
            accessDoc.status = 'ACTIVE';
            accessDoc.grantedBy = adminUser._id;
            accessDoc.grantedAt = new Date();
            accessDoc.revokedAt = undefined;
            await accessDoc.save();
        } else {
            accessDoc = await ContentAccess.create({
                userId,
                contentType,
                contentId,
                specializationId: specId,
                startAt: start,
                endAt: end,
                status: 'ACTIVE',
                grantedBy: adminUser._id,
                grantedAt: new Date()
            });
        }

        await Notification.create({
            userId,
            title: "تم منحك صلاحية الوصول",
            message: `قامة الإدارة بمنحك صلاحية الوصول إلى المحتوى. الصلاحية تنتهي في ${end.toLocaleDateString('ar-EG')}.`,
            type: 'system',
            read: false
        });

        await AuditLog.create({
            adminId: adminUser._id,
            action: 'DIRECT_GRANT_ACCESS',
            studentId: userId,
            targetId: contentId,
            targetType: contentType,
            reason: `Direct grant access by admin until ${end.toISOString()}`
        });

        return NextResponse.json({ message: "تم منح الصلاحية للطالب بنجاح.", access: accessDoc }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}
