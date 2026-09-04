"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Video, Edit, X, Check, Layers, Clock, Link2, ShieldCheck, Lock } from "lucide-react";

export default function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [lessons, setLessons] = useState<Record<string, any[]>>({});
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ title: "", description: "", image: "", requiredExamId: "", passingPercentage: 80, targetType: 'all', targetSpecializations: [] as string[] });
  const [lessonFormData, setLessonFormData] = useState({ title: "", description: "", duration: "", zoomLink: "", zoomDate: "", order: 0, targetType: 'all', targetSpecializations: [] as string[] });
  const [savingSection, setSavingSection] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [exams, setExams] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "", description: "", shortDescription: "", image: "",
    price: 0, isFree: false, duration: "", instructor: "",
    status: "active", order: 0, category: "",
    startDate: "", startTime: "", endDate: "", endTime: "",
    progressionEnabled: true,
    progressionMode: "FREE",
    finalExamId: "",
    finalPassingPercentage: 80,
    nextCourseId: "",
    unlockRule: "AFTER_SUBSCRIPTION",
    targetType: "all",
    targetSpecializations: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    const [crsRes, catRes, exmRes, specRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/exams"),
      fetch("/api/admin/specializations")
    ]);
    const crsData = await crsRes.json();
    const catData = await catRes.json();
    const exmData = await exmRes.json();
    const specData = await specRes.json();
    setCourses(Array.isArray(crsData) ? crsData : []);
    setCategories(Array.isArray(catData) ? catData : []);
    setExams(Array.isArray(exmData) ? exmData : []);
    setSpecializations(Array.isArray(specData) ? specData : []);
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
      setFormData({
        title: "", description: "", shortDescription: "", image: "", price: 0, isFree: false, duration: "", instructor: "", status: "active", order: 0, category: categories[0]?.name || "", startDate: "", startTime: "", endDate: "", endTime: "", progressionEnabled: true, progressionMode: "FREE", finalExamId: "", finalPassingPercentage: 80, nextCourseId: "", unlockRule: "AFTER_SUBSCRIPTION", targetType: 'all', targetSpecializations: []
      });
      fetchData();
    }
  };

  const handleEdit = (course: any) => {
    setEditCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription || "",
      image: course.image || "",
      price: course.price || 0,
      isFree: course.isFree || false,
      duration: course.duration || "",
      instructor: course.instructor || "",
      status: course.status || "active",
      order: course.order || 0,
      category: course.category || "",
      startDate: course.startDate || "",
      startTime: course.startTime || "",
      endDate: course.endDate || "",
      endTime: course.endTime || "",
      targetType: course.targetType || "all",
      targetSpecializations: course.targetSpecializations || [],
      progressionEnabled: course.progressionEnabled !== false,
      progressionMode: course.progressionMode || "FREE",
      finalExamId: course.finalExamId || "",
      finalPassingPercentage: course.finalPassingPercentage || 80,
      nextCourseId: course.nextCourseId || "",
      unlockRule: course.unlockRule || "AFTER_SUBSCRIPTION"
    });
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
      setSectionFormData({ title: "", description: "", image: "", requiredExamId: "", passingPercentage: 80, targetType: 'all', targetSpecializations: [] });
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
      setLessonFormData({ title: "", description: "", duration: "", zoomLink: "", zoomDate: "", order: 0, targetType: 'all', targetSpecializations: [] });
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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#1E3A8A]" /> إدارة بنية الكورسات والتسلسل التعليمي
        </h2>
        <button onClick={() => {
          setShowForm(!showForm); setEditCourse(null); setFormData({
            title: "", description: "", shortDescription: "", image: "", price: 0, isFree: false, duration: "", instructor: "", status: "active", order: 0, category: categories[0]?.name || "", startDate: "", startTime: "", endDate: "", endTime: "", progressionEnabled: true, progressionMode: "FREE", finalExamId: "", finalPassingPercentage: 80, nextCourseId: "", unlockRule: "AFTER_SUBSCRIPTION", targetType: 'all', targetSpecializations: []
          });
        }}
          className="bg-[#1E3A8A] text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#061B3D] transition">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "إلغاء" : "إضافة كورس"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-blue-50/40 p-6 rounded-xl border border-blue-100 grid md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-bold text-lg text-[#061B3D]">{editCourse ? "✏️ تعديل الكورس وإعدادات التتابع" : "➕ إضافة كورس جديد"}</h3>
          <div>
            <label className="block text-sm font-semibold mb-1">اسم الكورس *</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">القسم / التصنيف</label>
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

          {/* REQUIREMENT 11 & 21: Course Progression Rules Setup */}
          <div className="md:col-span-2 bg-gradient-to-r from-[#061B3D] to-[#1E3A8A] text-white p-5 rounded-2xl space-y-4">
            <h4 className="font-extrabold text-base flex items-center gap-2 text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" /> إعدادات تتابع وتقيد المحاضرات والامتحانات (Course Progression Rules)
            </h4>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">نظام تتابع المحاضرات (Progression Mode)</label>
                <select value={formData.progressionMode} onChange={e => setFormData({ ...formData, progressionMode: e.target.value })} className="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs outline-none">
                  <option value="FREE">حُر (FREE) - فتح جميع المحاضرات</option>
                  <option value="SEQUENTIAL">متسلسل (SEQUENTIAL) - محاضرة تلو الأخرى</option>
                  <option value="EXAM_REQUIRED">امتحان إجباري (EXAM_REQUIRED) - اجتياز الامتحان لفتح المحاضرة التالية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">الامتحان النهائي للكورس (Final Exam)</label>
                <select value={formData.finalExamId} onChange={e => setFormData({ ...formData, finalExamId: e.target.value })} className="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs outline-none">
                  <option value="">بدون امتحان نهائي</option>
                  {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">نسبة نجاح النهائي (%)</label>
                <input type="number" min="0" max="100" value={formData.finalPassingPercentage} onChange={e => setFormData({ ...formData, finalPassingPercentage: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs outline-none" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold mb-1">الكورس التالي عند الانتهاء (Next Course)</label>
                <select value={formData.nextCourseId} onChange={e => setFormData({ ...formData, nextCourseId: e.target.value })} className="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs outline-none">
                  <option value="">لا يوجد كورس تالي</option>
                  {courses.filter(c => c._id !== editCourse?._id).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">شرط فتح الكورس التالي (Unlock Rule)</label>
                <select value={formData.unlockRule} onChange={e => setFormData({ ...formData, unlockRule: e.target.value })} className="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs outline-none">
                  <option value="AFTER_SUBSCRIPTION">بمجرد الاشتراك (After Subscription)</option>
                  <option value="AFTER_COURSE_COMPLETION">بعد إكمال جميع المحاضرات (After Course Completion)</option>
                  <option value="AFTER_FINAL_EXAM">بعد أداء الامتحان النهائي (After Final Exam)</option>
                  <option value="AFTER_PASSING_PERCENTAGE">بعد اجتياز درجة النجاح المطلوبة (After Passing Percentage)</option>
                </select>
              </div>
            </div>
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
          <div>
            <label className="block text-sm font-semibold mb-1">تاريخ البداية</label>
            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A] bg-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">تاريخ النهاية</label>
            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#1E3A8A] bg-white" />
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
                      <span>نظام التتابع: <strong className="text-blue-800">{course.progressionMode || 'FREE'}</strong></span>
                      <span>{course.isFree ? "🟢 مجاني" : `💰 ${course.price} جنيه`}</span>
                      <span className={course.status === 'active' ? "text-green-600 font-bold" : "text-orange-500"}>
                        {course.status === 'active' ? '✅ نشط' : '📝 مسودة'}
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

              {/* Sections & Progression Tree Builder */}
              {expandedCourse === course._id && (
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#061B3D] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#D4AF37]" /> أقسام وسلسلة الكورس ({sections[course._id]?.length || 0})
                    </h4>
                    <button onClick={() => { setShowSectionForm(showSectionForm === course._id ? null : course._id); setSectionFormData({ title: "", description: "", image: "", requiredExamId: "", passingPercentage: 80, targetType: 'all', targetSpecializations: [] }); }}
                      className="text-sm bg-[#D4AF37]/10 text-[#B8860B] font-bold px-3 py-1.5 rounded-lg hover:bg-[#D4AF37]/20 transition flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> إضافة قسم جديد
                    </button>
                  </div>

                  {showSectionForm === course._id && (
                    <form onSubmit={(e) => handleAddSection(e, course._id)} className="mb-4 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">اسم القسم *</label>
                        <input required type="text" value={sectionFormData.title} onChange={e => setSectionFormData({ ...sectionFormData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">الامتحان المطلوب لفتح القسم</label>
                        <select value={sectionFormData.requiredExamId} onChange={e => setSectionFormData({ ...sectionFormData, requiredExamId: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#D4AF37]">
                          <option value="">بدون قفل (مفتوح مباشره)</option>
                          {exams.map(ex => (
                            <option key={ex._id} value={ex._id}>{ex.title}</option>
                          ))}
                        </select>
                      </div>
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
                        <div key={section._id} className="border border-gray-200 rounded-xl overflow-hidden p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#061B3D]">{section.title}</span>
                            <button onClick={() => handleDeleteSection(course._id, section._id)} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
