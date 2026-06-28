"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, MessageCircle, User, BookOpen, Phone, Mail, Globe, Briefcase, RefreshCw } from "lucide-react";

export default function SubscriptionRequestsManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/subscription-requests");
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected", whatsappPhone?: string) => {
    setUpdating(id);
    const res = await fetch(`/api/admin/subscription-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      if (status === "approved" && whatsappPhone) {
        const msg = encodeURIComponent("السلام عليكم،\nتم قبول طلب اشتراكك في منصة الأزهري للتأهيل والتدريب المهني.\nسيتم التواصل معك قريباً لتفعيل الاشتراك.\nشكراً لثقتك بنا 🌟");
        window.open(`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${msg}`, "_blank");
      }
      fetchRequests();
    }
    setUpdating(null);
  };

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />مقبول</span>;
    if (status === "rejected") return <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />مرفوض</span>;
    return <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />قيد الانتظار</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-600" /> طلبات الاشتراك
        </h2>
        <button onClick={fetchRequests} className="bg-gray-100 text-gray-600 p-2 rounded-xl hover:bg-gray-200 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-xl">
        {(["all", "pending", "approved", "rejected"] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${filter === tab ? "bg-white shadow-sm text-[#061B3D]" : "text-gray-500 hover:text-gray-700"}`}>
            {tab === "all" && `الكل (${counts.all})`}
            {tab === "pending" && `⏳ انتظار (${counts.pending})`}
            {tab === "approved" && `✅ مقبول (${counts.approved})`}
            {tab === "rejected" && `❌ مرفوض (${counts.rejected})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد طلبات.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <div key={req._id} className={`border-2 rounded-2xl p-5 transition ${req.status === "pending" ? "border-yellow-200 bg-yellow-50/30" : req.status === "approved" ? "border-green-200 bg-green-50/20" : "border-red-200 bg-red-50/20"}`}>
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#061B3D]">{req.name}</h3>
                    <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4 text-[#1E3A8A] flex-shrink-0" />
                  <span className="font-semibold truncate">{req.courseName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span dir="ltr">{req.phone}</span>
                </div>
                {req.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                )}
                {req.country && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{req.country}</span>
                  </div>
                )}
                {req.profession && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>{req.profession}</span>
                  </div>
                )}
              </div>

              {req.message && (
                <div className="bg-white/70 rounded-xl p-3 mb-4 border border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">{req.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/${req.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-600 transition">
                  <MessageCircle className="w-4 h-4" /> واتساب
                </a>
                {req.status === "pending" && (
                  <>
                    <button onClick={() => handleUpdateStatus(req._id, "approved", req.phone)} disabled={updating === req._id}
                      className="flex items-center gap-2 bg-green-100 text-green-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-200 transition disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> {updating === req._id ? "جاري..." : "قبول + إرسال واتساب"}
                    </button>
                    <button onClick={() => handleUpdateStatus(req._id, "rejected")} disabled={updating === req._id}
                      className="flex items-center gap-2 bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-200 transition disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> {updating === req._id ? "جاري..." : "رفض"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
