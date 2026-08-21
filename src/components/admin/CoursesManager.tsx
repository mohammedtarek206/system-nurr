"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Video, Edit, X, Check, Layers, Clock, Link2 } from "lucide-react";

export default function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [lessons, setLessons] = useState<Record<string, any[]>>({});
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ title: "", description: "", image: "", requiredExam: "", passingPercentage: 90, targetAudience: [] as string[] });
  const [lessonFormData, setLessonFormData] = useState({ title: "", description: "", duration: "", zoomLink: "", zoomDate: "", order: 0, targetAudience: [] as string[] });
  const [savingSection, setSavingSection] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [exams, setExams] = useState<any[]>([]); // To list exams in dropdown

  const [formData, setFormData] = useState({
    title: "", description: "", shortDescription: "", image: "",
    price: 0, isFree: false, duration: "", instructor: "",
    status: "active", order: 0, category: "",
    целевая_аудитория: [], progressionEnabled: false, targetAudience: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    const [crsRes, catRes, exmRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/exams")
    ]);
    const crsData = await crsRes.json();
    const catData = await catRes.json();
    const exmData = await exmRes.json();
    setCourses(Array.isArray(crsData) ? crsData : []);
    setCategories(Array.isArray(catData) ? catData : []);
    setExams(Array.isArray(exmData) ? exmData : []);
    if (catData.length > 0) setFormData(f => ({ ...f, category: f.category || catData[0].name }));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const loadSections = async (courseId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}/sections`);
    const data = await res.json();
    setSections(prev => ({ ...prev, [courseId]: Array.isArray(data) ? data : [] }));
  };

  const loadLessons = async (courseId: string, sectionId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`);
    const data = await res.json();
    setLessons(prev => ({ ...prev, [sectionId]: Array.isArray(data) ? data : [] }));
  };

  const toggleCourse = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    await loadSections(courseId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editCourse ? `/api/admin/courses/${editCourse._id}` : "/api/admin/courses";
    const method = editCourse ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) {
      setShowForm(false); setEditCourse(null);
      setFormData({ title: "", description: "", shortDescription: "", image: "", price: 0, isFree: false, duration: "", instructor: "", status: "active", order: 0, category: categories[0]?.name || "", целевая_аудитория: [], progressionEnabled: false, targetAudience: [] });
      fetchData();
    }
  };

  const handleEdit = (course: any) => {
    setEditCourse(course);
    setFormData({ title: course.title, description: course.description, shortDescription: course.shortDescription || "", image: course.image || "", price: course.price || 0, isFree: course.isFree || false, duration: course.duration || "", instructor: course.instructor || "", status: course.status || "active", order: course.order || 0, category: course.category || "", targetAudience: course.targetAudience || [], целевая_аудитория: [], progressionEnabled: course.progressionEnabled || false });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("تأكيد حذف الكورس وجميع أقسامه ومحاضراته؟")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleAddSection = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault(); setSavingSection(true);
    const res = await fetch(`/api/admin/courses/${courseId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionFormData)
    });
    if (res.ok) {
      setSectionFormData({ title: "", description: "", image: "", requiredExam: "", passingPercentage: 90, targetAudience: [] });
      setShowSectionForm(null);
      await loadSections(courseId);
    }
    setSavingSection(false);
  };

  const handleDeleteSection = async (courseId: string, sectionId: string) => {
    if (!confirm("حذف هذا القسم وجميع محاضراته؟")) return;
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, { method: "DELETE" });
    if (res.ok) await loadSections(courseId);
  };

  const handleAddLesson = async (e: React.FormEvent, courseId: string, sectionId: string) => {
    e.preventDefault(); setSavingLesson(true);
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lessonFormData)
    });
    if (res.ok) {
      setLessonFormData({ title: "", description: "", duration: "", zoomLink: "", zoomDate: "", order: 0, targetAudience: [] });
      setShowLessonForm(null);
      await loadLessons(courseId, sectionId);
    }
    setSavingLesson(false);
  };

  const handleDeleteLesson = async (courseId: string, sectionId: string, lessonId: string) => {
    if (!confirm("حذف هذه المحاضرة؟")) return;
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, { method: "DELETE" });
    if (res.ok) await loadLessons(courseId, sectionId);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#1E3A8A]" /> إدارة الكورسات
        </h2>
        <button onClick={() => { setShowForm(!showForm); setEditCourse(null); setFormData({ title: "", description: "", shortDescription: "", image: "", price: 0, isFree: false, duration: "", instructor: "", status: "active", order: 0, category: categories[0]?.name || "", целевая_аудитория: [], progressionEnabled: false, targetAudience: [] }); }}
          className="bg-[#1E3A8A] text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#061B3D] transition">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "إلغاء" : "إضافة كورس"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100 grid md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-bold text-lg text-[#061B3D]">{editCourse ? "✏️ تعديل الكورس" : "➕ إضافة كورس جديد"}</h3>
          <div>
            <label className="block text-sm font-semibold mb-1">اسم الكورس *</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">القسم</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]">
              <option value="">بدون قسم</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.arName}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">وصف مختصر</label>
            <input type="text" value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">الوصف الكامل *</label>
            <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">رابط صورة الغلاف</label>
            <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">اسم المدرب</label>
            <input type="text" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">المدة الزمنية</label>
            <input type="text" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="مثال: 3 أشهر" className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">الحالة</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]">
              <option value="active">نشط ✅</option>
              <option value="hidden">مخفي 🙈</option>
              <option value="draft">مسودة 📝</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({ ...formData, isFree: e.target.checked })} className="w-5 h-5 accent-green-600" />
              <span className="font-semibold">مجاني</span>
            </label>
            {!formData.isFree && (
              <div className="flex-1">
                <input type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="السعر (جنيه)" className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">الترتيب</label>
            <input type="number" min="0" value={formData.order} onChange={e => setFormData({ ...formData, order: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">الفئة المستهدفة (اتركه فارغاً ليتاح للجميع)</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'technician', label: 'فني / فني سعودي' },
                  { value: 'specialist', label: 'أخصائي / פني (الإمارات-قطر-عمان)' },
                  { value: 'midwifery', label: 'قبالة' }
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer bg-white p-2 border rounded-lg">
                    <input
                      type="checkbox"
                      className="accent-[#1E3A8A] w-4 h-4"
                      checked={formData.targetAudience.includes(opt.value)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...formData.targetAudience, opt.value]
                          : formData.targetAudience.filter(t => t !== opt.value);
                        setFormData({ ...formData, targetAudience: newTypes });
                      }}
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 shadow-sm rounded-xl p-4 bg-white border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.progressionEnabled} onChange={e => setFormData({ ...formData, progressionEnabled: e.target.checked })} className="w-5 h-5 accent-blue-600" />
                <span className="font-bold text-blue-900 border-b border-blue-100 pb-1 w-full">تفعيل نظام التقدم الخطي (قفل الأقسام)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">يجب على الطالب اجتياز الامتحان المحدد في كل قسم لفتح القسم الذي يليه.</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {editCourse ? "حفظ التعديلات" : "إضافة الكورس"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد كورسات مضافة.</div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course._id} className="border border-gray-200 rounded-2xl overflow-hidden">
              {/* Course Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50/30 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#061B3D]">{course.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{course.category || "بدون قسم"}</span>
                      <span>{course.isFree ? "🟢 مجاني" : `💰 ${course.price} جنيه`}</span>
                      <span className={course.status === 'active' ? "text-green-600" : "text-orange-500"}>
                        {course.status === 'active' ? '✅ نشط' : course.status === 'hidden' ? '🙈 مخفي' : '📝 مسودة'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(course)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(course._id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleCourse(course._id)} className="bg-[#1E3A8A]/10 text-[#1E3A8A] p-2 rounded-lg hover:bg-[#1E3A8A]/20 transition">
                    {expandedCourse === course._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sections */}
              {expandedCourse === course._id && (
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#061B3D] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#D4AF37]" /> الأقسام ({sections[course._id]?.length || 0})
                    </h4>
                    <button onClick={() => { setShowSectionForm(showSectionForm === course._id ? null : course._id); setSectionFormData({ title: "", description: "", image: "", requiredExam: "", passingPercentage: 90, targetAudience: [] }); }}
                      className="text-sm bg-[#D4AF37]/10 text-[#B8860B] font-bold px-3 py-1.5 rounded-lg hover:bg-[#D4AF37]/20 transition flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> إضافة قسم
                    </button>
                  </div>

                  {showSectionForm === course._id && (
                    <form onSubmit={(e) => handleAddSection(e, course._id)} className="mb-4 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">اسم القسم *</label>
                        <input required type="text" value={sectionFormData.title} onChange={e => setSectionFormData({ ...sectionFormData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">رابط صورة القسم</label>
                        <input type="text" value={sectionFormData.image} onChange={e => setSectionFormData({ ...sectionFormData, image: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold mb-1">وصف القسم</label>
                        <input type="text" value={sectionFormData.description} onChange={e => setSectionFormData({ ...sectionFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]" />
                      </div>

                      {course.progressionEnabled && (
                        <>
                          <div>
                            <label className="block text-xs font-bold mb-1">الامتحان المطلوب لفتح القسم</label>
                            <select value={sectionFormData.requiredExam} onChange={e => setSectionFormData({ ...sectionFormData, requiredExam: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]">
                              <option value="">بدون قفل (مفتوح مباشره)</option>
                              {exams.filter(ex => ex.courseId === course._id).map(ex => (
                                <option key={ex._id} value={ex._id}>{ex.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">نسبة النجاح اللازمة (٪)</label>
                            <input type="number" min="0" max="100" value={sectionFormData.passingPercentage} onChange={e => setSectionFormData({ ...sectionFormData, passingPercentage: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]" />
                          </div>
                        </>
                      )}

                      <button type="submit" disabled={savingSection} className="md:col-span-2 bg-[#D4AF37] text-[#061B3D] font-bold py-2 rounded-lg hover:bg-[#B8860B] transition text-sm flex items-center justify-center">
                        {savingSection ? "جاري الحفظ..." : "✅ حفظ القسم"}
                      </button>
                    </form>
                  )}

                  {!sections[course._id] ? (
                    <div className="text-center py-4 text-gray-400 text-sm">جاري التحميل...</div>
                  ) : sections[course._id].length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-sm">لا توجد أقسام. أضف قسماً جديداً.</div>
                  ) : (
                    <div className="space-y-3">
                      {sections[course._id].map((section) => (
                        <div key={section._id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                                <Layers className="w-3.5 h-3.5 text-[#B8860B]" />
                              </div>
                              <span className="font-semibold text-sm text-[#061B3D]">{section.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  await loadLessons(course._id, section._id);
                                  setShowLessonForm(showLessonForm === section._id ? null : section._id);
                                  setLessonFormData({ title: "", description: "", duration: "", zoomLink: "", zoomDate: "", order: 0, targetAudience: [] });
                                }}
                                className="text-xs bg-green-50 text-green-700 font-bold px-2 py-1 rounded-lg hover:bg-green-100 transition flex items-center gap-1">
                                <Video className="w-3 h-3" /> محاضرات
                              </button>
                              <button onClick={() => handleDeleteSection(course._id, section._id)} className="bg-red-50 text-red-500 p-1.5 rounded-lg hover:bg-red-100 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons */}
                          {showLessonForm === section._id && (
                            <div className="p-3 border-t border-gray-100">
                              <form onSubmit={(e) => handleAddLesson(e, course._id, section._id)} className="mb-3 bg-green-50/50 p-3 rounded-xl border border-green-100 grid md:grid-cols-2 gap-2">
                                <h5 className="md:col-span-2 text-xs font-bold text-green-800">➕ إضافة محاضرة جديدة</h5>
                                <div>
                                  <label className="block text-xs font-semibold mb-1">اسم المحاضرة *</label>
                                  <input required type="text" value={lessonFormData.title} onChange={e => setLessonFormData({ ...lessonFormData, title: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:border-green-500" />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1">المدة</label>
                                  <input type="text" value={lessonFormData.duration} onChange={e => setLessonFormData({ ...lessonFormData, duration: e.target.value })} placeholder="مثال: 90 دقيقة" className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:border-green-500" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold mb-1">رابط Zoom 🎥</label>
                                  <input type="text" value={lessonFormData.zoomLink} onChange={e => setLessonFormData({ ...lessonFormData, zoomLink: e.target.value })} placeholder="https://zoom.us/j/..." className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:border-green-500" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold mb-1">تاريخ المحاضرة</label>
                                  <input type="datetime-local" value={lessonFormData.zoomDate} onChange={e => setLessonFormData({ ...lessonFormData, zoomDate: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:border-green-500" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold mb-1">الوصف</label>
                                  <input type="text" value={lessonFormData.description} onChange={e => setLessonFormData({ ...lessonFormData, description: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none focus:border-green-500" />
                                </div>
                                <button type="submit" disabled={savingLesson} className="md:col-span-2 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition text-xs">
                                  {savingLesson ? "جاري الحفظ..." : "✅ حفظ المحاضرة"}
                                </button>
                              </form>

                              <h5 className="text-xs font-bold text-gray-600 mb-2">المحاضرات ({lessons[section._id]?.length || 0}):</h5>
                              {!lessons[section._id] ? (
                                <div className="text-xs text-gray-400 py-2">جاري التحميل...</div>
                              ) : lessons[section._id].length === 0 ? (
                                <div className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">لا توجد محاضرات بعد.</div>
                              ) : (
                                <div className="space-y-2">
                                  {lessons[section._id].map((lesson) => (
                                    <div key={lesson._id} className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-green-600" />
                                        <div>
                                          <p className="text-xs font-semibold text-[#061B3D]">{lesson.title}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            {lesson.duration && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{lesson.duration}</span>}
                                            {lesson.zoomLink && <span className="flex items-center gap-0.5 text-blue-500"><Link2 className="w-2.5 h-2.5" />Zoom</span>}
                                            {lesson.zoomDate && <span>{new Date(lesson.zoomDate).toLocaleDateString('ar-EG')}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <button onClick={() => handleDeleteLesson(course._id, section._id, lesson._id)} className="bg-red-50 text-red-500 p-1 rounded-lg hover:bg-red-100 transition">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
