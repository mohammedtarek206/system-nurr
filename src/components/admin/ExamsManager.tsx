"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle, FileText, X } from "lucide-react";

export default function ExamsManager() {
  const [exams, setExams] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null); // For questions modal

  // Assignment State
  const [assignExamModal, setAssignExamModal] = useState<any>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionData, setQuestionData] = useState({
    text: "",
    clinicalCase: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
    explanation: ""
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    duration: 60,
    passingScore: 50,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allowRetake: true,
    maxAttempts: 0,
    randomizeQuestions: false,
    randomizeAnswers: false,
    targetType: 'all',
    targetSpecializations: [] as string[]
  });

  const fetchData = async () => {
    const [examsRes, catRes, specRes] = await Promise.all([
      fetch("/api/admin/exams"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/specializations")
    ]);
    const examsData = await examsRes.json();
    const catData = await catRes.json();
    const specData = await specRes.json();
    setExams(examsData);
    setCategories(catData);
    setSpecializations(Array.isArray(specData) ? specData : []);
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
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchData();
      setFormData({ title: "", category: categories[0]?.name || "", duration: 60, passingScore: 50, startDate: "", startTime: "", endDate: "", endTime: "", allowRetake: true, maxAttempts: 0, randomizeQuestions: false, randomizeAnswers: false, targetType: 'all', targetSpecializations: [] });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الامتحان؟")) return;
    const res = await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    }
  };

  const openQuestionsModal = async (exam: any) => {
    setSelectedExam(exam);
    setEditingQuestionId(null);
    setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
    setLoadingQuestions(true);
    const res = await fetch(`/api/admin/exams/${exam._id}/questions`);
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data : []);
    setLoadingQuestions(false);
  };

  const openAssignModal = async (exam: any) => {
    setAssignExamModal(exam);
    setIsPublic(exam.isPublic !== false); // Default to true if undefined
    setSelectedStudents(exam.assignedStudents || []);

    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudentsList(data);
  };

  const handleSaveAssignment = async () => {
    setLoadingAssignment(true);
    const res = await fetch(`/api/admin/exams/${assignExamModal._id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic, assignedStudents: selectedStudents }),
    });
    if (res.ok) {
      setAssignExamModal(null);
      fetchData();
    }
    setLoadingAssignment(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          إدارة الامتحانات
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white font-bold px-4 py-2 rounded-xl hover:bg-primary-dark transition flex items-center gap-2"
        >
          {showForm ? "إلغاء" : <><Plus className="w-4 h-4" /> إضافة امتحان جديد</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-primary-dark">بيانات الامتحان الجديد</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">اسم الامتحان</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">القسم</label>
              <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary">
                <option value="" disabled>اختر القسم...</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.arName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">مدة الامتحان (بالدقائق)</label>
              <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">نسبة النجاح (%)</label>
              <input required type="number" min="1" max="100" value={formData.passingScore} onChange={e => setFormData({ ...formData, passingScore: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">تاريخ بداية الصلاحية (Start Date)</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">وقت البداية (Start Time)</label>
              <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary bg-white" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">تاريخ نهاية الصلاحية (End Date)</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">وقت النهاية (End Time)</label>
              <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary bg-white" />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الجمهور المستهدف</label>
                <select value={formData.targetType} onChange={e => setFormData({ ...formData, targetType: e.target.value as any })} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary mb-2">
                  <option value="all">الجميع</option>
                  <option value="specific">تخصصات محددة</option>
                </select>

                {formData.targetType === 'specific' && (
                  <div className="flex flex-col gap-2 bg-white p-3 border rounded-lg max-h-48 overflow-y-auto">
                    {specializations.map((spec) => (
                      <label key={spec._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-primary w-4 h-4"
                          checked={formData.targetSpecializations.includes(spec._id)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...formData.targetSpecializations, spec._id]
                              : formData.targetSpecializations.filter(t => t !== spec._id);
                            setFormData({ ...formData, targetSpecializations: newTypes });
                          }}
                        />
                        <span className="text-sm">{spec.arName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-white p-3 border rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.randomizeQuestions} onChange={e => setFormData({ ...formData, randomizeQuestions: e.target.checked })} className="accent-primary" />
                  <span className="text-sm font-semibold">عشوائية ترتيب الأسئلة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.randomizeAnswers} onChange={e => setFormData({ ...formData, randomizeAnswers: e.target.checked })} className="accent-primary" />
                  <span className="text-sm font-semibold">عشوائية ترتيب الإجابات</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border-t pt-2 mt-2">
                  <input type="checkbox" checked={formData.allowRetake} onChange={e => setFormData({ ...formData, allowRetake: e.target.checked })} className="accent-primary" />
                  <span className="text-sm font-semibold">السماح بالإعادة</span>
                </label>
                {formData.allowRetake && (
                  <div className="pl-6">
                    <label className="block text-xs font-semibold mb-1 text-gray-500">الحد الأقصى للمحاولات (0 = مفتوح)</label>
                    <input type="number" min="0" value={formData.maxAttempts} onChange={e => setFormData({ ...formData, maxAttempts: Number(e.target.value) })} className="w-full px-2 py-1 rounded border text-sm outline-none focus:border-primary" />
                  </div>
                )}
              </div>
            </div>

          </div>
          <button type="submit" className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition">
            حفظ الامتحان
          </button>
        </form>
      )}

      {/* Questions Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary-dark">إضافة أسئلة: {selectedExam.title}</h2>
              <button onClick={() => setSelectedExam(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-primary">
                  {editingQuestionId ? "تعديل السؤال" : "سؤال جديد"}
                </h3>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionId(null);
                      setQuestionData({ text: "", clinicalCase: "", options: ["", "", "", ""], correctAnswer: 0, points: 1, explanation: "" });
                    }}
                    className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg hover:bg-gray-300"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">الحالة السريرية / السيناريو (Clinical Case) - اختياري</label>
                <textarea rows={2} value={questionData.clinicalCase} onChange={e => setQuestionData({ ...questionData, clinicalCase: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary resize-none" placeholder="مثال: A 45-year-old male patient presented with..." />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">نص السؤال *</label>
                <textarea required rows={3} value={questionData.text} onChange={e => setQuestionData({ ...questionData, text: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary resize-none" />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {questionData.options.map((opt, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold mb-2">الخيار {i + 1} *</label>
                    <input required type="text" value={opt} onChange={e => {
                      const newOptions = [...questionData.options];
                      newOptions[i] = e.target.value;
                      setQuestionData({ ...questionData, options: newOptions });
                    }} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">الإجابة الصحيحة *</label>
                  <select value={questionData.correctAnswer} onChange={e => setQuestionData({ ...questionData, correctAnswer: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary">
                    <option value={0}>الخيار الأول (A)</option>
                    <option value={1}>الخيار الثاني (B)</option>
                    <option value={2}>الخيار الثالث (C)</option>
                    <option value={3}>الخيار الرابع (D)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">درجة السؤال (Points) *</label>
                  <input required type="number" step="0.5" min="0.1" value={questionData.points} onChange={e => setQuestionData({ ...questionData, points: Number(e.target.value) })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary font-bold text-primary" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">الشرح والتعليل (Explanation) - اختياري</label>
                  <input type="text" value={questionData.explanation} onChange={e => setQuestionData({ ...questionData, explanation: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" placeholder="سبب الإجابة الصحيحة..." />
                </div>
              </div>

              <button type="submit" className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> {editingQuestionId ? "حفظ التعديل" : "إضافة السؤال"}
              </button>
            </form>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-700">
                  الأسئلة المضافة ({questions.length})
                </h3>
                <div className="bg-gold/10 border border-gold/30 text-gold-dark font-black px-4 py-1.5 rounded-xl text-sm">
                  مجموع درجات الامتحان: {questions.reduce((acc, q) => acc + (Number(q.points) || 1), 0)} درجة
                </div>
              </div>

              {loadingQuestions ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl">لا توجد أسئلة مضافة بعد.</div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={q._id || i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-primary-dark text-base">
                          {i + 1}. {q.text}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-xs">
                            {q.points || 1} {q.points === 1 ? 'درجة' : 'درجات'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingQuestionId(q._id);
                              setQuestionData({
                                text: q.text || "",
                                clinicalCase: q.clinicalCase || "",
                                options: q.options || ["", "", "", ""],
                                correctAnswer: q.correctAnswer || 0,
                                points: q.points || 1,
                                explanation: q.explanation || ""
                              });
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
                              const res = await fetch(`/api/admin/exams/${selectedExam._id}/questions/${q._id}`, { method: "DELETE" });
                              if (res.ok) {
                                setQuestions(questions.filter(item => item._id !== q._id));
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {q.clinicalCase && (
                        <p className="text-xs text-gray-600 mb-3 bg-white p-2 rounded border border-gray-100 font-mono">
                          <span className="font-bold">Case:</span> {q.clinicalCase}
                        </p>
                      )}

                      <ul className="grid grid-cols-2 gap-2 text-sm">
                        {q.options.map((opt: string, idx: number) => (
                          <li key={idx} className={`p-2 rounded-lg ${idx === q.correctAnswer ? 'bg-green-100 text-green-800 font-bold border border-green-200' : 'bg-white border border-gray-100'}`}>
                            {String.fromCharCode(65 + idx)}. {opt}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && (
                        <p className="text-xs text-blue-700 mt-2 font-semibold">💡 شرح الإجابة: {q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end border-t pt-6">
              <button onClick={() => setSelectedExam(null)} className="bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition shadow-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> حفظ جميع الأسئلة وإنهاء
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Assignment Modal */}
      {
        assignExamModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-primary-dark">إتاحة الامتحان: {assignExamModal.title}</h2>
                <button onClick={() => setAssignExamModal(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-6 h-6 accent-primary cursor-pointer"
                    />
                    <span className="font-bold text-lg text-primary-dark">متاح لجميع الطلاب بالمنصة (عام)</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-3 pr-10 font-semibold leading-relaxed">
                    إذا تم تفعيل هذا الخيار، سيظهر الامتحان في قائمة الامتحانات لجميع الطلاب. أما إذا قمت بإلغائه، ستتمكن من تحديد طلاب معينين فقط ليكون الامتحان خاصاً بهم.
                  </p>
                </div>

                {!isPublic && (
                  <div>
                    <h3 className="font-bold mb-4 text-primary-dark text-lg">الطلاب المسموح لهم بأداء الامتحان:</h3>
                    <div className="space-y-3 border border-gray-200 rounded-xl p-4 max-h-72 overflow-y-auto bg-gray-50">
                      {studentsList.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">لا يوجد طلاب مسجلين بالمنصة حالياً.</p>
                      ) : (
                        studentsList.map(student => (
                          <label key={student._id} className={`flex items-center gap-4 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all ${selectedStudents.includes(student._id) ? 'border-primary shadow-sm bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, student._id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                                }
                              }}
                              className="w-5 h-5 accent-primary"
                            />
                            <div>
                              <div className="font-bold text-primary-dark text-base">{student.fullName}</div>
                              <div className="text-xs text-gray-500 font-semibold">{student.email}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                <button
                  onClick={handleSaveAssignment}
                  disabled={loadingAssignment}
                  className="bg-green-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-green-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" /> {loadingAssignment ? 'جاري الحفظ...' : 'حفظ الإعدادات والتطبيق'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        loading ? (
          <div className="text-center py-8 text-gray-500">جاري تحميل الامتحانات...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            لا توجد امتحانات حتى الآن. قم بإضافة امتحان جديد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4 rounded-tr-xl">اسم الامتحان</th>
                  <th className="p-4">القسم</th>
                  <th className="p-4">المدة</th>
                  <th className="p-4">نسبة النجاح</th>
                  <th className="p-4 rounded-tl-xl text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-bold text-primary-dark">{exam.title}</td>
                    <td className="p-4 text-gray-600">{exam.category}</td>
                    <td className="p-4 text-gray-600">{exam.duration} دقيقة</td>
                    <td className="p-4 text-gray-600">{exam.passingScore}%</td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => openQuestionsModal(exam)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center gap-1">
                        <Plus className="w-4 h-4" /> أسئلة
                      </button>
                      <button onClick={() => openAssignModal(exam)} className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-100 transition flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> إتاحة لطلاب
                      </button>
                      <button onClick={() => handleDelete(exam._id)} className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div >
  );
}
