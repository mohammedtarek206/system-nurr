import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { Specialization } from "@/models/Specialization";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Exam } from "@/models/Exam";
import { Summary } from "@/models/Summary";

const verifyAdmin = async () => {
    const token = (await cookies()).get("token")?.value;
    if (!token) return false;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return decoded.role === 'admin';
    } catch {
        return false;
    }
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await verifyAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    try {
        const data = await req.json();
        const updated = await Specialization.findByIdAndUpdate(id, data, { new: true });
        if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
        return NextResponse.json({ message: "Updated successfully", data: updated });
    } catch (error: any) {
        return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await verifyAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    try {
        // Check relations
        const hasUsers = await User.exists({ specializationId: id });
        if (hasUsers) return NextResponse.json({ message: "لا يمكن الحذف. هناك مسجلون بهذا التخصص." }, { status: 400 });

        const hasCourses = await Course.exists({ targetSpecializations: id });
        if (hasCourses) return NextResponse.json({ message: "لا يمكن الحذف. هناك كورسات مرتبطة بهذا التخصص." }, { status: 400 });

        const hasExams = await Exam.exists({ targetSpecializations: id });
        if (hasExams) return NextResponse.json({ message: "لا يمكن الحذف. هناك امتحانات مرتبطة بهذا التخصص." }, { status: 400 });

        const hasSummaries = await Summary.exists({ targetSpecializations: id });
        if (hasSummaries) return NextResponse.json({ message: "لا يمكن الحذف. هناك ملخصات مرتبطة بهذا التخصص." }, { status: 400 });

        await Specialization.findByIdAndDelete(id);
        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ message: "Delete failed", error: error.message }, { status: 500 });
    }
}
