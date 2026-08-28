import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Specialization } from "@/models/Specialization";

export async function GET() {
    await connectDB();
    try {
        const specializations = await Specialization.find({ active: true }).sort({ order: 1, createdAt: 1 });
        return NextResponse.json(specializations);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch specializations" }, { status: 500 });
    }
}
