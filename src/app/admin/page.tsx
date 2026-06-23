import Link from "next/link";
import { Users, BookOpen, FileText, Settings, LayoutDashboard, Video, User, Award, Layers } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import ExamsManager from "@/components/admin/ExamsManager";
import StudentsManager from "@/components/admin/StudentsManager";
import CoursesManager from "@/components/admin/CoursesManager";
import VideosManager from "@/components/admin/VideosManager";
import ResultsManager from "@/components/admin/ResultsManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import connectDB from "@/lib/db";
import { User as UserModel } from "@/models/User";
import { Course as CourseModel } from "@/models/Course";
import { Exam as ExamModel } from "@/models/Exam";

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
  const studentsCount = currentTab === 'overview' ? await UserModel.countDocuments({ role: 'student' }) : 0;
  const coursesCount = currentTab === 'overview' ? await CourseModel.countDocuments() : 0;
  const examsCount = currentTab === 'overview' ? await ExamModel.countDocuments() : 0;

  const menuItems = [
    { id: "overview", name: "الرئيسية", icon: LayoutDashboard },
    { id: "students", name: "إدارة الطلاب", icon: Users },
    { id: "categories", name: "إدارة الأقسام", icon: Layers },
    { id: "courses", name: "إدارة الكورسات", icon: BookOpen },
    { id: "videos", name: "إدارة الفيديوهات", icon: Video },
    { id: "exams", name: "إدارة الامتحانات", icon: FileText },
    { id: "results", name: "نتائج الطلاب", icon: Award },
    { id: "settings", name: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAFC]" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#061B3D] text-white p-4 hidden md:block">
        <nav className="space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={`/admin?tab=${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentTab === item.id ? "bg-[#1E3A8A] text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-[#061B3D] mb-1">لوحة الإدارة - {user.name}</h1>
            <p className="text-gray-500">إدارة منصة الأزهري والتحكم بالطلاب والامتحانات</p>
          </div>
          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full border-2 border-[#D4AF37] flex items-center justify-center">
            <User className="text-[#D4AF37] w-6 h-6" />
          </div>
        </header>

        {currentTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A]"><Users className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{studentsCount}</div><div className="text-sm text-gray-500 font-medium">إجمالي الطلاب</div></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><BookOpen className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{coursesCount}</div><div className="text-sm text-gray-500 font-medium">إجمالي الكورسات</div></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><FileText className="w-6 h-6" /></div>
                <div><div className="text-2xl font-bold text-[#061B3D]">{examsCount}</div><div className="text-sm text-gray-500 font-medium">إجمالي الامتحانات</div></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#061B3D] mb-4">أحدث النشاطات</h2>
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                سيتم عرض أحدث تسجيلات الطلاب ونتائج الامتحانات هنا.
              </div>
            </div>
          </>
        )}

        {currentTab === 'exams' ? (
          <ExamsManager />
        ) : currentTab === 'categories' ? (
          <CategoriesManager />
        ) : currentTab === 'students' ? (
          <StudentsManager />
        ) : currentTab === 'courses' ? (
          <CoursesManager />
        ) : currentTab === 'videos' ? (
          <VideosManager />
        ) : currentTab === 'results' ? (
          <ResultsManager />
        ) : ['settings'].includes(currentTab) ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-dark mb-4">{menuItems.find(i => i.id === currentTab)?.name}</h2>
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              واجهة {menuItems.find(i => i.id === currentTab)?.name} تحت التطوير. سيتم إضافتها قريباً.
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
