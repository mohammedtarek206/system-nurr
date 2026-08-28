"use client";

import { useState, useEffect } from "react";
import {
    Bell,
    Send,
    Users,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Sparkles,
    Trash2,
    Plus,
    BarChart3,
    Search,
    Filter
} from "lucide-react";

export default function NotificationsManager() {
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        read: 0,
        delivered: 0,
        failed: 0
    });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [specializations, setSpecializations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        link: "",
        priority: "normal" as "normal" | "important" | "urgent",
        targetType: "all" as "all" | "specific",
        targetSpecializations: [] as string[],
        targetStudents: [] as string[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [notifRes, specRes, studRes] = await Promise.all([
                fetch("/api/admin/notifications"),
                fetch("/api/admin/specializations"),
                fetch("/api/admin/students")
            ]);

            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setStats(notifData.stats || stats);
                setNotifications(notifData.notifications || []);
            }
            if (specRes.ok) {
                const specData = await specRes.json();
                setSpecializations(Array.isArray(specData) ? specData : []);
            }
            if (studRes.ok) {
                const studData = await studRes.json();
                setStudents(Array.isArray(studData) ? studData : []);
            }
        } catch (e) {
            console.error("Failed to load admin notifications data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.message) return alert("يرجى إدخال عنوان ونص الإشعار");

        setSending(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                alert(`تم إرسال الإشعار بنجاح إلى ${data.recipientsCount || 0} مستخدم!`);
                setShowForm(false);
                setFormData({
                    title: "",
                    message: "",
                    link: "",
                    priority: "normal",
                    targetType: "all",
                    targetSpecializations: [],
                    targetStudents: []
                });
                fetchData();
            } else {
                alert("فشل إرسال الإشعار");
            }
        } catch (e) {
            alert("حدث خطأ أثناء إرسال الإشعار");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
        try {
            const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (e) {
            console.error("Failed to delete notification", e);
        }
    };

    const toggleSpecialization = (specName: string) => {
        setFormData(prev => {
            const exists = prev.targetSpecializations.includes(specName);
            const updated = exists
                ? prev.targetSpecializations.filter(s => s !== specName)
                : [...prev.targetSpecializations, specName];
            return { ...prev, targetSpecializations: updated };
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                        <Bell className="w-6 h-6 text-primary" />
                        إدارة الإشعارات والتنبيهات العامة
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">إرسال ومتابعة الإشعارات المباشرة للطلاب والتخصصات</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary-dark hover:bg-primary text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    إرسال إشعار جديد
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-primary-dark">{stats.total}</div>
                        <div className="text-xs text-gray-500 font-bold">إجمالي الإشعارات</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-amber-600">{stats.unread}</div>
                        <div className="text-xs text-gray-500 font-bold">غير مقروءة</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-green-600">{stats.read}</div>
                        <div className="text-xs text-gray-500 font-bold">مقروءة</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-purple-600">{stats.delivered}</div>
                        <div className="text-xs text-gray-500 font-bold">تم تسليمها</div>
                    </div>
                </div>
            </div>

            {/* Send Notification Form */}
            {showForm && (
                <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-lg font-bold text-primary-dark border-b pb-3">إرسال إشعار موجه</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الإشعار *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="مثال: تنبيه بخصوص موعد الامتحان المباشر"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">الأولوية (Priority)</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="normal">عادي (Normal)</option>
                                <option value="important">هام (Important)</option>
                                <option value="urgent">عاجل جداً (Urgent)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">نص الإشعار *</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="اكتب تفاصيل الإشعار هنا..."
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">رابط التوجيه (اختياري)</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="مثال: /exams أو /courses/123"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">الجمهور المستهدف (Target Audience)</label>
                            <select
                                value={formData.targetType}
                                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="all">جميع الطلاب في المنصة (Everyone)</option>
                                <option value="specific">تخصصات محددة (Specific Specializations)</option>
                            </select>
                        </div>
                    </div>

                    {formData.targetType === "specific" && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">اختر التخصصات المستهدفة:</label>
                            <div className="flex flex-wrap gap-2">
                                {specializations.map((spec) => {
                                    const isSelected = formData.targetSpecializations.includes(spec.name);
                                    return (
                                        <button
                                            type="button"
                                            key={spec._id}
                                            onClick={() => toggleSpecialization(spec.name)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${isSelected
                                                    ? "bg-primary-dark text-white border-primary-dark shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                }`}
                                        >
                                            {spec.arName || spec.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={sending}
                            className="px-8 py-2.5 rounded-xl bg-primary-dark hover:bg-primary text-white font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {sending ? "جاري الإرسال..." : "إرسال الإشعار الآن"}
                        </button>
                    </div>
                </form>
            )}

            {/* Notifications Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-primary-dark">سجل الإشعارات المرسلة مؤخراً</h3>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">لا توجد إشعارات مرسلة في السجل.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                                <tr>
                                    <th className="p-4">العنوان والنص</th>
                                    <th className="p-4">المستلم / التخصص</th>
                                    <th className="p-4">النوع</th>
                                    <th className="p-4">الأولوية</th>
                                    <th className="p-4">تاريخ الإرسال</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {notifications.map((n) => (
                                    <tr key={n._id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-primary-dark">{n.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1 max-w-md">{n.message}</div>
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-gray-700">
                                            {n.userId?.fullName || n.userId?.email || "جميع الطلاب"}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                                                {n.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-bold ${n.priority === "urgent"
                                                        ? "bg-red-100 text-red-700"
                                                        : n.priority === "important"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {n.priority}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 dir-ltr">
                                            {new Date(n.createdAt).toLocaleString("ar-EG")}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.isRead ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {n.isRead ? "مقروء" : "غير مقروء"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDelete(n._id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
