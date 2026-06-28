"use client";

import { useState, useEffect } from "react";
import { Trash2, Users, BookOpen, X, ChevronDown, ChevronUp, Mail, Phone, Calendar } from "lucide-react";

export default function StudentsManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentRequests, setStudentRequests] = useState<Record<string, any[]>>({});

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) return;
    const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    if (res.ok) fetchStudents();
  };

  const loadStudentRequests = async (phone: string, studentId: string) => {
    if (expandedStudent === studentId) { setExpandedStudent(null); return; }
    setExpandedStudent(studentId);
    if (studentRequests[studentId]) return;
    try {
      const res = await fetch(`/api/admin/subscription-requests?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setStudentRequests(prev => ({ ...prev, [studentId]: Array.isArray(data) ? data : [] }));
    } catch {
      setStudentRequests(prev => ({ ...prev, [studentId]: [] }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#1E3A8A]" /> إدارة الطلاب
          <span className="bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm font-bold px-3 py-1 rounded-full">{students.length}</span>
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">جاري تحميل الطلاب...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          لا يوجد طلاب مسجلين حتى الآن.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student._id} className="border border-gray-200 rounded-2xl overflow-hidden hover:border-[#1E3A8A]/30 transition">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center font-bold text-[#1E3A8A]">
                    {student.fullName?.charAt(0) || "؟"}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#061B3D]">{student.fullName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {student.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>}
                      {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(student.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.phone && (
                    <button onClick={() => loadStudentRequests(student.phone, student._id)}
                      className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> طلباته
                      {expandedStudent === student._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                  <button onClick={() => handleDelete(student._id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedStudent === student._id && (
                <div className="p-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-600 mb-3">طلبات الاشتراك:</h4>
                  {!studentRequests[student._id] ? (
                    <div className="text-xs text-gray-400">جاري التحميل...</div>
                  ) : studentRequests[student._id].length === 0 ? (
                    <div className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">لا توجد طلبات اشتراك.</div>
                  ) : (
                    <div className="space-y-2">
                      {studentRequests[student._id].map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            <span className="text-sm font-semibold text-[#061B3D]">{req.courseName}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                            {req.status === 'approved' ? '✅ مقبول' : req.status === 'rejected' ? '❌ مرفوض' : '⏳ انتظار'}
                          </span>
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
