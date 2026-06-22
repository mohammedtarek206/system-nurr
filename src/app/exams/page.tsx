import connectDB from "@/lib/db";
import { Exam } from "@/models/Exam";
import Link from "next/link";
import { FileText, Clock, Award, PlayCircle } from "lucide-react";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function ExamsPage() {
  await connectDB();
  
  const token = (await cookies()).get('token')?.value;
  let user: any = null;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch(e) {}
  }
  
  const query = user && user.role === 'student' ? {
    $or: [
      { isPublic: true },
      { isPublic: { $exists: false } },
      { assignedStudents: user.id }
    ]
  } : {
    $or: [
      { isPublic: true },
      { isPublic: { $exists: false } }
    ]
  };

  const exams = await Exam.find(query).sort({ createdAt: -1 });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-black text-primary-dark mb-8 text-center">جميع الامتحانات المتاحة</h1>
        
        {exams.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            لا توجد امتحانات متاحة في الوقت الحالي.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam._id.toString()} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold inline-block mb-4">
                    {exam.category}
                  </div>
                  <h3 className="text-lg font-bold text-primary-dark mb-4">{exam.title}</h3>
                  <div className="flex flex-col gap-2 text-sm text-gray-600 font-semibold mb-6">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4"/> المدة: {exam.duration} دقيقة</span>
                    <span className="flex items-center gap-2"><Award className="w-4 h-4"/> نسبة النجاح المطلوبة: {exam.passingScore}%</span>
                  </div>
                </div>
                <Link href={`/dashboard/take-exam?id=${exam._id}`} className="bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold px-4 py-3 rounded-xl hover:shadow-lg transition text-center flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" /> ابدأ الامتحان الآن
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
