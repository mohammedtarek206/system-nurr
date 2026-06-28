"use client";

import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard, BookOpen } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D4AF37]/20 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 py-2">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="أحمد الأزهري للتأهيل والتدريب المهني" 
                className="h-16 md:h-20 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-primary-dark font-semibold hover:text-gold transition-colors">الرئيسية</Link>
            <Link href="/courses" className="text-primary-dark font-semibold hover:text-gold transition-colors flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              الكورسات
            </Link>
            <Link href="/exams" className="text-primary-dark font-semibold hover:text-gold transition-colors">الامتحانات</Link>
            <a
              href="https://web.whatsapp.com/send?phone=201016223940&text=%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%D9%86%D8%A7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-dark font-semibold hover:text-gold transition-colors"
            >
              تواصل معنا
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-primary-dark font-bold">أهلاً، {user.name}</span>
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="bg-primary/10 text-primary-dark font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary hover:text-white transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  اللوحة
                </Link>
                <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-primary font-semibold hover:text-primary-dark transition-colors px-4 py-2">
                  دخول المنصة
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-gold/20 transition-all transform hover:-translate-y-0.5 border border-gold/50">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-primary-dark p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#D4AF37]/20 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2 shadow-xl">
            <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">الرئيسية</Link>
            <Link href="/courses" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> الكورسات
            </Link>
            <Link href="/exams" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">الامتحانات</Link>
            <a
              href="https://web.whatsapp.com/send?phone=201016223940"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light"
            >
              تواصل معنا
            </a>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-center text-primary font-bold px-4 py-2 bg-blue-50 rounded-lg">
                    لوحة التحكم
                  </Link>
                  <button onClick={handleLogout} className="text-center text-red-500 font-bold px-4 py-2 bg-red-50 rounded-lg">
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-center text-primary font-bold px-4 py-2 bg-blue-50 rounded-lg">
                    دخول المنصة
                  </Link>
                  <Link href="/register" className="text-center bg-gold text-primary-dark font-bold px-4 py-2 rounded-lg">
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
