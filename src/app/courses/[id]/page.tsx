import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { Section } from "@/models/Section";
import { Lesson } from "@/models/Lesson";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Users, Video, ChevronRight, ExternalLink, FileText } from "lucide-react";
import SubscribeModal from "@/components/SubscribeModal";
import CourseDetailClient from "@/components/CourseDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const course = await Course.findById(id);
  return {
    title: course ? `${course.title} - منصة الأزهري` : "الكورس",
    description: course?.shortDescription || course?.description || "",
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;

  let course;
  try {
    course = await Course.findById(id);
  } catch {
    notFound();
  }
  if (!course) notFound();

  const sections = await Section.find({ courseId: id }).sort({ order: 1 });
  const lessons = await Lesson.find({ courseId: id }).sort({ order: 1 });

  // Group lessons by section
  const lessonsBySection: Record<string, typeof lessons> = {};
  for (const lesson of lessons) {
    const sid = lesson.sectionId.toString();
    if (!lessonsBySection[sid]) lessonsBySection[sid] = [];
    lessonsBySection[sid].push(lesson);
  }

  const totalLessons = lessons.filter(l => l.zoomLink).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Hero */}
      <div className="bg-[#061B3D] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#061B3D] to-[#0d2a5c]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <Link href="/courses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
            <ChevronRight className="w-4 h-4" />
            العودة للكورسات
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              {course.isFree ? (
                <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">مجاني</span>
              ) : (
                <span className="inline-block bg-[#D4AF37] text-[#061B3D] text-xs font-bold px-3 py-1 rounded-full mb-4">مدفوع</span>
              )}
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-snug">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">{course.shortDescription}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm mb-8">
                {sections.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{sections.length} قسم</span>
                  </div>
                )}
                {lessons.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <Video className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{totalLessons} محاضرة</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{course.duration}</span>
                  </div>
                )}
                {course.instructor && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{course.instructor}</span>
                  </div>
                )}
              </div>

              <CourseDetailClient courseId={course._id.toString()} courseName={course.title} />
            </div>

            {/* Course Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-72 lg:h-80 object-cover" />
                ) : (
                  <div className="w-full h-72 lg:h-80 bg-gradient-to-br from-[#1E3A8A] to-[#0d2a5c] flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white/20" />
                  </div>
                )}
              </div>
              {!course.isFree && course.price > 0 && (
                <div className="absolute -bottom-4 -left-4 bg-[#D4AF37] text-[#061B3D] font-black text-2xl px-6 py-3 rounded-2xl shadow-lg">
                  {course.price} جنيه
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Course Description */}
        {course.description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-[#061B3D] mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              وصف الكورس
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{course.description}</p>
          </div>
        )}

        {/* Sections & Lessons */}
        {sections.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#061B3D] mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#D4AF37]" />
              محتوى الكورس
            </h2>
            <div className="space-y-4">
              {sections.map((section, idx) => {
                const sectionLessons = lessonsBySection[section._id.toString()] || [];
                const activeLessons = sectionLessons.filter(l => l.zoomLink);
                return (
                  <div key={section._id.toString()} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-[#061B3D]/5 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#061B3D] font-black text-sm flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-[#061B3D]">{section.title}</h3>
                      </div>
                      {activeLessons.length > 0 && (
                        <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full">
                          {activeLessons.length} محاضرة
                        </span>
                      )}
                    </div>
                    {section.description && (
                      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm text-gray-500">{section.description}</p>
                      </div>
                    )}
                    {activeLessons.length > 0 && (
                      <div className="divide-y divide-gray-50">
                        {activeLessons.map((lesson, lIdx) => (
                          <div key={lesson._id.toString()} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold text-xs flex items-center justify-center">
                                {lIdx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-[#061B3D] text-sm">{lesson.title}</p>
                                {lesson.duration && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" /> {lesson.duration}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.pdfFile && (
                                <a
                                  href={lesson.pdfFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-semibold flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" /> PDF
                                </a>
                              )}
                              <a
                                href={lesson.zoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-100 transition"
                              >
                                <ExternalLink className="w-3 h-3" /> دخول المحاضرة
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeLessons.length === 0 && (
                      <div className="px-6 py-4 text-sm text-gray-400 text-center">
                        سيتم إضافة محاضرات هذا القسم قريباً
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
