"use client";

import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D4AF37]/20 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[100px] py-1">
          <div className="flex-shrink-0 relative z-[100]">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="أحمد الأزهري للتأهيل والتدريب المهني" 
                className="w-auto h-[100px] md:h-[160px] lg:h-[200px] max-w-[600px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 scale-125 md:scale-150 origin-right translate-y-4 md:translate-y-8"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-primary-dark font-semibold hover:text-gold transition-colors">الرئيسية</Link>
            <Link href="/#lectures" className="text-primary-dark font-semibold hover:text-gold transition-colors">المحاضرات</Link>
            <Link href="/exams" className="text-primary-dark font-semibold hover:text-gold transition-colors">الامتحانات</Link>
            <Link href="#contact" className="text-primary-dark font-semibold hover:text-gold transition-colors">تواصل معنا</Link>
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
            <Link href="/" className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">الرئيسية</Link>
            <Link href="/#lectures" className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">المحاضرات</Link>
            <Link href="/exams" className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">الامتحانات</Link>
            <Link href="#contact" className="block px-3 py-2 text-primary-dark font-semibold hover:bg-light">تواصل معنا</Link>
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
