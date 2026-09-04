import Link from "next/link";
import { BookOpen, Video, FileText, Award, User, Settings, LayoutDashboard, PlayCircle, Clock, Calendar, ExternalLink, Lock, CheckCircle2, FileBadge, CheckCircle } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { Video as VideoModel } from "@/models/Video";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Certificate } from "@/models/Certificate";
import { CourseProgress } from "@/models/CourseProgress";
import { LessonProgress } from "@/models/LessonProgress";
import { getContentStatus } from "@/lib/dateUtils";

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login?msg=login_required');

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (user.role !== 'student' && user.role !== 'admin') redirect('/admin');
  } catch (e) {
    redirect('/login?msg=login_required');
  }

  await connectDB();
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || 'overview';

  let courses: any[] = [];
  let videos: any[] = [];
  let exams: any[] = [];
  let results: any[] = [];
  let certificates: any[] = [];
  let courseProgresses: any[] = [];
  let lessonProgresses: any[] = [];

  if (currentTab === 'courses' || currentTab === 'overview') {
    courses = await Course.find({
      $or: [
        { targetType: 'all' },
        { targetType: { $exists: false } },
        { targetType: 'specific', targetSpecializations: user.specializationId }
      ]
    }).sort({ createdAt: -1 });

    courseProgresses = await CourseProgress.find({ userId: user.id });
    lessonProgresses = await LessonProgress.find({ userId: user.id });
  }

  if (currentTab === 'lectures' || currentTab === 'overview') {
    videos = await VideoModel.find({
      status: 'published',
      $or: [
        { targetType: 'all' },
        { targetType: { $exists: false } },
        { targetType: 'specific', targetSpecializations: user.specializationId }
      ]
    }).populate('courseId').populate('sectionId').sort({ createdAt: -1 });
  }

  if (currentTab === 'exams' || currentTab === 'overview') {
    exams = await Exam.find({
      $and: [
        {
          $or: [
            { isPublic: true },
            { isPublic: { $exists: false } },
            { assignedStudents: user.id }
          ]
        },
        {
          $or: [
            { targetType: 'all' },
            { targetType: { $exists: false } },
            { targetType: 'specific', targetSpecializations: user.specializationId }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
  }

  if (currentTab === 'results' || currentTab === 'overview') {
    results = await Result.find({ userId: user.id }).populate('examId').sort({ createdAt: -1 });
  }

  if (currentTab === 'certificates' || currentTab === 'overview') {
    certificates = await Certificate.find({ userId: user.id }).populate('courseId examId').sort({ createdAt: -1 });
  }

  const totalLessonsCompleted = lessonProgresses.filter(lp => lp.status === 'COMPLETED').length;
  const passedExamsCount = results.filter(r => r.status === 'PASSED' || r.percentage >= (r.examId?.passingScore || 50)).length;
  const avgCourseProgress = courseProgresses.length > 0
    ? Math.round(courseProgresses.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) / courseProgresses.length)
    : 0;

  const menuItems = [
    { id: "overview", name: "الرئيسية", icon: LayoutDashboard },
    { id: "courses", name: "كورساتي", icon: BookOpen },
    { id: "lectures", name: "المحاضرات", icon: Video },
    { id: "exams", name: "الامتحانات", icon: FileText },
    { id: "results", name: "النتائج", icon: Award },
    { id: "certificates", name: "شهاداتي", icon: FileBadge },
    { id: "profile", name: "الملف الشخصي", icon: User },
    { id: "settings", name: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAFC]" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#061B3D] text-white p-4 hidden md:block border-l border-white/10">
        <nav className="space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard?tab=${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentTab === item.id ? "bg-[#D4AF37] text-[#061B3D] font-bold" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-80px)]">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-[#061B3D] mb-1">مرحباً بك، {user.name}</h1>
            <p className="text-gray-500 text-sm">تابع تقدمك التعليمي واجتز الامتحانات لفتح المحاضرات التالية بسهولة!</p>
          </div>
          <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full border-2 border-[#D4AF37] flex items-center justify-center">
            <User className="text-[#061B3D] w-6 h-6" />
          </div>
        </header>

        {currentTab === 'overview' && (
          <>
            {/* REQUIREMENT 23: Student Progress Overview Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><BookOpen className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold text-[#061B3D]">{courses.length}</div>
                  <div className="text-xs text-gray-500 font-medium">الكورسات المتاحة</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold text-[#061B3D]">{totalLessonsCompleted}</div>
                  <div className="text-xs text-gray-500 font-medium">المحاضرات المكتملة</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Award className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold text-[#061B3D]">{passedExamsCount}</div>
                  <div className="text-xs text-gray-500 font-medium">الامتحانات الناجحة</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><Award className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold text-[#061B3D]">{avgCourseProgress}%</div>
                  <div className="text-xs text-gray-500 font-medium">متوسط نسبة التقدم</div>
                </div>
              </div>
            </div>

            {/* Courses Progression List */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
              <h2 className="text-xl font-bold text-[#061B3D] mb-4">تقدمك في الكورسات النشطة (Active Courses Progress)</h2>
              {courses.length === 0 ? (
                <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">لا توجد كورسات مفعلة حالياً.</div>
              ) : (
                <div className="space-y-4">
                  {courses.map(course => {
                    const prog = courseProgresses.find(p => p.courseId.toString() === course._id.toString());
                    const pct = prog?.progressPercentage || 0;

                    return (
                      <div key={course._id.toString()} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-[#061B3D]">{course.title}</h3>
                          <span className="text-xs font-bold text-[#D4AF37]">{pct}% مكتمل</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-3">
                          <div className="bg-[#D4AF37] h-full transition-all duration-300 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">نظام التتابع: {course.progressionMode || 'FREE'}</span>
                          <Link href={`/courses/${course._id}`} className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                            متابعة الكورسات والشجرة التعليمية ➔
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {currentTab === 'courses' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#061B3D] mb-6">كورساتي</h2>
            {courses.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد كورسات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const prog = courseProgresses.find(p => p.courseId.toString() === course._id.toString());
                  const pct = prog?.progressPercentage || 0;
                  return (
                    <div key={course._id.toString()} className="border p-6 rounded-xl shadow-sm bg-white hover:border-[#D4AF37]/30 transition">
                      <h3 className="text-lg font-bold text-[#061B3D] mb-2">{course.title}</h3>
                      <p className="text-sm text-blue-700 mb-2 font-semibold">{course.category}</p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{course.description}</p>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                          <span>نسبة الإنجاز</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <Link href={`/courses/${course._id}`} className="bg-[#061B3D] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-900 transition inline-flex items-center gap-2 text-sm w-full justify-center">
                        <BookOpen className="w-4 h-4" /> عرض الشجرة التعليمية والمحاضرات
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LECTURES TAB - RE-DESIGNED LECTURE CARDS */}
        {currentTab === 'lectures' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#061B3D]">المحاضرات وروابط البث Mettings</h2>
                <p className="text-xs text-gray-500 mt-0.5">محاضرات Zoom و Free Conference والكورسات المتاحة لك</p>
              </div>
            </div>

            {videos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد محاضرات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const plat = (video.platform || video.videoType || 'ZOOM').toString().toUpperCase();
                  const isZoom = plat === 'ZOOM';
                  const isFreeConf = plat === 'FREE_CONFERENCE' || plat === 'FREECONFERENCE';
                  const schedStatus = getContentStatus(video);

                  return (
                    <div key={video._id.toString()} className="border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
                      <div>
                        {/* Header Banner according to Platform */}
                        <div className={`p-4 text-white flex items-center justify-between ${isZoom ? 'bg-gradient-to-r from-blue-700 to-blue-900' :
                          isFreeConf ? 'bg-gradient-to-r from-purple-700 to-purple-900' :
                            'bg-gradient-to-r from-slate-800 to-slate-900'
                          }`}>
                          <div className="flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            <span className="font-extrabold text-xs tracking-wider">
                              {isZoom ? 'ZOOM MEETING' : isFreeConf ? 'FREE CONFERENCE' : 'VIDEO LECTURE'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {schedStatus === 'Active' && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              متاحة الآن
                            </span>
                          )}
                          {schedStatus === 'Scheduled' && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              قريباً
                            </span>
                          )}
                          {schedStatus === 'Expired' && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              منتهية
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3">
                          <h3 className="font-bold text-[#061B3D] text-lg leading-snug">{video.title}</h3>

                          <div className="flex flex-wrap gap-2 text-xs">
                            {video.courseId?.title && (
                              <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg">
                                📚 {video.courseId.title}
                              </span>
                            )}
                            {video.sectionId?.title && (
                              <span className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-lg">
                                📂 {video.sectionId.title}
                              </span>
                            )}
                          </div>

                          {video.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{video.description}</p>
                          )}

                          {/* Dates Info */}
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>البداية: {video.startDate ? `${video.startDate} ${video.startTime || ''}` : 'متاحة بشكل فوري'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer with Join Action Button */}
                      <div className="p-5 pt-0">
                        <Link
                          href={`/lectures/${video._id.toString()}`}
                          className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${schedStatus === 'Active'
                            ? isZoom
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                              : isFreeConf
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {schedStatus === 'Active' ? 'دخول المحاضرة (Join Lecture)' : 'عرض تفاصيل المحاضرة'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'exams' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#061B3D] mb-6">الامتحانات المتاحة</h2>
            {exams.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد امتحانات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {exams.map((exam) => (
                  <div key={exam._id.toString()} className="border p-6 rounded-xl shadow-sm bg-white hover:border-[#D4AF37]/30 transition flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#061B3D] mb-2">{exam.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-500 font-semibold mb-6">
                        <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {exam.category}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exam.duration} دقيقة</span>
                        <span className="flex items-center gap-1"><Award className="w-4 h-4" /> النجاح: {exam.passingScore}%</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/take-exam?id=${exam._id}`} className="bg-gradient-to-r from-[#D4AF37] to-amber-400 text-[#061B3D] font-bold px-4 py-3 rounded-xl hover:shadow-lg transition text-center flex items-center justify-center gap-2">
                      <PlayCircle className="w-5 h-5" /> ابدأ الامتحان الآن
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'results' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#061B3D] mb-6">سجل النتائج والدرجات</h2>
            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لم تقم بإجراء أي امتحانات حتى الآن.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-4 rounded-tr-xl">الامتحان</th>
                      <th className="p-4">النتيجة</th>
                      <th className="p-4">النسبة</th>
                      <th className="p-4">تاريخ الامتحان</th>
                      <th className="p-4 rounded-tl-xl">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res) => (
                      <tr key={res._id.toString()} className="border-b border-gray-100">
                        <td className="p-4 font-bold text-[#061B3D]">{res.examId?.title || "امتحان محذوف"}</td>
                        <td className="p-4 text-gray-600">{res.score} / {res.totalQuestions}</td>
                        <td className="p-4 font-bold">{res.percentage}%</td>
                        <td className="p-4 text-gray-500">{new Date(res.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="p-4">
                          {res.status === 'PASSED' || res.percentage >= (res.examId?.passingScore || 50) ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">ناجح ✓</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">لم تكتمل ❌</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
