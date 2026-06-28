import Link from "next/link";
import { Users, BookOpen, FileText, Settings, LayoutDashboard, Video, User, Award, Layers, MessageCircle } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import ExamsManager from "@/components/admin/ExamsManager";
import StudentsManager from "@/components/admin/StudentsManager";
import CoursesManager from "@/components/admin/CoursesManager";
import VideosManager from "@/components/admin/VideosManager";
import ResultsManager from "@/components/admin/ResultsManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import SubscriptionRequestsManager from "@/components/admin/SubscriptionRequestsManager";
import connectDB from "@/lib/db";
import { User as UserModel } from "@/models/User";
import { Course as CourseModel } from "@/models/Course";
import { Exam as ExamModel } from "@/models/Exam";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (user.role !== 'admin') redirect('/dashboard');
  } catch (e) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || 'overview';

  await connectDB();
  const [studentsCount, coursesCount, examsCount, pendingRequests] = await Promise.all([
    currentTab === 'overview' ? UserModel.countDocuments({ role: 'student' }) : Promise.resolve(0),
    currentTab === 'overview' ? CourseModel.countDocuments() : Promise.resolve(0),
    currentTab === 'overview' ? ExamModel.countDocuments() : Promise.resolve(0),
    SubscriptionRequest.countDocuments({ status: 'pending' }),
  ]);

  const menuItems = [
    { id: "overview", name: "الرئيسية", icon: LayoutDashboard },
    { id: "students", name: "إدارة الطلاب", icon: Users },
    { id: "categories", name: "إدارة الأقسام", icon: Layers },
    { id: "courses", name: "إدارة الكورسات", icon: BookOpen },
    { id: "subscription-requests", name: "طلبات الاشتراك", icon: MessageCircle, badge: pendingRequests > 0 ? pendingRequests : null },
    { id: "videos", name: "إدارة الفيديوهات", icon: Video },
    { id: "exams", name: "إدارة الامتحانات", icon: FileText },
    { id: "results", name: "نتائج الطلاب", icon: Award },
    { id: "settings", name: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAFC]" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#061B3D] text-white p-4 hidden md:block flex-shrink-0">
        <div className="mb-6 px-4 py-3 bg-white/5 rounded-xl">
          <p className="text-[#D4AF37] text-xs font-semibold mb-1">مرحباً بك</p>
          <p className="text-white font-bold">{user.name}</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={`/admin?tab=${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${currentTab === item.id ? "bg-[#1E3A8A] text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium flex-1">{item.name}</span>
              {(item as any).badge && (
                <span className="bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {(item as any).badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-[#061B3D] mb-1">لوحة الإدارة</h1>
            <p className="text-gray-500 text-sm">إدارة منصة الأزهري للتأهيل والتدريب المهني</p>
          </div>
          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full border-2 border-[#D4AF37] flex items-center justify-center">
            <User className="text-[#D4AF37] w-6 h-6" />
          </div>
        </header>

        {currentTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A]"><Users className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{studentsCount}</div><div className="text-xs text-gray-500 font-medium">الطلاب</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><BookOpen className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{coursesCount}</div><div className="text-xs text-gray-500 font-medium">الكورسات</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><FileText className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{examsCount}</div><div className="text-xs text-gray-500 font-medium">الامتحانات</div></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><MessageCircle className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{pendingRequests}</div><div className="text-xs text-gray-500 font-medium">طلبات اشتراك معلقة</div></div>
              </div>
            </div>

            {pendingRequests > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-800">لديك {pendingRequests} طلب اشتراك جديد بانتظار المراجعة</p>
                    <p className="text-sm text-yellow-600">راجع الطلبات وقم بالرد على الطلاب عبر واتساب</p>
                  </div>
                </div>
                <Link href="/admin?tab=subscription-requests" className="bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-500 transition">
                  عرض الطلبات
                </Link>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#061B3D] mb-4">روابط سريعة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {menuItems.slice(1).map(item => (
                  <Link key={item.id} href={`/admin?tab=${item.id}`} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#1E3A8A]/30 hover:bg-[#1E3A8A]/5 transition text-center group">
                    <item.icon className="w-6 h-6 text-gray-400 group-hover:text-[#1E3A8A] transition" />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-[#061B3D] transition">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {currentTab === 'exams' && <ExamsManager />}
        {currentTab === 'categories' && <CategoriesManager />}
        {currentTab === 'students' && <StudentsManager />}
        {currentTab === 'courses' && <CoursesManager />}
        {currentTab === 'videos' && <VideosManager />}
        {currentTab === 'results' && <ResultsManager />}
        {currentTab === 'subscription-requests' && <SubscriptionRequestsManager />}
        {currentTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#061B3D] mb-4">الإعدادات</h2>
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              واجهة الإعدادات تحت التطوير. سيتم إضافتها قريباً.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
