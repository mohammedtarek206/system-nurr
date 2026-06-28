import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import Link from "next/link";
import { BookOpen, Clock, Users, ChevronLeft, MessageCircle, Video } from "lucide-react";
import SubscribeButtonClient from "@/components/SubscribeButtonClient";

export default async function CourseSections() {
  await connectDB();
  const courses = await Course.find({ status: 'active' }).sort({ order: 1, createdAt: -1 }).limit(6);

  return (
    <section id="courses" className="py-24 bg-[#F8FAFC] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#061B3D] text-sm font-bold">كورساتنا التعليمية</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#061B3D] mb-6">
            أحدث <span className="text-[#D4AF37]">الكورسات</span> المتاحة
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            كورسات متخصصة في التأهيل لاجتياز اختبارات Prometric & Pearson VUE، تحت إشراف متخصصين ذوي خبرة واسعة.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-500 mb-3">سيتم إضافة الكورسات قريباً</h3>
            <p className="text-gray-400 mb-8">تواصل معنا لمعرفة المزيد عن الكورسات القادمة</p>
            <a
              href="https://wa.me/201016223940"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-600 transition"
            >
              <MessageCircle className="w-4 h-4" />
              تواصل معنا
            </a>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {courses.map((course) => (
                <div
                  key={course._id.toString()}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#D4AF37]/30 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Course Image */}
                  <div className="relative h-48 bg-gradient-to-br from-[#061B3D] to-[#1E3A8A] overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {course.isFree ? (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">مجاني</span>
                      ) : (
                        <span className="bg-[#D4AF37] text-[#061B3D] text-xs font-bold px-3 py-1 rounded-full">مدفوع</span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[#061B3D] mb-2 line-clamp-2 group-hover:text-[#1E3A8A] transition-colors">
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.shortDescription}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mb-4 flex-wrap">
                      {course.sectionsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          {course.sectionsCount} قسم
                        </span>
                      )}
                      {course.lessonsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-[#1E3A8A]" />
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

                    <div className="mt-auto">
                      <div className="mb-4">
                        {course.isFree ? (
                          <span className="text-green-600 font-black text-lg">مجاني</span>
                        ) : (
                          <span className="text-[#D4AF37] font-black text-lg">
                            {course.price > 0 ? `${course.price} جنيه` : 'تواصل للاستفسار'}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/courses/${course._id}`}
                          className="flex-1 bg-[#061B3D]/10 text-[#061B3D] font-bold py-2.5 px-3 rounded-xl text-center text-sm hover:bg-[#061B3D] hover:text-white transition-colors flex items-center justify-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          التفاصيل
                        </Link>
                        <SubscribeButtonClient courseId={course._id.toString()} courseName={course.title} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-[#061B3D] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1E3A8A] transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                عرض جميع الكورسات
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
