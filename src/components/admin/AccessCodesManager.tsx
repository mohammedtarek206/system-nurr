"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Edit, CheckCircle, XCircle, Clock, AlertTriangle, Eye, RefreshCw, X, Search, Loader2, Users } from "lucide-react";

export default function AccessCodesManager() {
    const [codes, setCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filters
    const [filterPageType, setFilterPageType] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [search, setSearch] = useState("");

    // Modal for Viewing Used Users
    const [viewUsersModalCode, setViewUsersModalCode] = useState<any>(null);

    const initialForm = {
        code: "",
        pageType: "NIGHT_EXAM" as "NIGHT_EXAM" | "NCLEX",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        status: "Active" as "Active" | "Expired" | "Disabled",
        maxUses: 0
    };

    const [formData, setFormData] = useState(initialForm);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/access-codes");
            const data = await res.json();
            setCodes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast("حدث خطأ أثناء تحميل أكواد الوصول", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleOpenNewForm = () => {
        setEditingId(null);
        setFormData(initialForm);
        setShowForm(true);
    };

    const handleEdit = (codeObj: any) => {
        setEditingId(codeObj._id);
        setFormData({
            code: codeObj.code || "",
            pageType: codeObj.pageType || "NIGHT_EXAM",
            startDate: codeObj.startDate || "",
            startTime: codeObj.startTime || "",
            endDate: codeObj.endDate || "",
            endTime: codeObj.endTime || "",
            status: codeObj.status || "Active",
            maxUses: codeObj.maxUses || 0
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim()) {
            showToast("يرجى إدخال الكود", "error");
            return;
        }

        setSaving(true);
        try {
            const url = editingId ? `/api/admin/access-codes/${editingId}` : "/api/admin/access-codes";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "حدث خطأ أثناء الحفظ");

            showToast(editingId ? "تم تحديث الكود بنجاح" : "تم إنشاء كود الوصول بنجاح");
            setShowForm(false);
            setEditingId(null);
            setFormData(initialForm);
            fetchCodes();
        } catch (err: any) {
            showToast(err.message || "فشل الحفظ", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (codeObj: any) => {
        const newStatus = codeObj.status === "Disabled" ? "Active" : "Disabled";
        try {
            const res = await fetch(`/api/admin/access-codes/${codeObj._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showToast(`تم ${newStatus === 'Active' ? 'تفعيل' : 'تعطيل'} الكود بنجاح`);
                fetchCodes();
            }
        } catch (e) {
            showToast("حدث خطأ أثناء تغيير الحالة", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;
        try {
            const res = await fetch(`/api/admin/access-codes/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("تم حذف الكود بنجاح");
                fetchCodes();
            } else {
                showToast("تعذر حذف الكود", "error");
            }
        } catch {
            showToast("حدث خطأ أثناء الحذف", "error");
        }
    };

    const filteredCodes = codes.filter(c => {
        const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase());
        const matchPage = !filterPageType || c.pageType === filterPageType;
        const matchStatus = !filterStatus || c.computedStatus === filterStatus || c.status === filterStatus;
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
                        <Key className="w-6 h-6 text-gold" />
                        إدارة أكواد الوصول (Access Codes Management)
                    </h2>
                    <p className="text-gray-500 text-sm">إنشاء وتحديد صلاحيات ومواعيد الدخول لصفحات "ليلة الامتحان" و "NCLEX"</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCodes}
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => showForm ? setShowForm(false) : handleOpenNewForm()}
                        className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-dark transition shadow-md"
                    >
                        {showForm ? "إلغاء" : <><Plus className="w-5 h-5" /> إنشاء كود جديد</>}
                    </button>
                </div>
            </div>

            {/* Form / Modal for Create/Edit */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
                            {editingId ? "✏️ تعديل كود الوصول" : "➕ إضافة كود وصول جديد"}
                        </h3>
                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Code */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">كود الوصول (Access Code) *</label>
                            <input
                                required
                                type="text"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="مثال: NIGHT2026 / NCLEXPASS"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary font-mono font-bold uppercase text-left bg-white"
                                dir="ltr"
                            />
                        </div>

                        {/* Page Type */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">مخصص لصفحة (Target Page) *</label>
                            <select
                                value={formData.pageType}
                                onChange={e => setFormData({ ...formData, pageType: e.target.value as any })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-bold text-primary-dark"
                            >
                                <option value="NIGHT_EXAM">ليلة الامتحان (Night Exam)</option>
                                <option value="NCLEX">NCLEX</option>
                            </select>
                        </div>

                        {/* Start Date & Time */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">تاريخ بداية الصلاحية (Start Date)</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">وقت بداية الصلاحية (Start Time)</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
                            />
                        </div>

                        {/* End Date & Time */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">تاريخ نهاية الصلاحية (End Date)</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">وقت نهاية الصلاحية (End Time)</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
                            />
                        </div>

                        {/* Max Uses */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">الحد الأقصى لعدد الاستخدامات (0 = غير محدود)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxUses}
                                onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-bold"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">الحالة الإدارية (Status)</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-bold"
                            >
                                <option value="Active">مفعل (Active)</option>
                                <option value="Disabled">معطل (Disabled)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "تحديث الكود" : "حفظ الكود"}
                        </button>
                    </div>
                </form>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بحث بالكود..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-primary text-sm bg-white font-mono uppercase"
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
                        <option value="Active">نشط</option>
                        <option value="Scheduled">مجدول</option>
                        <option value="Expired">منتهي الصلاحية</option>
                        <option value="Disabled">معطل</option>
                    </select>
                </div>
            </div>

            {/* Table List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredCodes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    لا توجد أكواد وصول مطابقة.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                            <tr>
                                <th className="p-3">الكود</th>
                                <th className="p-3">الصفحة المخصصة</th>
                                <th className="p-3">فترة الصلاحية (من - إلى)</th>
                                <th className="p-3">الاستخدامات (المستخدم / المسموح)</th>
                                <th className="p-3">الحالة الديناميكية</th>
                                <th className="p-3 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCodes.map(codeObj => {
                                const status = codeObj.computedStatus || codeObj.status;
                                return (
                                    <tr key={codeObj._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="p-3">
                                            <span className="font-mono font-black text-base text-primary-dark tracking-wide bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                                {codeObj.code}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold text-gray-800">
                                            {codeObj.pageType === 'NIGHT_EXAM' ? (
                                                <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200">🌙 ليلة الامتحان</span>
                                            ) : (
                                                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">🩺 NCLEX</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs text-gray-600">
                                            <div><strong className="text-gray-800">البداية:</strong> {codeObj.startDate ? `${codeObj.startDate} ${codeObj.startTime || ''}` : 'فوراً'}</div>
                                            <div><strong className="text-gray-800">النهاية:</strong> {codeObj.endDate ? `${codeObj.endDate} ${codeObj.endTime || ''}` : 'دائم'}</div>
                                        </td>
                                        <td className="p-3 text-xs font-bold">
                                            <span className="text-primary">{codeObj.currentUses || 0}</span> / <span className="text-gray-500">{codeObj.maxUses > 0 ? codeObj.maxUses : 'غير محدود'}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    status === 'Scheduled' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                        status === 'Expired' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}>
                                                {status === 'Active' && <CheckCircle className="w-3.5 h-3.5" />}
                                                {status === 'Scheduled' && <Clock className="w-3.5 h-3.5" />}
                                                {status === 'Expired' && <AlertTriangle className="w-3.5 h-3.5" />}
                                                {status === 'Disabled' && <XCircle className="w-3.5 h-3.5" />}
                                                {status === 'Active' ? 'نشط' : status === 'Scheduled' ? 'مجدول' : status === 'Expired' ? 'منتهي الصلاحية' : 'معطل'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => setViewUsersModalCode(codeObj)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                    title="عرض الطلاب الذين استخدموا الكود"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(codeObj)}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(codeObj)}
                                                    className={`p-1.5 rounded-lg transition ${codeObj.status === 'Disabled' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                                    title={codeObj.status === 'Disabled' ? 'تفعيل الكود' : 'تعطيل الكود'}
                                                >
                                                    {codeObj.status === 'Disabled' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(codeObj._id)}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* View Users Modal */}
            {viewUsersModalCode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                سجل استخدام الكود: <span className="font-mono text-gold">{viewUsersModalCode.code}</span>
                            </h3>
                            <button onClick={() => setViewUsersModalCode(null)} className="text-gray-400 hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-3">
                            {(!viewUsersModalCode.usedUsers || viewUsersModalCode.usedUsers.length === 0) ? (
                                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                    لم يتم استخدام هذا الكود بواسطة أي طالب حتى الآن.
                                </div>
                            ) : (
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                                        <tr>
                                            <th className="p-2.5">#</th>
                                            <th className="p-2.5">اسم الطالب</th>
                                            <th className="p-2.5">رقم الأحقية</th>
                                            <th className="p-2.5">تاريخ الاستخدام</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewUsersModalCode.usedUsers.map((u: any, idx: number) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-2.5 text-gray-400 font-bold">{idx + 1}</td>
                                                <td className="p-2.5 font-bold text-gray-900">{u.fullName || "طالب"}</td>
                                                <td className="p-2.5 font-mono text-primary">{u.eligibilityNumber || "—"}</td>
                                                <td className="p-2.5 text-gray-500">{new Date(u.usedAt).toLocaleString('ar-EG')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="border-t pt-3 flex justify-end">
                            <button
                                onClick={() => setViewUsersModalCode(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition text-sm"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
