import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { AccessRequest } from '@/models/AccessRequest';
import { Notification } from '@/models/Notification';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ message: "يجب تسجيل الدخول أولاً" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();
        const user = await User.findById(decoded.id);
        if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');
        const contentTypeFilter = searchParams.get('contentType');
        const specFilter = searchParams.get('specializationId');
        const searchQuery = searchParams.get('search');

        if (user.role === 'admin') {
            const query: any = {};
            if (statusFilter) query.status = statusFilter;
            if (contentTypeFilter) query.contentType = contentTypeFilter;
            if (specFilter) query.specializationId = specFilter;

            let requests = await AccessRequest.find(query)
                .populate('userId', 'fullName email phone specializationId')
                .populate('specializationId', 'name arName')
                .sort({ createdAt: -1 });

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                requests = requests.filter(r => {
                    const u = r.userId as any;
                    return u?.fullName?.toLowerCase().includes(q) ||
                        u?.email?.toLowerCase().includes(q) ||
                        u?.phone?.toLowerCase().includes(q);
                });
            }

            return NextResponse.json({ requests }, { status: 200 });
        } else {
            // Student gets their own requests
            const requests = await AccessRequest.find({ userId: user._id })
                .populate('specializationId', 'name arName')
                .sort({ createdAt: -1 });
            return NextResponse.json({ requests }, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: "يجب تسجيل الدخول أولاً للوصول إلى هذا المحتوى." }, { status: 401 });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        await connectDB();

        const user = await User.findById(decoded.id);
        if (!user) {
            return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 401 });
        }

        if (!user.specializationId) {
            return NextResponse.json({ message: "يرجى اختيار التخصص أولاً قبل تقديم طلب الوصول." }, { status: 400 });
        }

        const { contentType, contentId } = await req.json();
        if (!contentType || !contentId) {
            return NextResponse.json({ message: "بيانات الطلب غير مكتملة." }, { status: 400 });
        }

        // Check if there is already a PENDING request for this user and content
        const existingRequest = await AccessRequest.findOne({
            userId: user._id,
            contentType,
            contentId,
            status: 'PENDING'
        });

        if (existingRequest) {
            return NextResponse.json({
                message: "تم إرسال طلبك بالفعل، برجاء انتظار موافقة الإدارة.",
                request: existingRequest
            }, { status: 400 });
        }

        // Create new AccessRequest (using user.specializationId extracted directly from User model in backend)
        const newRequest = await AccessRequest.create({
            userId: user._id,
            contentType,
            contentId,
            specializationId: user.specializationId,
            status: 'PENDING',
            requestedAt: new Date()
        });

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                userId: admin._id,
                title: "طلب وصول جديد",
                message: `قام الطالب [${user.fullName}] بطلب وصول إلى محتوى من نوع ${contentType}.`,
                type: 'system',
                read: false
            });
        }

        return NextResponse.json({
            message: "تم إرسال طلب الوصول بنجاح، في انتظار موافقة الإدارة.",
            request: newRequest
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "حدث خطأ ما" }, { status: 500 });
    }
}
