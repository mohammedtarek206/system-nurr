import Link from "next/link";
import { BookOpen, Video, FileText, Award, User, Settings, LayoutDashboard, PlayCircle, Clock } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { Video as VideoModel } from "@/models/Video";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (user.role !== 'student') redirect('/admin');
  } catch (e) {
    redirect('/login');
  }

  await connectDB();
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || 'overview';

  let courses: any[] = [];
  let videos: any[] = [];
  let exams: any[] = [];
  let results: any[] = [];

  if (currentTab === 'courses' || currentTab === 'overview') {
    courses = await Course.find().sort({ createdAt: -1 });
  }
  if (currentTab === 'lectures' || currentTab === 'overview') {
    videos = await VideoModel.find().populate('courseId').sort({ createdAt: -1 });
  }
  if (currentTab === 'exams' || currentTab === 'overview') {
    exams = await Exam.find({
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } },
        { assignedStudents: user.id }
      ]
    }).sort({ createdAt: -1 });
  }
  if (currentTab === 'results' || currentTab === 'overview') {
    results = await Result.find({ userId: user.id }).populate('examId').sort({ createdAt: -1 });
  }

  const menuItems = [
    { id: "overview", name: "الرئيسية", icon: LayoutDashboard },
    { id: "courses", name: "كورساتي", icon: BookOpen },
    { id: "lectures", name: "المحاضرات", icon: Video },
    { id: "exams", name: "الامتحانات", icon: FileText },
    { id: "results", name: "النتائج", icon: Award },
    { id: "profile", name: "الملف الشخصي", icon: User },
    { id: "settings", name: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-dark text-white p-4 hidden md:block border-l border-white/10">
        <nav className="space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard?tab=${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentTab === item.id ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
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
            <h1 className="text-2xl font-bold text-primary-dark mb-1">مرحباً بك، {user.name}</h1>
            <p className="text-gray-500">تابع تقدمك واستعد لاختبار البرومترك بقوة!</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full border-2 border-gold flex items-center justify-center">
            <User className="text-primary w-6 h-6" />
          </div>
        </header>

        {currentTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><BookOpen className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-primary-dark">{courses.length}</div><div className="text-sm text-gray-500 font-medium">الكورسات المشترك بها</div></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Video className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-primary-dark">{videos.length}</div><div className="text-sm text-gray-500 font-medium">المحاضرات المكتملة</div></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><FileText className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-primary-dark">{results.length}</div><div className="text-sm text-gray-500 font-medium">الامتحانات المنجزة</div></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold"><Award className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-primary-dark">
                  {results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length) + '%' : '0%'}
                </div><div className="text-sm text-gray-500 font-medium">متوسط الدرجات</div></div>
              </div>
            </div>
          </>
        )}

        {currentTab === 'courses' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-dark mb-6">كورساتي</h2>
            {courses.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد كورسات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div key={course._id.toString()} className="border p-6 rounded-xl shadow-sm bg-white hover:border-gold/30 transition">
                    <h3 className="text-lg font-bold text-primary-dark mb-2">{course.title}</h3>
                    <p className="text-sm text-primary mb-2 font-semibold">{course.category}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{course.description}</p>
                    <Link href={`/dashboard?tab=lectures`} className="bg-primary/10 text-primary-dark font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition inline-flex items-center gap-2 text-sm">
                      <PlayCircle className="w-4 h-4" /> مشاهدة المحاضرات
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'lectures' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-dark mb-6">المحاضرات المرئية</h2>
            {videos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد فيديوهات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => {
                  const vid = getYoutubeId(video.youtubeUrl);
                  return (
                    <div key={video._id.toString()} className="border p-4 rounded-xl shadow-sm bg-white overflow-hidden hover:border-gold/30 transition">
                      <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black mb-4">
                        <iframe
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          src={`https://www.youtube.com/embed/${vid}?modestbranding=1&rel=0&showinfo=0&controls=0&disablekb=1&playsinline=1`}
                          allowFullScreen
                        ></iframe>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition cursor-pointer">
                          <PlayCircle className="w-16 h-16 text-white opacity-80" />
                        </div>
                      </div>
                      <h3 className="font-bold text-primary-dark mb-1">{video.title}</h3>
                      <p className="text-sm text-gray-500 font-semibold">{video.courseId?.title || "محاضرة عامة"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'exams' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-dark mb-6">الامتحانات المتاحة</h2>
            {exams.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد امتحانات متاحة لك حالياً.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {exams.map((exam) => (
                  <div key={exam._id.toString()} className="border p-6 rounded-xl shadow-sm bg-white hover:border-gold/30 transition flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-2">{exam.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-500 font-semibold mb-6">
                        <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {exam.category}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exam.duration} دقيقة</span>
                        <span className="flex items-center gap-1"><Award className="w-4 h-4" /> النجاح: {exam.passingScore}%</span>
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
        )}

        {currentTab === 'results' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-dark mb-6">سجل النتائج</h2>
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
                        <td className="p-4 font-bold text-primary-dark">{res.examId?.title || "امتحان محذوف"}</td>
                        <td className="p-4 text-gray-600">{res.score} / {res.totalQuestions}</td>
                        <td className="p-4 font-bold">{res.percentage}%</td>
                        <td className="p-4 text-gray-500">{new Date(res.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="p-4">
                          {res.percentage >= (res.examId?.passingScore || 50) ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">ناجح</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">راسب</span>
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

        {currentTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">الملف الشخصي</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">الاسم بالكامل</label>
                <input type="text" readOnly value={user.name || "طالب"} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-primary-dark font-bold outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">البريد الإلكتروني</label>
                <input type="email" readOnly value={user.email || "student@example.com"} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-primary-dark font-bold outline-none cursor-not-allowed" />
              </div>
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm font-semibold flex gap-2 items-start">
                <User className="w-5 h-5 shrink-0" />
                <p>تنويه: للحفاظ على سرية البيانات وعدم التلاعب بحسابات الاختبارات، لا يمكن تغيير الاسم أو البريد الإلكتروني. يرجى التواصل مع الدعم الفني للإدارة إذا أردت تعديل بياناتك.</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">تغيير كلمة المرور</h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">كلمة المرور الحالية</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">كلمة المرور الجديدة</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary outline-none transition" />
              </div>
              <button type="button" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition shadow-lg w-full md:w-auto flex justify-center items-center gap-2">
                <Settings className="w-5 h-5" /> حفظ كلمة المرور
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
