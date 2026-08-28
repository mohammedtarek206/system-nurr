"use client";

import Link from "next/link";
import { User, Mail, Lock, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    specializationId: "",
  });

  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const DEFAULT_FALLBACK_SPECS = [
    { _id: "tech_default", arName: "فني / فني سعودي", icon: "👨‍⚕️" },
    { _id: "spec_default", arName: "أخصائي / فني (الإمارات-قطر-عمان)", icon: "🏥" },
    { _id: "mid_default", arName: "قبالة", icon: "👶" }
  ];

  useEffect(() => {
    fetch("/api/specializations")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSpecializations(data);
        } else {
          setSpecializations(DEFAULT_FALLBACK_SPECS);
        }
        setLoadingSpecs(false);
      })
      .catch(() => {
        setSpecializations(DEFAULT_FALLBACK_SPECS);
        setLoadingSpecs(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.specializationId) {
      return setError("يرجى اختيار التخصص");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("كلمتا المرور غير متطابقتين");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء التسجيل");
      }

      await refreshUser();

      setSuccess("تم إنشاء الحساب بنجاح! جاري تحويلك...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary-dark rounded-full border-2 border-gold text-gold font-bold text-2xl mb-4 hover:scale-105 transition-transform">
            A
          </Link>
          <h1 className="text-3xl font-bold text-primary-dark mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-500">انضم إلى أفضل منصة لإعداد الممرضين لاختبارات البرومترك</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm font-semibold">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div>
              <label className="block text-lg font-bold text-[#061B3D] mb-4 text-center">اختر تخصصك *</label>
              {loadingSpecs ? (
                <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {specializations.map(spec => (
                    <div
                      key={spec._id}
                      onClick={() => setFormData({ ...formData, specializationId: spec._id })}
                      className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 relative ${formData.specializationId === spec._id
                        ? 'border-gold bg-[#D4AF37]/5 shadow-sm transform -translate-y-1'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {formData.specializationId === spec._id && (
                        <div className="absolute top-2 right-2 text-gold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}

                      {spec.icon && <span className="text-3xl mb-2">{spec.icon}</span>}
                      <span className="font-bold text-[#061B3D] text-sm leading-tight mt-2">{spec.arName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-6 border-gray-100" />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم كاملاً *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="الاسم الثلاثي"
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف *</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="05X XXX XXXX"
                  />
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني *</label>
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">تأكيد كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              disabled={loading || !formData.specializationId}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold text-lg py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-8 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>إنشاء الحساب <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-bold text-primary hover:text-gold transition-colors">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
