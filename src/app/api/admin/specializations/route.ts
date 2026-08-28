import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { Specialization } from "@/models/Specialization";
import { User } from "@/models/User";

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

export async function GET() {
    await connectDB();
    try {
        const specializations = await Specialization.find().sort({ order: 1, createdAt: -1 });
        return NextResponse.json(specializations);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch specializations" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!(await verifyAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    await connectDB();
    try {
        const data = await req.json();
        const newSpec = new Specialization(data);
        await newSpec.save();
        return NextResponse.json({ message: "Specialization created", data: newSpec });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: "هذا الاختصار (slug) موجود مسبقاً" }, { status: 400 });
        }
        return NextResponse.json({ message: "Failed to create specialization", error: error.message }, { status: 500 });
    }
}
