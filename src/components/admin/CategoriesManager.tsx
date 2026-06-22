"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Layers } from "lucide-react";

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", arName: "", icon: "📚" });

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchCategories();
      setFormData({ name: "", arName: "", icon: "📚" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("تأكيد الحذف؟ سيؤثر هذا على الكورسات والامتحانات المرتبطة بهذا القسم.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) fetchCategories();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          إدارة الأقسام (Categories)
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-dark">
          {showForm ? "إلغاء" : <><Plus className="w-4 h-4" /> إضافة قسم</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">الاسم البرمجي (انجليزي)</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Fundamentals" className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">الاسم الظاهر للطلاب (عربي)</label>
            <input required type="text" value={formData.arName} onChange={e => setFormData({...formData, arName: e.target.value})} placeholder="e.g. أساسيات التمريض" className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">رمز تعبيري (Icon/Emoji)</label>
            <input required type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary" />
          </div>
          <button type="submit" className="md:col-span-3 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
            حفظ القسم
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد أقسام مضافة بعد.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="border p-4 rounded-xl shadow-sm bg-white hover:border-primary/30 transition flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-bold text-primary-dark">{cat.arName}</h3>
                  <p className="text-xs text-gray-500">{cat.name}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(cat._id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
