"use client";

import { useState } from "react";
import { X, CheckCircle, MessageCircle } from "lucide-react";

interface SubscribeModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

export default function SubscribeModal({ courseId, courseName, onClose }: SubscribeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    profession: "",
    courseName: courseName,
    courseId: courseId,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        // Open WhatsApp
        const message = encodeURIComponent(
          `السلام عليكم، أرغب في الاشتراك في كورس: ${courseName}\nالاسم: ${formData.name}\nالهاتف: ${formData.phone}\nالدولة: ${formData.country}\nالمهنة: ${formData.profession}`
        );
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          window.open(`whatsapp://send?phone=201016223940&text=${message}`, "_blank");
        } else {
          window.open(`https://web.whatsapp.com/send?phone=201016223940&text=${message}`, "_blank");
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#061B3D]">
            <MessageCircle className="inline w-5 h-5 text-green-500 ml-2" />
            طلب الاشتراك
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-[#061B3D] mb-2">تم إرسال طلب الاشتراك بنجاح!</h3>
            <p className="text-gray-500 mb-2">سيتم مراجعة طلبك من قبل الإدارة.</p>
            <p className="text-sm text-gray-400 mb-6">تم فتح واتساب لإتمام التواصل مع الإدارة.</p>
            <button
              onClick={onClose}
              className="bg-[#061B3D] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1E3A8A] transition"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-3 mb-4">
              <p className="text-sm font-bold text-[#061B3D]">الكورس المختار: {courseName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] transition"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] transition"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف *</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] transition"
                  placeholder="+20 1xxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الدولة</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] transition"
                  placeholder="مصر، السعودية..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">المهنة</label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] transition"
                  placeholder="ممرض، طبيب..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-[#061B3D] font-bold py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>جاري الإرسال...</span>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  إرسال طلب الاشتراك
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              بعد الإرسال سيفتح واتساب تلقائياً للتواصل مع الإدارة
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
