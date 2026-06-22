"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";

export default function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });

  const fetchData = async () => {
    const [crsRes, catRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/categories")
    ]);
    const crsData = await crsRes.json();
    const catData = await catRes.json();
    setCourses(crsData);
    setCategories(catData);
    if (catData.length > 0) {
      setFormData(f => ({ ...f, category: f.category || catData[0].name }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchData();
      setFormData({ title: "", description: "", category: categories[0]?.name || "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          إدارة الكورسات
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-dark">
          {showForm ? "إلغاء" : <><Plus className="w-4 h-4" /> إضافة كورس</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">اسم الكورس</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">القسم</label>
            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary">
              <option value="" disabled>اختر القسم...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.arName}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">الوصف</label>
            <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary resize-none"></textarea>
          </div>
          <button type="submit" className="md:col-span-2 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
            حفظ الكورس
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد كورسات مضافة.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course._id} className="border p-4 rounded-xl shadow-sm flex justify-between items-start">
              <div>
                <h3 className="font-bold text-primary-dark">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{course.category}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              </div>
              <button onClick={() => handleDelete(course._id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
