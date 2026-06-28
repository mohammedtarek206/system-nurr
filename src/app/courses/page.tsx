import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import Link from "next/link";
import { BookOpen, Clock, Users, Tag, ChevronLeft, Star, MessageCircle } from "lucide-react";

export const metadata = {
  title: "الكورسات - منصة الأزهري للتأهيل والتدريب المهني",
  description: "تصفح جميع الكورسات المتاحة في منصة الأزهري للتأهيل والتدريب المهني",
};

export default async function CoursesPage() {
  await connectDB();
  const courses = await Course.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });

  const whatsappMsg = encodeURIComponent("السلام عليكم، أرغب في الاشتراك في منصة الأزهري للتأهيل والتدريب المهني وأريد معرفة تفاصيل الكورسات والاشتراك.");
  const whatsappUrl = `https://wa.me/201016223940?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Hero Banner */}
      <div className="bg-[#061B3D] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#061B3D] via-[#0d2a5c] to-[#061B3D]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1E3A8A]/20 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#D4AF37]/30 mb-6 backdrop-blur-md">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-sm font-semibold">منصة الأزهري التعليمية</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            جميع <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#f0d060]">الكورسات</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            اختر كورسك المناسب وابدأ رحلتك نحو النجاح في اختبارات Prometric & Pearson VUE
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {courses.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-500 mb-4">لا توجد كورسات متاحة حالياً</h2>
            <p className="text-gray-400 mb-8">سيتم إضافة الكورسات قريباً. تواصل معنا لمزيد من المعلومات.</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-600 transition"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل معنا عبر واتساب
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course._id.toString()}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#D4AF37]/30 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Course Image */}
                <div className="relative h-52 bg-gradient-to-br from-[#061B3D] to-[#1E3A8A] overflow-hidden">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    {course.isFree ? (
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">مجاني</span>
                    ) : (
                      <span className="bg-[#D4AF37] text-[#061B3D] text-xs font-bold px-3 py-1 rounded-full">مدفوع</span>
                    )}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-[#061B3D] mb-2 line-clamp-2 group-hover:text-[#1E3A8A] transition-colors">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold mb-4 flex-wrap">
                    {course.sectionsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        {course.sectionsCount} قسم
                      </span>
                    )}
                    {course.lessonsCount > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        {course.lessonsCount} محاضرة
                      </span>
                    )}
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        {course.duration}
                      </span>
                    )}
                  </div>

                  {/* Instructor */}
                  {course.instructor && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{course.instructor}</span>
                    </div>
                  )}

                  <div className="mt-auto">
                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {course.isFree ? (
                          <span className="text-green-600 font-black text-xl">مجاني</span>
                        ) : (
                          <span className="text-[#D4AF37] font-black text-xl">
                            {course.price > 0 ? `${course.price} جنيه` : 'تواصل للاستفسار'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${course._id}`}
                        className="flex-1 bg-[#061B3D]/10 text-[#061B3D] font-bold py-2.5 px-4 rounded-xl text-center text-sm hover:bg-[#061B3D] hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        عرض التفاصيل
                      </Link>
                      <SubscribeButton courseId={course._id.toString()} courseName={course.title} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Client subscribe button
function SubscribeButton({ courseId, courseName }: { courseId: string; courseName: string }) {
  return (
    <Link
      href={`/courses/${courseId}?subscribe=true`}
      className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-[#061B3D] font-bold py-2.5 px-4 rounded-xl text-center text-sm hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-1"
    >
      <MessageCircle className="w-4 h-4" />
      اشترك الآن
    </Link>
  );
}
