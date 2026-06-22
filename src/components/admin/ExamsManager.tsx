"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle, FileText, X } from "lucide-react";

export default function ExamsManager() {
  const [exams, setExams] = useState<any[]>([]);
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
  const [questionData, setQuestionData] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    duration: 60,
    passingScore: 50,
  });

  const fetchData = async () => {
    const [examsRes, catRes] = await Promise.all([
      fetch("/api/admin/exams"),
      fetch("/api/admin/categories")
    ]);
    const examsData = await examsRes.json();
    const catData = await catRes.json();
    setExams(examsData);
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
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchData();
      setFormData({ title: "", category: categories[0]?.name || "", duration: 60, passingScore: 50 });
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
    setLoadingQuestions(true);
    const res = await fetch(`/api/admin/exams/${exam._id}/questions`);
    const data = await res.json();
    setQuestions(data);
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
    const res = await fetch(`/api/admin/exams/${selectedExam._id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionData),
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions([...questions, data.question]);
      setQuestionData({ text: "", options: ["", "", "", ""], correctAnswer: 0 });
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
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">القسم</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary">
                <option value="" disabled>اختر القسم...</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.arName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">مدة الامتحان (بالدقائق)</label>
              <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">نسبة النجاح (%)</label>
              <input required type="number" min="1" max="100" value={formData.passingScore} onChange={e => setFormData({...formData, passingScore: Number(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
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
              <h3 className="font-bold text-lg mb-4 text-primary">سؤال جديد</h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">نص السؤال</label>
                <textarea required rows={3} value={questionData.text} onChange={e => setQuestionData({...questionData, text: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary resize-none"></textarea>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {questionData.options.map((opt, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold mb-2">الخيار {i + 1}</label>
                    <input required type="text" value={opt} onChange={e => {
                      const newOptions = [...questionData.options];
                      newOptions[i] = e.target.value;
                      setQuestionData({...questionData, options: newOptions});
                    }} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary" />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">الإجابة الصحيحة</label>
                <select value={questionData.correctAnswer} onChange={e => setQuestionData({...questionData, correctAnswer: Number(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary">
                  <option value={0}>الخيار الأول</option>
                  <option value={1}>الخيار الثاني</option>
                  <option value={2}>الخيار الثالث</option>
                  <option value={3}>الخيار الرابع</option>
                </select>
              </div>
              <button type="submit" className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> إضافة السؤال
              </button>
            </form>

            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-700">الأسئلة المضافة ({questions.length})</h3>
              {loadingQuestions ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl">لا توجد أسئلة مضافة بعد.</div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-primary-dark mb-2">{i + 1}. {q.text}</h4>
                      <ul className="grid grid-cols-2 gap-2 text-sm">
                        {q.options.map((opt: string, idx: number) => (
                          <li key={idx} className={`p-2 rounded-lg ${idx === q.correctAnswer ? 'bg-green-100 text-green-800 font-bold border border-green-200' : 'bg-white border border-gray-100'}`}>
                            {opt}
                          </li>
                        ))}
                      </ul>
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
      )}

      {/* Assignment Modal */}
      {assignExamModal && (
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
      )}

      {loading ? (
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
      )}
    </div>
  );
}
