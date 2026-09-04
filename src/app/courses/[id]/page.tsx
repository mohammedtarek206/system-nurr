import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Users, Video as VideoIcon, ChevronRight, ExternalLink, Lock, CheckCircle, RefreshCw, XCircle, Award } from "lucide-react";
import CourseDetailClient from "@/components/CourseDetailClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { checkCourseSubscriptionAccess, getCourseProgressionState } from "@/lib/progressionEngine";

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

  const token = (await cookies()).get('token')?.value;
  let user: any = null;
  if (token) {
    try { user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret'); } catch (e) { }
  }

  // REQUIREMENT 1: Guest Protection -> Redirect to Login
  if (!user) {
    redirect(`/login?redirect=/courses/${id}&msg=login_required`);
  }

  // REQUIREMENT 3 & 30: Check Subscription & Specialization Access
  const accessCheck = await checkCourseSubscriptionAccess(user, course);
  if (!accessCheck.accessible) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#061B3D] mb-2">وصول محمي</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{accessCheck.reason || "يلزم الاشتراك الكورس أولاً للوصول إلى هذا المحتوى."}</p>
          <div className="space-y-3">
            <CourseDetailClient courseId={course._id.toString()} courseName={course.title} />
            <Link href="/courses" className="block w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition text-sm">
              العودة لكافة الكورسات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // REQUIREMENT 10, 23 & 41: Fetch student progression state
  const progressionState = await getCourseProgressionState(user.id, id);
  const progCourse = progressionState?.course || {
    progressPercentage: 0,
    completedLessonsCount: 0,
    totalLessonsCount: 0,
    progressionMode: course.progressionMode || 'FREE'
  };
  const sections = progressionState?.sections || [];
  const lessons = progressionState?.lessons || [];

  // Group lessons by section
  const lessonsBySection: Record<string, typeof lessons> = {};
  for (const lesson of lessons) {
    const sid = lesson.sectionId.toString();
    if (!lessonsBySection[sid]) lessonsBySection[sid] = [];
    lessonsBySection[sid].push(lesson);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Hero Header */}
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
              <div className="flex items-center gap-3 mb-4">
                {course.isFree ? (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">مجاني</span>
                ) : (
                  <span className="bg-[#D4AF37] text-[#061B3D] text-xs font-bold px-3 py-1 rounded-full">مشترك</span>
                )}
                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
                  نظام التتابع: {progCourse.progressionMode === 'EXAM_REQUIRED' ? 'امتحان إجباري لكل محاضرة' : progCourse.progressionMode === 'SEQUENTIAL' ? 'متسلسل' : 'حُر'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-snug">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">{course.shortDescription}</p>
              )}

              {/* REQUIREMENT 23: Progression Header Bar */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-8">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-2">
                  <span>نسبة إنجاز الكورس</span>
                  <span className="text-[#D4AF37]">{progCourse.progressPercentage}%</span>
                </div>
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progCourse.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>المحاضرات مكتملة: {progCourse.completedLessonsCount} من {progCourse.totalLessonsCount}</span>
                  <span>الأقسام: {sections.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-6">
                {sections.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{sections.length} قسم</span>
                  </div>
                )}
                {lessons.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <VideoIcon className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{lessons.length} محاضرة</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white font-semibold">{course.duration}</span>
                  </div>
                )}
              </div>
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

        {/* Sections & Progression Timeline */}
        {sections.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#061B3D] mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#D4AF37]" />
              شجرة تقدم المحاضرات والأقسام (Course Progression Timeline)
            </h2>

            <div className="space-y-6">
              {sections.map((section: any, idx: number) => {
                const sectionLessons = lessonsBySection[section._id.toString()] || [];
                const isSecLocked = section.status === 'LOCKED';

                return (
                  <div key={section._id.toString()} className={`border rounded-2xl overflow-hidden transition-all ${isSecLocked ? 'border-gray-200 opacity-85 bg-gray-50/50' : 'border-gray-200 bg-white shadow-sm'}`}>
                    {/* Section Header */}
                    <div className={`px-6 py-4 flex items-center justify-between ${isSecLocked ? 'bg-gray-100 text-gray-500' : 'bg-[#061B3D]/5 text-[#061B3D]'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full font-black text-sm flex items-center justify-center ${section.status === 'COMPLETED' ? 'bg-green-500 text-white' : isSecLocked ? 'bg-gray-300 text-gray-600' : 'bg-[#D4AF37]/20 text-[#061B3D]'}`}>
                          {section.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-[#061B3D] text-lg">{section.title}</h3>
                          {section.description && <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSecLocked ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1.5 rounded-xl">
                            <Lock className="w-3.5 h-3.5" /> قسم مقفل 🔒
                          </span>
                        ) : section.status === 'COMPLETED' ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-xl">
                            <CheckCircle className="w-3.5 h-3.5" /> مكتمل بالكامل ✓
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl">
                            متاح 🔓 ({sectionLessons.length} محاضرة)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lessons Tree */}
                    {isSecLocked ? (
                      <div className="px-6 py-8 text-center bg-gray-50 flex flex-col items-center justify-center">
                        <Lock className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-600">هذا القسم مقفل حالياً.</p>
                        <p className="text-xs text-gray-500 mt-1">يجب إنهاء المحاضرات والامتحانات للقسم السابق لفتح هذا القسم تلقائياً.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {sectionLessons.map((video: any, vIdx: number) => {
                          const plat = (video.platform || 'ZOOM').toString().toUpperCase();
                          const isLocked = video.status === 'LOCKED';
                          const isCompleted = video.status === 'COMPLETED';

                          return (
                            <div key={video._id.toString()} className={`px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition flex-wrap gap-4 ${isLocked ? 'bg-gray-50/70' : ''}`}>
                              <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-800' : isLocked ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-800'}`}>
                                  {isCompleted ? <CheckCircle className="w-4 h-4 text-green-600" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : vIdx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className={`font-bold text-base ${isLocked ? 'text-gray-400' : 'text-[#061B3D]'}`}>{video.title}</p>
                                    {/* Platform Tag */}
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${plat === 'ZOOM' ? 'bg-blue-100 text-blue-800' : plat === 'FREE_CONFERENCE' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                                      {plat === 'ZOOM' ? 'Zoom Live' : plat === 'FREE_CONFERENCE' ? 'Free Conference' : 'Video Player'}
                                    </span>
                                  </div>

                                  {video.description && <p className="text-xs text-gray-500 mt-1">{video.description}</p>}

                                  {/* Prerequisites Information Badge */}
                                  {isLocked && (
                                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 inline-flex items-center gap-1.5 font-bold">
                                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                                      {video.prerequisiteExamId ? `يتطلب اجتياز الامتحان السابق بنسبة ${video.passingPercentage}%` : 'يتطلب مشاهدة المحاضرة السابقة أولاً'}
                                    </div>
                                  )}

                                  {video.examId && (
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg inline-flex">
                                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>امتحان المحاضرة (نسبة النجاح المطلوب: {video.passingPercentage}%)</span>
                                      {video.latestPercentage > 0 && (
                                        <span className={`font-bold ml-1 ${video.examPassed ? 'text-green-600' : 'text-red-600'}`}>
                                          - درجاتك: {video.latestPercentage}% {video.examPassed ? '✓ متفوق' : '❌ لم تعبر'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Button Area */}
                              <div className="flex items-center gap-3">
                                {isLocked ? (
                                  <button disabled className="text-xs bg-gray-200 text-gray-500 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-not-allowed">
                                    <Lock className="w-3.5 h-3.5" /> المحاضرة مغلقة 🔒
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {video.examId && !video.examPassed && video.canRetake && (
                                      <Link
                                        href={`/exams/${video.examId._id || video.examId}`}
                                        className="text-xs bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-amber-600 transition shadow-sm"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" /> تقديم امتحان المحاضرة 📝
                                      </Link>
                                    )}
                                    <Link
                                      href={`/lectures/${video._id}`}
                                      className={`text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm ${isCompleted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#1E3A8A] text-white hover:bg-[#061B3D]'}`}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> {isCompleted ? 'مراجعة المحاضرة ✓' : 'دخول المحاضرة 🔓'}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
