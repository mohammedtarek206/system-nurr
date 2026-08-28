"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";

export default function SpecializationsManager() {
    const [specializations, setSpecializations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        arName: "",
        slug: "",
        description: "",
        icon: "🎓",
        active: true,
        order: 0
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const DEFAULT_SPECS = [
        { arName: "فني / فني سعودي", name: "Saudi Technician", slug: "saudi-technician", icon: "👨‍⚕️", order: 1, active: true },
        { arName: "أخصائي / فني (الإمارات - قطر - عمان)", name: "Gulf Specialist", slug: "gulf-specialist", icon: "🌍", order: 2, active: true },
        { arName: "قبالة", name: "Midwifery", slug: "midwifery", icon: "👶", order: 3, active: true }
    ];

    const fetchSpecializations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/specializations");
            const data = await res.json();
            setSpecializations(Array.isArray(data) ? data : []);
        } catch {
            setSpecializations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecializations();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const url = editingId
                ? `/api/admin/specializations/${editingId}`
                : "/api/admin/specializations";

            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "حدث خطأ أثناء الحفظ");
            }

            setShowForm(false);
            setEditingId(null);
            fetchSpecializations();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (spec: any) => {
        setFormData({
            name: spec.name,
            arName: spec.arName,
            slug: spec.slug,
            description: spec.description || "",
            icon: spec.icon || "🎓",
            active: spec.active,
            order: spec.order
        });
        setEditingId(spec._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا التخصص؟ قد يؤثر ذلك على المستخدمين والكورسات المرتبطة.")) return;
        try {
            const res = await fetch(`/api/admin/specializations/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "حدث خطأ");
            fetchSpecializations();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const addDefaultSpecializations = async () => {
        setLoading(true);
        for (const spec of DEFAULT_SPECS) {
            await fetch("/api/admin/specializations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(spec)
            });
        }
        fetchSpecializations();
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#061B3D]">إدارة التخصصات</h2>
                    <p className="text-gray-500 text-sm">أضف أو عدّل تخصصات المنصة للتحكم بالجمهور المستهدف</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: "", arName: "", slug: "", description: "", icon: "🎓", active: true, order: 0 });
                        setEditingId(null);
                        setShowForm(!showForm);
                    }}
                    className="bg-[#061B3D] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#1E3A8A] transition flex items-center gap-2"
                >
                    {showForm ? "إلغاء" : <><Plus className="w-4 h-4" /> إضافة تخصص</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 text-[#061B3D]">{editingId ? "تعديل التخصص" : "إضافة تخصص جديد"}</h3>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">الاسم بالعربية *</label>
                            <input required type="text" value={formData.arName} onChange={e => setFormData({ ...formData, arName: e.target.value })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D]" placeholder="مثال: فني سعودي" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">الاسم بالإنجليزية (للنظام) *</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D]" placeholder="e.g. Saudi Technician" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">الرابط المعرف Slug *</label>
                            <input required type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D] font-mono text-sm" placeholder="e.g. saudi-technician" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">أيقونة (اختياري)</label>
                            <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D] font-emoji" placeholder="🎓" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">وصف مختصر</label>
                            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">الترتيب</label>
                            <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: Number(e.target.value) })} className="w-full px-4 py-2 rounded-xl border outline-none focus:border-[#061B3D]" />
                        </div>
                        <div className="flex items-center gap-2 mt-6 cursor-pointer">
                            <input type="checkbox" id="activeSpec" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-5 h-5 accent-[#061B3D] cursor-pointer" />
                            <label htmlFor="activeSpec" className="font-semibold text-sm cursor-pointer">تخصص فعال</label>
                        </div>
                    </div>

                    <div className="mt-5">
                        <button type="submit" disabled={saving} className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ التخصص"}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#061B3D]" /></div>
            ) : specializations.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50">
                    <p className="text-gray-500 mb-4 font-semibold">لا توجد تخصصات مضافة بعد.</p>
                    <button onClick={addDefaultSpecializations} className="bg-[#D4AF37] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#b8922a] transition">
                        إضافة التخصصات الأساسية تلقائياً
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="p-4">الأيقونة</th>
                                <th className="p-4">الاسم بالعربية</th>
                                <th className="p-4">الاسم بالإنجليزية</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">الترتيب</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specializations.map(spec => (
                                <tr key={spec._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="p-4 text-2xl">{spec.icon}</td>
                                    <td className="p-4 font-bold text-[#061B3D]">{spec.arName}</td>
                                    <td className="p-4 text-gray-600">{spec.name}</td>
                                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{spec.slug}</span></td>
                                    <td className="p-4 text-gray-500">{spec.order}</td>
                                    <td className="p-4">
                                        {spec.active ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full w-max text-xs"><CheckCircle2 className="w-3 h-3" /> فعال</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full w-max text-xs"><XCircle className="w-3 h-3" /> معطل</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(spec)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(spec._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
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
