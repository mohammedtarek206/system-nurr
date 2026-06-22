"use client";

import { useState, useEffect } from "react";
import { Award, Trash2 } from "lucide-react";

export default function ResultsManager() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          نتائج امتحانات الطلاب
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">جاري تحميل النتائج...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          لم يقم أي طالب بإجراء امتحانات حتى الآن.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 rounded-tr-xl">اسم الطالب</th>
                <th className="p-4">الامتحان</th>
                <th className="p-4">النتيجة</th>
                <th className="p-4">النسبة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 rounded-tl-xl text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res) => {
                const passed = res.percentage >= (res.examId?.passingScore || 50);
                return (
                  <tr key={res._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-bold text-primary-dark">{res.userId?.fullName || "طالب محذوف"}</td>
                    <td className="p-4 text-gray-600">{res.examId?.title || "امتحان محذوف"}</td>
                    <td className="p-4 text-gray-600">{res.score} / {res.totalQuestions}</td>
                    <td className="p-4 font-bold">{res.percentage}%</td>
                    <td className="p-4">
                      {passed ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">ناجح</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">راسب</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => handleDelete(res._id)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition shadow-sm">
                        السماح بإعادة الامتحان
                      </button>
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
