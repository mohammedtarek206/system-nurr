"use client";

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, Trash2, Search, RefreshCw, Loader2, AlertTriangle, ExternalLink, MessageCircle, Calendar, FileText } from "lucide-react";

export default function ExamBookingsManager() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [filterPageType, setFilterPageType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/exam-bookings");
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast("حدث خطأ أثناء تحميل سجل الحجوزات", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            const res = await fetch(`/api/admin/exam-bookings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                showToast(`تم تغيير حالة الطلب إلى ${status === 'Approved' ? 'معتمد' : 'مرفوض'}`);
                fetchBookings();
            }
        } catch {
            showToast("حدث خطأ أثناء تحديث حالة الطلب", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
        try {
            const res = await fetch(`/api/admin/exam-bookings/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("تم حذف الحجز بنجاح");
                fetchBookings();
            } else {
                showToast("تعذر حذف الحجز", "error");
            }
        } catch {
            showToast("حدث خطأ أثناء الحذف", "error");
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchSearch = !search ||
            b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            b.eligibilityNumber?.toLowerCase().includes(search.toLowerCase()) ||
            b.accessCode?.toLowerCase().includes(search.toLowerCase());
        const matchPage = !filterPageType || b.pageType === filterPageType;
        const matchStatus = !filterStatus || b.status === filterStatus;
        return matchSearch && matchPage && matchStatus;
    });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative" dir="rtl">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 border text-sm transition-all animate-bounce ${toast.type === 'success' ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* Top Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        إدارة استمارات الحجز (Exam Bookings Management)
                    </h2>
                    <p className="text-gray-500 text-sm">مراجعة وإدارة طلبات حجوزات "ليلة الامتحان" و "NCLEX" وأرقام الأحقية</p>
                </div>
                <button
                    onClick={fetchBookings}
                    className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition flex items-center gap-2 font-semibold text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    تحديث السجل
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بحث بالاسم، رقم الأحقية، أو الكود..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-primary text-sm bg-white"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div>
                    <select value={filterPageType} onChange={e => setFilterPageType(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none text-xs bg-white font-semibold">
                        <option value="">جميع الصفحات</option>
                        <option value="NIGHT_EXAM">ليلة الامتحان</option>
                        <option value="NCLEX">NCLEX</option>
                    </select>
                </div>

                <div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none text-xs bg-white font-semibold">
                        <option value="">جميع الحالات</option>
                        <option value="Pending">قيد الانتظار</option>
                        <option value="Approved">معتمد</option>
                        <option value="Rejected">مرفوض</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    لا توجد حجوزات مسجلة حتى الآن.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                            <tr>
                                <th className="p-3">الاسم الرباعي للطالب</th>
                                <th className="p-3">الصفحة</th>
                                <th className="p-3">تاريخ الامتحان</th>
                                <th className="p-3">رقم الأحقية</th>
                                <th className="p-3">الكود المستخدم</th>
                                <th className="p-3">تاريخ الإرسال</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(b => (
                                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-3">
                                        <div className="font-bold text-gray-900">{b.fullName}</div>
                                        {b.userId?.phone && <div className="text-xs text-gray-500">{b.userId.phone}</div>}
                                    </td>
                                    <td className="p-3 font-bold">
                                        {b.pageType === 'NIGHT_EXAM' ? (
                                            <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200">🌙 ليلة الامتحان</span>
                                        ) : (
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">🩺 NCLEX</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-bold text-gray-700 flex items-center gap-1.5 pt-4">
                                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                                        {b.examDate}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-primary">
                                        {b.eligibilityNumber}
                                    </td>
                                    <td className="p-3">
                                        <span className="font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 text-xs">
                                            {b.accessCode || b.accessCodeId?.code || "—"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-gray-400">
                                        {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                b.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                            {b.status === 'Approved' ? 'معتمد' : b.status === 'Rejected' ? 'مرفوض' : 'قيد الانتظار'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {b.status !== 'Approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(b._id, 'Approved')}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                    title="اعتماد الحجز"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {b.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(b._id, 'Rejected')}
                                                    className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition"
                                                    title="رفض الحجز"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <a
                                                href={`https://wa.me/201016223940?text=${encodeURIComponent(`مرحباً ${b.fullName}، بخصوص طلبك في ${b.pageType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                                                title="مراسلة الطالب عبر واتساب"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(b._id)}
                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                title="حذف الحجز"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
