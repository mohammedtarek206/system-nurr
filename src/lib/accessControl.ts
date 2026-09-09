import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { User, IUser } from '@/models/User';
import { ContentAccess, IContentAccess } from '@/models/ContentAccess';
import { AccessRequest, IAccessRequest } from '@/models/AccessRequest';
import { Course } from '@/models/Course';
import { Section } from '@/models/Section';
import { Lesson } from '@/models/Lesson';
import { Summary } from '@/models/Summary';
import { Exam } from '@/models/Exam';

export interface CheckAccessResult {
    hasAccess: boolean;
    status: 'AVAILABLE' | 'PENDING' | 'LOCKED' | 'EXPIRED' | 'REVOKED' | 'ACTIVE';
    message: string;
    accessDoc?: any;
    requestDoc?: any;
}

export async function checkContentAccess(
    user: { id: string; role: string; specializationId?: string },
    contentType: 'COURSE' | 'SECTION' | 'LESSON' | 'SUMMARY' | 'EXAM' | 'RESOURCE',
    contentId: string
): Promise<CheckAccessResult> {
    await connectDB();

    // Admin always has access
    if (user.role === 'admin') {
        return { hasAccess: true, status: 'AVAILABLE', message: 'متاح (أدمن)' };
    }

    // Ensure user has specialization
    if (!user.specializationId) {
        return { hasAccess: false, status: 'LOCKED', message: 'يرجى اختيار التخصص أولاً للوصول إلى المحتوى.' };
    }

    const now = new Date();

    // 1. Check content item exists & target specialization matching
    let targetSpecs: string[] = [];
    let targetType = 'all';
    let accessRequiresApproval = true;

    if (contentType === 'COURSE') {
        const doc = await Course.findById(contentId);
        if (!doc) return { hasAccess: false, status: 'LOCKED', message: 'المحتوى غير موجود.' };
        targetType = doc.targetType || 'all';
        targetSpecs = (doc.targetSpecializations || []).map((id: any) => id.toString());
        accessRequiresApproval = doc.accessRequiresApproval !== false;
    } else if (contentType === 'LESSON') {
        const doc = await Lesson.findById(contentId);
        if (!doc) return { hasAccess: false, status: 'LOCKED', message: 'المحاضرة غير موجودة.' };
        targetType = doc.targetType || 'all';
        targetSpecs = (doc.targetSpecializations || []).map((id: any) => id.toString());
        accessRequiresApproval = doc.accessRequiresApproval === true; // Lesson level approval explicit check
    } else if (contentType === 'SECTION') {
        const doc = await Section.findById(contentId);
        if (!doc) return { hasAccess: false, status: 'LOCKED', message: 'القسم غير موجود.' };
        targetType = doc.targetType || 'all';
        targetSpecs = (doc.targetSpecializations || []).map((id: any) => id.toString());
        accessRequiresApproval = doc.accessRequiresApproval === true;
    } else if (contentType === 'SUMMARY') {
        const doc = await Summary.findById(contentId);
        if (!doc) return { hasAccess: false, status: 'LOCKED', message: 'الملخص غير موجود.' };
        targetType = doc.targetType || 'all';
        targetSpecs = (doc.targetSpecializations || []).map((id: any) => id.toString());
        accessRequiresApproval = doc.accessRequiresApproval !== false;
    } else if (contentType === 'EXAM') {
        const doc = await Exam.findById(contentId);
        if (!doc) return { hasAccess: false, status: 'LOCKED', message: 'الامتحان غير موجود.' };
        targetType = doc.targetType || 'all';
        targetSpecs = (doc.targetSpecializations || []).map((id: any) => id.toString());
        accessRequiresApproval = doc.accessRequiresApproval === true;
    }

    // Specialization check
    if (targetType === 'specific' && targetSpecs.length > 0) {
        const userSpecStr = user.specializationId.toString();
        if (!targetSpecs.includes(userSpecStr)) {
            return { hasAccess: false, status: 'LOCKED', message: 'هذا المحتوى غير مخصص لتخصصك الدراسي.' };
        }
    }

    // 2. Check direct ContentAccess record
    const directAccess = await ContentAccess.findOne({
        userId: user.id,
        contentType,
        contentId: new mongoose.Types.ObjectId(contentId)
    });

    if (directAccess) {
        if (directAccess.status === 'REVOKED') {
            return { hasAccess: false, status: 'REVOKED', message: 'تم إلغاء صلاحية الوصول الخاصة بك.', accessDoc: directAccess };
        }

        if (now < new Date(directAccess.startAt)) {
            return { hasAccess: false, status: 'LOCKED', message: 'لم تبدأ صلاحية الوصول بعد.', accessDoc: directAccess };
        }

        if (now > new Date(directAccess.endAt)) {
            if (directAccess.status !== 'EXPIRED') {
                directAccess.status = 'EXPIRED';
                await directAccess.save();
            }
            return { hasAccess: false, status: 'EXPIRED', message: 'انتهت صلاحية الوصول لهذا المحتوى.', accessDoc: directAccess };
        }

        return { hasAccess: true, status: 'AVAILABLE', message: 'تمت الموافقة وتعمل الصلاحية.', accessDoc: directAccess };
    }

    // 3. If checking LESSON or SECTION or EXAM, and direct access doesn't exist, check parent COURSE access if lesson level access approval is NOT strictly required
    if (!accessRequiresApproval && (contentType === 'LESSON' || contentType === 'SECTION' || contentType === 'EXAM')) {
        let parentCourseId: any = null;
        if (contentType === 'LESSON') {
            const lesson = await Lesson.findById(contentId);
            parentCourseId = lesson?.courseId;
        } else if (contentType === 'SECTION') {
            const section = await Section.findById(contentId);
            parentCourseId = section?.courseId;
        } else if (contentType === 'EXAM') {
            const exam = await Exam.findById(contentId);
            parentCourseId = exam?.courseId;
        }

        if (parentCourseId) {
            const courseAccessRes = await checkContentAccess(user, 'COURSE', parentCourseId.toString());
            if (courseAccessRes.hasAccess) {
                return { hasAccess: true, status: 'AVAILABLE', message: 'متاح عبر صلاحية الكورس.' };
            }
        }
    }

    // 4. Check if there is an AccessRequest
    const existingRequest = await AccessRequest.findOne({
        userId: user.id,
        contentType,
        contentId: new mongoose.Types.ObjectId(contentId)
    }).sort({ createdAt: -1 });

    if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
            return {
                hasAccess: false,
                status: 'PENDING',
                message: 'تم إرسال طلبك بالفعل، برجاء انتظار موافقة الإدارة.',
                requestDoc: existingRequest
            };
        }
        if (existingRequest.status === 'REJECTED') {
            return {
                hasAccess: false,
                status: 'LOCKED',
                message: 'تم رفض طلب الوصول لهذا المحتوى.',
                requestDoc: existingRequest
            };
        }
    }

    return {
        hasAccess: false,
        status: 'LOCKED',
        message: 'هذا المحتوى غير متاح لك حالياً.',
        requestDoc: existingRequest
    };
}
