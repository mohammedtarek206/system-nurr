"use client";

import { useState, useEffect } from "react";
import {
    BookOpen, Plus, Trash2, Edit, Eye, EyeOff, Search, Filter,
    X, Check, AlertCircle, Loader2, FileText, FileImage, Tag,
    BarChart3, Users, Key, Shield, Calendar, Clock, ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Summary {
    _id: string;
    title: string;
    description: string;
    fileType: "image" | "pdf";
    status: "draft" | "published" | "hidden";
    order: number;
    views: number;
    coverImage?: string;
    driveUrl?: string;
    createdAt: string;
    categoryId?: { _id: string; name: string; arName: string } | string;
    targetSpecializations: string[];
    targetType: "all" | "specific";
}

interface Category {
    _id: string;
    name: string;
    arName: string;
    order: number;
}

interface AccessCode {
    _id: string;
    label: string;
    active: boolean;
    validFrom: string;
    validUntil: string;
    maxUses: number;
    currentUses: number;
    createdAt: string;
}

interface Stats {
    totalSummaries: number;
    published: number;
    hidden: number;
    draft: number;
    totalViews: number;
    uniqueUsers: number;
    mostViewed: any;
    recentLogs: any[];
}



const STATUS_CONFIG = {
    draft: { label: "مسودة", color: "bg-gray-100 text-gray-600" },
    published: { label: "منشور", color: "bg-green-100 text-green-700" },
    hidden: { label: "مخفي", color: "bg-red-100 text-red-600" },
};

// ─── Sub-tab: Summaries Manager ───────────────────────────────────────────────
function SummariesTab() {
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [specializations, setSpecializations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        categoryId: "",
        driveUrl: "",
        fileType: "pdf" as "pdf" | "image",
        targetSpecializations: [] as string[],
        targetType: "all" as "all" | "specific",
        status: "draft" as "draft" | "published" | "hidden",
        order: 0,
        coverImage: "",
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const [sumRes, catRes, specRes] = await Promise.all([
            fetch("/api/admin/summaries"),
            fetch("/api/admin/summary-categories"),
            fetch("/api/admin/specializations")
        ]);
        const sumData = await sumRes.json();
        const catData = await catRes.json();
        const specData = await specRes.json();
        setSummaries(Array.isArray(sumData) ? sumData : []);
        setCategories(Array.isArray(catData) ? catData : []);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setFormData({ title: "", description: "", categoryId: categories[0]?._id || "", driveUrl: "", fileType: "pdf", targetType: "all", targetSpecializations: [], status: "draft", order: 0, coverImage: "" });
        setEditingSummary(null);
    };

    const openEdit = (s: Summary) => {
        setEditingSummary(s);
        const catId = typeof s.categoryId === 'object' ? s.categoryId?._id : s.categoryId;
        setFormData({
            title: s.title,
            description: s.description || "",
            categoryId: catId || "",
            driveUrl: s.driveUrl || "",
            fileType: s.fileType,
            targetSpecializations: s.targetSpecializations || [],
            targetType: s.targetType || "all",
            status: s.status,
            order: s.order,
            coverImage: s.coverImage || "",
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const url = editingSummary ? `/api/admin/summaries/${editingSummary._id}` : "/api/admin/summaries";
        const method = editingSummary ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            setShowForm(false);
            resetForm();
            fetchData();
        } else {
            const d = await res.json();
            alert(d.message || "حدث خطأ");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الملخص؟")) return;
        const res = await fetch(`/api/admin/summaries/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    };

    const handleStatusChange = async (id: string, status: string) => {
        const res = await fetch(`/api/admin/summaries/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) fetchData();
    };

    const filtered = summaries.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1E3A8A]/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#061B3D]">
                        إدارة الملخصات
                        <span className="text-gray-400 font-normal text-sm mr-2">({summaries.length})</span>
                    </h3>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="bg-[#061B3D] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-[#1E3A8A] transition flex items-center gap-2 text-sm"
                >
                    {showForm ? <><X className="w-4 h-4" /> إلغاء</> : <><Plus className="w-4 h-4" /> إضافة ملخص</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <h4 className="font-bold text-[#061B3D] mb-5 text-base">
                        {editingSummary ? "✏️ تعديل الملخص" : "➕ ملخص جديد"}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-1.5">العنوان *</label>
                            <input required type="text" value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="عنوان الملخص"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-1.5">الوصف</label>
                            <textarea rows={3} value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="وصف مختصر للملخص..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm resize-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الفئة *</label>
                            <select required value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm">
                                <option value="">اختر الفئة...</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.arName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">نوع الملف *</label>
                            <select value={formData.fileType}
                                onChange={e => setFormData({ ...formData, fileType: e.target.value as any })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm">
                                <option value="pdf">PDF</option>
                                <option value="image">صورة</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-1.5">رابط Google Drive *</label>
                            <input required type="url" value={formData.driveUrl}
                                onChange={e => setFormData({ ...formData, driveUrl: e.target.value })}
                                placeholder="https://drive.google.com/file/d/..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                            <p className="text-xs text-gray-400 mt-1">الرابط لن يظهر للمستخدم مباشرة - يتم تحويله إلى Embed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">رابط صورة الغلاف (اختياري)</label>
                            <input type="url" value={formData.coverImage}
                                onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">ترتيب العرض</label>
                            <input type="number" min="0" value={formData.order}
                                onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">حالة النشر</label>
                            <select value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm">
                                <option value="draft">مسودة</option>
                                <option value="published">منشور</option>
                                <option value="hidden">مخفي</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الجمهور المستهدف</label>
                            <select value={formData.targetType} onChange={e => setFormData({ ...formData, targetType: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] mb-2 text-sm">
                                <option value="all">الجميع</option>
                                <option value="specific">تخصصات محددة</option>
                            </select>

                            {formData.targetType === 'specific' && (
                                <div className="bg-white p-3 rounded-xl border border-gray-300 space-y-2 max-h-48 overflow-y-auto">
                                    {specializations.map(spec => (
                                        <label key={spec._id} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox"
                                                checked={formData.targetSpecializations.includes(spec._id)}
                                                className="accent-[#1E3A8A]"
                                                onChange={e => {
                                                    const next = e.target.checked
                                                        ? [...formData.targetSpecializations, spec._id]
                                                        : formData.targetSpecializations.filter(v => v !== spec._id);
                                                    setFormData({ ...formData, targetSpecializations: next });
                                                }} />
                                            <span className="text-sm">{spec.arName}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                        <button type="submit" disabled={saving}
                            className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition flex items-center gap-2 text-sm disabled:opacity-60">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editingSummary ? "حفظ التعديلات" : "إضافة الملخص"}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                            className="bg-gray-100 text-gray-600 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition text-sm">
                            إلغاء
                        </button>
                    </div>
                </form>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="بحث في الملخصات..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A]" />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    لا توجد ملخصات. قم بإضافة ملخص جديد.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-semibold">
                            <tr>
                                <th className="p-4">الترتيب</th>
                                <th className="p-4">العنوان</th>
                                <th className="p-4">الفئة</th>
                                <th className="p-4">النوع</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">المشاهدات</th>
                                <th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const catName = typeof s.categoryId === 'object' ? s.categoryId?.arName : '—';
                                return (
                                    <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-500 font-mono">{s.order}</td>
                                        <td className="p-4 font-bold text-[#061B3D] max-w-[200px]">
                                            <div className="truncate">{s.title}</div>
                                            {s.description && <div className="text-xs text-gray-400 truncate font-normal">{s.description}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-[#D4AF37]/10 text-[#b8922a] text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {catName || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {s.fileType === 'pdf'
                                                ? <span className="flex items-center gap-1 text-blue-700 text-xs font-semibold"><FileText className="w-3.5 h-3.5" /> PDF</span>
                                                : <span className="flex items-center gap-1 text-purple-700 text-xs font-semibold"><FileImage className="w-3.5 h-3.5" /> صورة</span>
                                            }
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={s.status}
                                                onChange={e => handleStatusChange(s._id, e.target.value)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer ${STATUS_CONFIG[s.status].color}`}
                                            >
                                                <option value="draft">مسودة</option>
                                                <option value="published">منشور</option>
                                                <option value="hidden">مخفي</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-gray-500">{s.views}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(s)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(s._id)}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
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
        </div>
    );
}

// ─── Sub-tab: Categories Manager ──────────────────────────────────────────────
function CategoriesTab() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: "", arName: "", order: 0 });
    const [saving, setSaving] = useState(false);

    const PRESET_CATEGORIES = [
        { name: "nursing-fundamentals", arName: "أساسيات التمريض" },
        { name: "adult-nursing", arName: "تمريض البالغين" },
        { name: "maternal-child", arName: "تمريض الأمومة والطفل" },
        { name: "management-leadership", arName: "الإدارة والقيادة" },
        { name: "pharmacology", arName: "الصيدلة والأدوية" },
        { name: "medical-surgical", arName: "طبي - جراحي" },
        { name: "community-nursing", arName: "تمريض المجتمع" },
        { name: "psychiatric-nursing", arName: "التمريض النفسي" },
    ];

    const fetch_ = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/summary-categories");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetch_(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch("/api/admin/summary-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) { setShowForm(false); setFormData({ name: "", arName: "", order: 0 }); fetch_(); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("حذف الفئة؟")) return;
        await fetch("/api/admin/summary-categories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetch_();
    };

    const addPreset = async (preset: { name: string; arName: string }) => {
        await fetch("/api/admin/summary-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...preset, order: 0 }),
        });
        fetch_();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="text-lg font-bold text-[#061B3D] flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#D4AF37]" /> إدارة فئات الملخصات
                </h3>
                <button onClick={() => setShowForm(!showForm)}
                    className="bg-[#061B3D] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-[#1E3A8A] transition flex items-center gap-2 text-sm">
                    {showForm ? <><X className="w-4 h-4" /> إلغاء</> : <><Plus className="w-4 h-4" /> فئة جديدة</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الاسم بالعربية *</label>
                            <input required type="text" value={formData.arName}
                                onChange={e => setFormData({ ...formData, arName: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الاسم بالإنجليزية *</label>
                            <input required type="text" value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الترتيب</label>
                            <input type="number" min="0" value={formData.order}
                                onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                    </div>
                    <button type="submit" disabled={saving}
                        className="mt-4 bg-green-600 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} إضافة
                    </button>
                </form>
            )}

            {/* Preset Categories */}
            <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 mb-3">إضافة فئات التمريض القياسية بنقرة واحدة:</p>
                <div className="flex flex-wrap gap-2">
                    {PRESET_CATEGORIES.map(p => {
                        const exists = categories.some(c => c.name === p.name);
                        return (
                            <button key={p.name} onClick={() => !exists && addPreset(p)} disabled={exists}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${exists ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-[#D4AF37]/10 text-[#b8922a] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30'}`}>
                                {exists ? '✓ ' : '+ '}{p.arName}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
            ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">لا توجد فئات.</div>
            ) : (
                <div className="space-y-2">
                    {categories.map(cat => (
                        <div key={cat._id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3 hover:border-gray-200 transition">
                            <div>
                                <span className="font-bold text-[#061B3D]">{cat.arName}</span>
                                <span className="text-gray-400 text-xs mr-3 font-mono">{cat.name}</span>
                            </div>
                            <button onClick={() => handleDelete(cat._id)}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Sub-tab: Access Codes Manager ───────────────────────────────────────────
function AccessCodesTab() {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState<AccessCode | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        label: "",
        active: true,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxUses: 0,
    });
    const [saving, setSaving] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const fetchCodes = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/summary-codes");
        const data = await res.json();
        setCodes(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchCodes(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const url = editingCode ? `/api/admin/summary-codes/${editingCode._id}` : "/api/admin/summary-codes";
        const method = editingCode ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            setShowForm(false);
            setEditingCode(null);
            setFormData({ code: "", label: "", active: true, validFrom: new Date().toISOString().split('T')[0], validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], maxUses: 0 });
            fetchCodes();
        } else {
            const d = await res.json();
            alert(d.message || "حدث خطأ");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("حذف الكود؟")) return;
        await fetch(`/api/admin/summary-codes/${id}`, { method: "DELETE" });
        fetchCodes();
    };

    const toggleActive = async (code: AccessCode) => {
        await fetch(`/api/admin/summary-codes/${code._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !code.active }),
        });
        fetchCodes();
    };

    const openEdit = (code: AccessCode) => {
        setEditingCode(code);
        setFormData({
            code: "",
            label: code.label,
            active: code.active,
            validFrom: code.validFrom.split('T')[0],
            validUntil: code.validUntil.split('T')[0],
            maxUses: code.maxUses,
        });
        setShowForm(true);
    };

    const isExpired = (until: string) => new Date(until) < new Date();
    const isValid = (code: AccessCode) => code.active && !isExpired(code.validUntil) && new Date(code.validFrom) <= new Date();

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="text-lg font-bold text-[#061B3D] flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#D4AF37]" /> أكواد الدخول
                </h3>
                <button onClick={() => { setEditingCode(null); setShowForm(!showForm); }}
                    className="bg-[#061B3D] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-[#1E3A8A] transition flex items-center gap-2 text-sm">
                    {showForm ? <><X className="w-4 h-4" /> إلغاء</> : <><Plus className="w-4 h-4" /> كود جديد</>}
                </button>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-amber-800 text-sm">الأكواد محمية ومشفرة</p>
                    <p className="text-amber-700 text-xs mt-0.5">يتم تخزين الأكواد بشكل مشفر (Bcrypt Hashing). لا يمكن استرجاع الكود الأصلي بعد الحفظ. اكتبه وتذكره قبل الحفظ.</p>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <h4 className="font-bold text-[#061B3D] mb-4 text-sm">
                        {editingCode ? "تعديل الكود" : "كود دخول جديد"}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">
                                {editingCode ? "كود جديد (اتركه فارغاً لعدم التغيير)" : "كود الدخول *"}
                            </label>
                            <div className="relative">
                                <input
                                    type={showCode ? "text" : "password"}
                                    required={!editingCode}
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder={editingCode ? "اتركه فارغاً للإبقاء على الكود الحالي" : "SCFHS2026"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm font-mono tracking-widest"
                                />
                                <button type="button" onClick={() => setShowCode(!showCode)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">اسم/وصف الكود *</label>
                            <input required type="text" value={formData.label}
                                onChange={e => setFormData({ ...formData, label: e.target.value })}
                                placeholder="مثال: كود دورة 2026"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">تاريخ البداية *</label>
                            <input required type="date" value={formData.validFrom}
                                onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">تاريخ الانتهاء *</label>
                            <input required type="date" value={formData.validUntil}
                                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">الحد الأقصى للاستخدام (0 = غير محدود)</label>
                            <input type="number" min="0" value={formData.maxUses}
                                onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] text-sm" />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-5 h-5 accent-[#1E3A8A]" />
                                <span className="font-semibold text-sm">الكود فعال</span>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button type="submit" disabled={saving}
                            className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editingCode ? "حفظ التعديلات" : "إنشاء الكود"}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setEditingCode(null); }}
                            className="bg-gray-100 text-gray-600 font-bold px-6 py-2 rounded-xl text-sm">
                            إلغاء
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
            ) : codes.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">لا توجد أكواد دخول. قم بإنشاء كود جديد.</div>
            ) : (
                <div className="space-y-3">
                    {codes.map(code => {
                        const valid = isValid(code);
                        const expired = isExpired(code.validUntil);
                        return (
                            <div key={code._id}
                                className={`bg-white rounded-2xl border p-5 transition ${valid ? 'border-green-200' : 'border-gray-200'}`}>
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                            <span className="font-bold text-[#061B3D]">{code.label}</span>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${valid ? 'bg-green-100 text-green-700' : expired ? 'bg-red-100 text-red-600' : !code.active ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {valid ? '✓ فعال' : expired ? '× منتهي' : !code.active ? '× معطل' : 'غير متاح بعد'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> من: {new Date(code.validFrom).toLocaleDateString('ar-EG')}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> إلى: {new Date(code.validUntil).toLocaleDateString('ar-EG')}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />
                                                {code.currentUses} / {code.maxUses === 0 ? '∞' : code.maxUses} استخدام
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleActive(code)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${code.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                            {code.active ? 'تعطيل' : 'تفعيل'}
                                        </button>
                                        <button onClick={() => openEdit(code)}
                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(code._id)}
                                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Sub-tab: Statistics ──────────────────────────────────────────────────────
function StatsTab() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/summary-stats")
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>;
    if (!stats) return <div className="text-center py-8 text-red-500">تعذر تحميل الإحصائيات</div>;

    return (
        <div>
            <h3 className="text-lg font-bold text-[#061B3D] mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#D4AF37]" /> إحصائيات الملخصات
            </h3>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                    { label: "إجمالي الملخصات", value: stats.totalSummaries, color: "bg-blue-50 text-blue-700" },
                    { label: "منشور", value: stats.published, color: "bg-green-50 text-green-700" },
                    { label: "مخفي", value: stats.hidden, color: "bg-red-50 text-red-600" },
                    { label: "مسودة", value: stats.draft, color: "bg-gray-50 text-gray-600" },
                    { label: "إجمالي المشاهدات", value: stats.totalViews, color: "bg-purple-50 text-purple-700" },
                    { label: "مستخدمون فريدون", value: stats.uniqueUsers, color: "bg-amber-50 text-amber-700" },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-2xl p-4 text-center`}>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs font-semibold mt-1 opacity-80">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Most Viewed */}
            {stats.mostViewed && (
                <div className="mb-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-[#b8922a] mb-1">الأكثر مشاهدة</p>
                    <p className="font-bold text-[#061B3D]">{stats.mostViewed.title}</p>
                    <p className="text-sm text-gray-500">{stats.mostViewed.views} مشاهدة</p>
                </div>
            )}

            {/* Recent Logs */}
            <div>
                <h4 className="font-bold text-[#061B3D] mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> آخر الزيارات
                </h4>
                {stats.recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                        لا توجد سجلات زيارت بعد.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 font-semibold text-gray-500">
                                <tr>
                                    <th className="p-3">المستخدم</th>
                                    <th className="p-3">الملخص</th>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3">العملية</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentLogs.map((log: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="p-3">
                                            {log.userId
                                                ? <span className="font-semibold text-[#061B3D]">{log.userId.fullName}</span>
                                                : <span className="text-gray-400">زائر</span>
                                            }
                                        </td>
                                        <td className="p-3 text-gray-600 max-w-[150px] truncate">{log.summaryId?.title || '—'}</td>
                                        <td className="p-3 text-gray-400 text-xs">
                                            {new Date(log.accessedAt).toLocaleString('ar-EG')}
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.action === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                                {log.action === 'open' ? 'فتح' : 'عرض'}
                                            </span>
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

// ─── Main SummariesManager ────────────────────────────────────────────────────
export default function SummariesManager() {
    const [activeSubTab, setActiveSubTab] = useState<"summaries" | "categories" | "codes" | "stats">("summaries");

    const subTabs = [
        { id: "summaries", label: "الملخصات", icon: BookOpen },
        { id: "categories", label: "الفئات", icon: Tag },
        { id: "codes", label: "أكواد الدخول", icon: Key },
        { id: "stats", label: "الإحصائيات", icon: BarChart3 },
    ] as const;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#f0cc6a] rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-[#061B3D]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#061B3D]">إدارة الملخصات</h2>
                    <p className="text-gray-500 text-sm">Summaries Management System</p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeSubTab === tab.id
                            ? 'bg-[#061B3D] text-white shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeSubTab === "summaries" && <SummariesTab />}
            {activeSubTab === "categories" && <CategoriesTab />}
            {activeSubTab === "codes" && <AccessCodesTab />}
            {activeSubTab === "stats" && <StatsTab />}
        </div>
    );
}
