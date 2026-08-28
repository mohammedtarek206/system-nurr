import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Specialization } from "@/models/Specialization";

export async function GET() {
    await connectDB();
    try {
        let specializations = await Specialization.find({ active: { $ne: false } }).sort({ order: 1, createdAt: 1 });

        if (specializations.length === 0) {
            const defaultSpecs = [
                { name: "Technician", arName: "فني / فني سعودي", slug: "technician", icon: "👨‍⚕️", order: 1, active: true },
                { name: "Specialist", arName: "أخصائي / فني (الإمارات-قطر-عمان)", slug: "specialist", icon: "🏥", order: 2, active: true },
                { name: "Midwifery", arName: "قبالة", slug: "midwifery", icon: "👶", order: 3, active: true }
            ];
            await Specialization.insertMany(defaultSpecs);
            specializations = await Specialization.find({ active: { $ne: false } }).sort({ order: 1, createdAt: 1 });
        }

        return NextResponse.json(specializations);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch specializations" }, { status: 500 });
    }
}
