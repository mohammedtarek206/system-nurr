"use client";

import { useState, useEffect } from "react";
import { Award, Trash2, ChevronDown, ChevronUp, Clock, MessageSquare, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function ResultsManager() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResults = async () => {
    const res = await fetch("/api/admin/results");
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف نتيجة هذا الطالب؟ سيسمح له ذلك بإعادة الامتحان.")) return;
    const res = await fetch(`/api/admin/results/${id}`, { method: "DELETE" });
    if (res.ok) fetchResults();
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          نتائج امتحانات الطلاب (Prometric Simulator)
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">جاري تحميل النتائج...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          لم يقم أي طالب بإجراء امتحانات حتى الآن.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res) => {
            const passed = res.percentage >= (res.examId?.passingScore || 50);
            const isExpanded = expandedId === res._id;

            return (
              <div key={res._id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition hover:border-primary/30">
                {/* Header Row */}
                <div 
                  className={`flex flex-wrap md:flex-nowrap items-center justify-between p-4 cursor-pointer select-none ${isExpanded ? 'bg-primary/5' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setExpandedId(isExpanded ? null : res._id)}
                >
                  <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {res.percentage}%
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-dark text-lg">{res.studentName || res.userId?.fullName || "طالب محذوف"}</h3>
                      <p className="text-sm text-gray-500">{res.examId?.title || "امتحان محذوف"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="text-center hidden sm:block">
                      <div className="text-xs text-gray-400 font-bold">الدرجة</div>
                      <div className="font-bold text-gray-700">{res.score} / {res.totalQuestions}</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-xs text-gray-400 font-bold">الزمن</div>
                      <div className="font-bold text-gray-700">{formatTime(res.timeSpentSeconds)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passed ? 'ناجح' : 'راسب'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(res._id); }} 
                        className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition"
                        title="حذف المحاولة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-gray-400 p-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 bg-white border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-sm font-bold text-gray-500 mb-1">تاريخ ووقت البدء</div>
                        <div className="text-gray-800 font-semibold" dir="ltr">
                          {res.startTime ? new Date(res.startTime).toLocaleString('en-GB') : "غير متوفر"}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <div className="text-sm font-bold text-green-700 mb-1">إجابات صحيحة</div>
                        <div className="text-2xl font-black text-green-600">{res.correctAnswers || 0}</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                        <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                        <div className="text-sm font-bold text-red-700 mb-1">إجابات خاطئة</div>
                        <div className="text-2xl font-black text-red-600">{res.incorrectAnswers || 0}</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-sm font-bold text-yellow-700 mb-1">تمت الإشارة لها (Flagged)</div>
                        <div className="text-2xl font-black text-yellow-600">{res.flagged || 0}</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm font-bold text-gray-500 mb-2">عدد الأسئلة التي لم يتم إجابتها: <span className="text-gray-800">{res.unanswered || 0}</span></div>
                    </div>

                    {res.comments && res.comments.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-bold text-primary-dark mb-3 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" /> تعليقات الطالب على الأسئلة
                        </h4>
                        <div className="space-y-3">
                          {res.comments.map((comment: any, idx: number) => (
                            <div key={idx} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                              <p className="text-xs font-bold text-blue-800 mb-1">سؤال معرف: {comment.questionId}</p>
                              <p className="text-gray-700">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
