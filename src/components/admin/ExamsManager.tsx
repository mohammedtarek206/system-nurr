"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle, FileText, X, Copy, Eye, EyeOff, Search, Sparkles, HelpCircle, Layers } from "lucide-react";
import { parseDateTime } from "@/lib/dateUtils";

interface ExamsManagerProps {
  defaultExamType?: 'REGULAR' | 'NIGHT_EXAM' | 'NCLEX';
  titleOverride?: string;
}

export default function ExamsManager({ defaultExamType, titleOverride }: ExamsManagerProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering State
  const [activeTab, setActiveTab] = useState<string>(defaultExamType || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Questions Modal State
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionData, setQuestionData] = useState({
    text: "",
    clinicalCase: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
    explanation: ""
  });

  // Assign Modal State
  const [assignExamModal, setAssignExamModal] = useState<any>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const initialForm = {
    title: "",
    description: "",
    thumbnail: "",
    examType: defaultExamType || "REGULAR",
    category: "General",
    duration: 60,
    passingPercentage: 50,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allowRetake: false,
    maxAttempts: 1,
    randomizeQuestions: true,
    randomizeAnswers: true,
    targetType: 'all',
    targetSpecializations: [] as string[],
    status: 'published'
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, catRes, specRes] = await Promise.all([
        fetch(`/api/admin/exams?examType=${activeTab}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`),
        fetch("/api/admin/categories"),
        fetch("/api/admin/specializations")
      ]);
      const examsData = await examsRes.json();
      const catData = await catRes.json();
      const specData = await specRes.json();
      setExams(Array.isArray(examsData) ? examsData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setSpecializations(Array.isArray(specData) ? specData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAddForm = () => {
    setEditingExamId(null);
    setFormData({
      ...initialForm,
      examType: activeTab !== 'all' ? (activeTab as any) : (defaultExamType || 'REGULAR')
    });
    setFormError("");
    setShowForm(true);
  };

  const handleOpenEditForm = (exam: any) => {
    setEditingExamId(exam._id);
    setFormData({
      title: exam.title || "",
      description: exam.description || "",
      thumbnail: exam.thumbnail || "",
      examType: exam.examType || "REGULAR",
      category: exam.category || "General",
      duration: exam.duration || 60,
      passingPercentage: exam.passingPercentage || exam.passingScore || 50,
      startDate: exam.startDate || "",
      startTime: exam.startTime || "",
      endDate: exam.endDate || "",
      endTime: exam.endTime || "",
      allowRetake: !!exam.allowRetake,
      maxAttempts: exam.maxAttempts || 1,
      randomizeQuestions: !!exam.randomizeQuestions,
      randomizeAnswers: !!exam.randomizeAnswers,
      targetType: exam.targetType || 'all',
      targetSpecializations: exam.targetSpecializations || [],
      status: exam.status || 'published'
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("اسم الامتحان مطلوب");
      return;
    }
    if (formData.duration <= 0) {
      setFormError("مدة الامتحان يجب أن تكون أكبر من 0");
      return;
    }

    // Validate Start & End Dates
    if (formData.startDate && formData.endDate) {
      const startDT = parseDateTime(formData.startDate, formData.startTime || '00:00');
      const endDT = parseDateTime(formData.endDate, formData.endTime || '23:59');
      if (startDT && endDT && endDT < startDT) {
        setFormError("تاريخ نهاية الامتحان يجب أن يكون بعد تاريخ البداية.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = editingExamId ? `/api/admin/exams/${editingExamId}` : "/api/admin/exams";
      const method = editingExamId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "حدث خطأ أثناء حفظ البيانات");
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setFormError("خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الامتحان وكافة أسئلته نهائياً؟")) return;
    try {
      const res = await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExams(exams.filter(e => e._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateExam = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.message || "فشل تكرار الامتحان");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (exam: any) => {
    const newStatus = exam.status === 'published' ? 'hidden' : 'published';
    try {
      const res = await fetch(`/api/admin/exams/${exam._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setExams(exams.map(e => e._id === exam._id ? { ...e, status: newStatus } : e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Questions Modal Handlers
  const openQuestionsModal = async (exam: any) => {
    setSelectedExam(exam);
    setEditingQuestionId(null);
    setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/exams/${exam._id}/questions`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionData.text.trim()) return;

    if (editingQuestionId) {
      const res = await fetch(`/api/admin/exams/${selectedExam._id}/questions/${editingQuestionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(questions.map(q => q._id === editingQuestionId ? data.question : q));
        setEditingQuestionId(null);
        setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
        fetchData();
      }
    } else {
      const res = await fetch(`/api/admin/exams/${selectedExam._id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, data.question]);
        setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
        fetchData();
      }
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("هل أنت متأكد من حذف السؤال؟")) return;
    const res = await fetch(`/api/admin/exams/${selectedExam._id}/questions/${qId}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions(questions.filter(q => q._id !== qId));
      fetchData();
    }
  };

  const handleEditQuestionClick = (q: any) => {
    setEditingQuestionId(q._id);
    setQuestionData({
      text: q.text || "",
      clinicalCase: q.clinicalCase || "",
      options: q.options || ["", "", "", ""],
      correctAnswer: q.correctAnswer ?? 0,
      points: q.points || 1,
      explanation: q.explanation || ""
    });
  };

  const totalExamPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 1), 0);

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#1E3A8A]" />
            {titleOverride || "إدارة نظام الامتحانات"}
          </h2>
          <p className="text-gray-500 text-xs mt-1">إنشاء وتعديل وإدارة الامتحانات وتقسيمها حسب الأنواع والتخصصات</p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="bg-[#1E3A8A] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-900 transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> إضافة امتحان جديد
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Category Tabs */}
        {!defaultExamType && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "all" ? "bg-[#1E3A8A] text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              📊 جميع الامتحانات
            </button>
            <button
              onClick={() => setActiveTab("NIGHT_EXAM")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "NIGHT_EXAM" ? "bg-amber-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              🌙 ليلة الامتحان
            </button>
            <button
              onClick={() => setActiveTab("NCLEX")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "NCLEX" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              🩺 امتحانات NCLEX
            </button>
            <button
              onClick={() => setActiveTab("REGULAR")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "REGULAR" ? "bg-slate-700 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              📝 امتحانات عادية
            </button>
          </div>
        )}

        {/* Search and Status Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#1E3A8A] bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="published">منشور</option>
            <option value="hidden">مخفي</option>
            <option value="draft">مسودة</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث باسم الامتحان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-9 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute top-2.5 right-3" />
          </form>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-bold text-[#061B3D]">
                {editingExamId ? "تعديل امتحان" : "إضافة امتحان جديد"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم الامتحان *</label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: امتحان مادة التمريض الباطني"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نوع الامتحان *</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#1E3A8A] bg-white"
                  >
                    <option value="REGULAR">📝 امتحان عادي</option>
                    <option value="NIGHT_EXAM">🌙 ليلة الامتحان (Exam Night)</option>
                    <option value="NCLEX">🩺 امتحان NCLEX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">مدة الامتحان (بالدقائق) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نسبة النجاح (%) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passingPercentage}
                    onChange={(e) => setFormData({ ...formData, passingPercentage: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البداية (Start Date)</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">وقت البداية (Start Time)</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ النهاية (End Date)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">وقت النهاية (End Time)</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف مختصر للامتحان</label>
                <textarea
                  rows={2}
                  placeholder="اكتب وصفاً توضيحياً للامتحان يظهر للطالب..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Toggles & Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.randomizeQuestions}
                    onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E3A8A]"
                  />
                  عشوائية الأسئلة
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.randomizeAnswers}
                    onChange={(e) => setFormData({ ...formData, randomizeAnswers: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E3A8A]"
                  />
                  عشوائية الخيارات
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.allowRetake}
                    onChange={(e) => setFormData({ ...formData, allowRetake: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E3A8A]"
                  />
                  السماح بالإعادة
                </label>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="published">منشور (نشط)</option>
                    <option value="hidden">مخفي</option>
                    <option value="draft">مسودة</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs"
                >
                  {submitting ? "جاري الحفظ..." : editingExamId ? "تحديث الامتحان" : "حفظ الامتحان"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold">جاري تحميل قائمة الامتحانات...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center text-gray-400">لا توجد امتحانات مضافة في هذا القسم حتى الآن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="p-4">اسم الامتحان</th>
                  <th className="p-4">النوع</th>
                  <th className="p-4">الأسئلة والاطلاق</th>
                  <th className="p-4">المدة والدرجة</th>
                  <th className="p-4">التاريخ والوقت</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((exam) => {
                  const typeLabel = exam.examType === 'NIGHT_EXAM' ? '🌙 ليلة الامتحان' : exam.examType === 'NCLEX' ? '🩺 NCLEX' : '📝 عادي';
                  const isHidden = exam.status === 'hidden';

                  return (
                    <tr key={exam._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-[#061B3D]">
                        {exam.title}
                        {exam.description && <div className="text-xs font-normal text-gray-400 max-w-xs truncate">{exam.description}</div>}
                      </td>

                      <td className="p-4 font-medium">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${exam.examType === 'NIGHT_EXAM' ? 'bg-amber-100 text-amber-800' :
                            exam.examType === 'NCLEX' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {typeLabel}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-gray-700">
                        <span className="text-blue-700 font-bold">{exam.totalQuestions || 0} أسئلة</span>
                        <div className="text-xs text-gray-400">إجمالي {exam.totalPoints || 0} نقطة</div>
                      </td>

                      <td className="p-4 font-semibold text-gray-700">
                        <div>{exam.duration} دقيقة</div>
                        <div className="text-xs text-emerald-600">نجاح: {exam.passingPercentage || exam.passingScore || 50}%</div>
                      </td>

                      <td className="p-4 text-xs font-mono text-gray-500">
                        {exam.startDate ? `${exam.startDate} ${exam.startTime || ''}` : 'متاح دائماً'}
                        {exam.endDate && <div className="text-[10px] text-red-500">ينتهي: {exam.endDate}</div>}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            exam.status === 'hidden' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {exam.status === 'published' ? 'منشور' : exam.status === 'hidden' ? 'مخفي' : 'مسودة'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openQuestionsModal(exam)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="إدارة الأسئلة"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> الأسئلة ({exam.totalQuestions || 0})
                          </button>

                          <button
                            onClick={() => handleToggleStatus(exam)}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs transition"
                            title={isHidden ? "إظهار الامتحان" : "إخفاء الامتحان"}
                          >
                            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDuplicateExam(exam._id)}
                            className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs transition"
                            title="نسخ الامتحان"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditForm(exam)}
                            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs transition"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteExam(exam._id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs transition"
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
      </div>

      {/* Questions Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#061B3D]">إدارة أسئلة: {selectedExam.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">إجمالي النقاط: <span className="font-bold text-blue-700">{totalExamPoints}</span> نقطة | عدد الأسئلة: <span className="font-bold text-emerald-600">{questions.length}</span></p>
              </div>
              <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Add / Edit Form */}
            <form onSubmit={handleQuestionSubmit} className="bg-slate-50 p-6 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-sm text-[#061B3D]">
                {editingQuestionId ? "تعديل السؤال" : "إضافة سؤال جديد"}
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الحالة السريرية / السيناريو (اختياري Clinical Case)</label>
                <textarea
                  rows={2}
                  placeholder="مثال: Patient is a 45-year-old male with severe chest pain..."
                  value={questionData.clinicalCase}
                  onChange={(e) => setQuestionData({ ...questionData, clinicalCase: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نص السؤال *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="اكتب السؤال هنا..."
                  value={questionData.text}
                  onChange={(e) => setQuestionData({ ...questionData, text: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questionData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswerRadio"
                      checked={questionData.correctAnswer === idx}
                      onChange={() => setQuestionData({ ...questionData, correctAnswer: idx })}
                      className="w-4 h-4 text-[#1E3A8A]"
                      title="تحديد كإجابة صحيحة"
                    />
                    <input
                      required
                      type="text"
                      placeholder={`الخيار ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionData.options];
                        newOpts[idx] = e.target.value;
                        setQuestionData({ ...questionData, options: newOpts });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نقاط السؤال (Points)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={questionData.points}
                    onChange={(e) => setQuestionData({ ...questionData, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الشرح والتفسير (Explanation)</label>
                  <input
                    type="text"
                    placeholder="شرح الإجابة الصحيحة للطالب بعد انتهاء الامتحان..."
                    value={questionData.explanation}
                    onChange={(e) => setQuestionData({ ...questionData, explanation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionId(null);
                      setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs hover:bg-blue-900 transition"
                >
                  {editingQuestionId ? "تحديث السؤال" : "إضافة السؤال للامتحان"}
                </button>
              </div>
            </form>

            {/* Questions List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#061B3D]">الأسئلة الحالية ({questions.length})</h4>
              {loadingQuestions ? (
                <div className="text-center py-6 text-gray-400">جاري تحميل الأسئلة...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl border">لا توجد أسئلة مضافة حتى الآن.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {questions.map((q, qIndex) => (
                    <div key={q._id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-blue-700">السؤال #{qIndex + 1} ({q.points || 1} نقطة)</span>
                        {q.clinicalCase && <p className="text-xs italic text-gray-600 bg-gray-50 p-2 rounded-lg">{q.clinicalCase}</p>}
                        <p className="font-bold text-sm text-gray-900">{q.text}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options?.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className={`text-xs px-2.5 py-1 rounded-lg ${oIdx === q.correctAnswer ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-gray-100 text-gray-700'}`}>
                              {String.fromCharCode(65 + oIdx)}: {opt}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditQuestionClick(q)}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs"
                          title="تعديل السؤال"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs"
                          title="حذف السؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
