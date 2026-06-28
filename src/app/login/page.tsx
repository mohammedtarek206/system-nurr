"use client";

import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الدخول");
      }

      await refreshUser();

      if (data.user.role === 'admin') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary-dark rounded-full border-2 border-gold text-gold font-bold text-2xl mb-4 hover:scale-105 transition-transform">
            A
          </Link>
          <h1 className="text-3xl font-bold text-primary-dark mb-2">تسجيل الدخول</h1>
          <p className="text-gray-500">أهلاً بك مجدداً في منصة الأزهري</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  placeholder="example@email.com"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">كلمة المرور</label>
                <Link href="#" className="text-sm font-medium text-primary hover:text-gold transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold text-lg py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>دخول <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="font-bold text-primary hover:text-gold transition-colors">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
