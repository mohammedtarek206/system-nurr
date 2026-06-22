import { PlayCircle, FileText, Clock, Award, ShieldAlert } from "lucide-react";
import Link from "next/link";
import connectDB from "@/lib/db";
import { Exam } from "@/models/Exam";
import { Category } from "@/models/Category";

export default async function CourseSections() {
  await connectDB();
  const allExams = await Exam.find({
    $or: [
      { isPublic: true },
      { isPublic: { $exists: false } }
    ]
  }).sort({ createdAt: -1 });
  const dbCategories = await Category.find().sort({ createdAt: 1 });

  const colors = [
    "from-blue-50 to-blue-100",
    "from-red-50 to-red-100",
    "from-pink-50 to-pink-100",
    "from-purple-50 to-purple-100",
    "from-yellow-50 to-yellow-100",
    "from-green-50 to-green-100"
  ];

  return (
    <section id="lectures" className="py-24 bg-[#F8FAFC] relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-[#061B3D] mb-6">
            أقسام <span className="text-[#D4AF37]">الامتحانات</span>
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            تصفح الامتحانات المتاحة حالياً والمضافة حديثاً من قبل الأكاديمية لاختبار مستواك.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {dbCategories.map((cat, index) => {
            const categoryExams = allExams.filter(e => e.category === cat.name);
            const colorClass = colors[index % colors.length];

            return (
              <div
                key={cat._id.toString()}
                className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-[#D4AF37]/30 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-3xl mb-6 shadow-sm`}>
                  {cat.icon}
                </div>

                <h3 className="text-2xl font-bold text-[#061B3D] mb-6">{cat.arName}</h3>

                <div className="space-y-4 mb-8">
                  {categoryExams.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                      <ShieldAlert className="w-5 h-5" />
                      <span className="text-sm font-semibold">سيتم إضافة امتحانات هذا القسم قريباً.</span>
                    </div>
                  ) : (
                    categoryExams.map(exam => (
                      <div key={exam._id.toString()} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                        <h4 className="font-bold text-[#061B3D]">{exam.title}</h4>
                        <div className="flex gap-4 text-xs text-gray-500 font-semibold">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exam.duration} دقيقة</span>
                          <span className="flex items-center gap-1"><Award className="w-4 h-4" /> النجاح: {exam.passingScore}%</span>
                        </div>
                        <Link href={`/dashboard/take-exam?id=${exam._id}`} className="mt-2 text-sm bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1E3A8A] hover:text-white transition">
                          <PlayCircle className="w-4 h-4" /> ابدأ الامتحان
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
