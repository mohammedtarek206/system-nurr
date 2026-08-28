"use client";

import { useState, useEffect } from "react";
import { Trash2, Users, BookOpen, X, ChevronDown, ChevronUp, Mail, Phone, Calendar, Ban, ShieldCheck, MonitorSmartphone, Settings } from "lucide-react";

export default function StudentsManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentRequests, setStudentRequests] = useState<Record<string, any[]>>({});

  const fetchStudents = async () => {
    setLoading(true);
    const [res, specRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/specializations")
    ]);
    const data = await res.json();
    const specData = await specRes.json();
    setStudents(Array.isArray(data) ? data : []);
    setSpecializations(Array.isArray(specData) ? specData : []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) return;
    const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    if (res.ok) fetchStudents();
  };

  const handleAction = async (id: string, action: string, data?: any) => {
    let confirmMsg = action === 'ban' ? "هل أنت متأكد من حظر هذا الطالب؟" :
      action === 'unban' ? "هل تريد إزالة الحظر عن هذا الطالب؟" :
        action === 'resetDevice' ? "هل تريد إعادة تعيين جهاز الطالب؟" : "";
    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data })
      });
      if (res.ok) fetchStudents();
    } catch (e) {
      alert("حدث خطأ أثناء التنفيذ");
    }
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

                      {student.isBanned && <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded">محظور</span>}
                      {student.deviceId && !student.isBanned && <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded flex items-center gap-1"><MonitorSmartphone className="w-3 h-3" /> جهاز نشط</span>}

                      <select
                        value={student.specializationId?._id || student.specializationId || ""}
                        onChange={(e) => handleAction(student._id, 'updateType', { specializationId: e.target.value })}
                        className="bg-white border rounded px-2 py-0.5 text-xs text-gray-700 outline-none"
                      >
                        <option value="">نوع التخصص غير محدد</option>
                        {specializations.map(spec => (
                          <option key={spec._id} value={spec._id}>{spec.arName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.isBanned ? (
                    <button onClick={() => handleAction(student._id, 'unban')} className="text-xs bg-green-50 text-green-600 font-bold px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> فك الحظر
                    </button>
                  ) : (
                    <button onClick={() => handleAction(student._id, 'ban', { reason: 'Admin Manual Ban' })} className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-lg hover:bg-orange-100 transition flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" /> حظر
                    </button>
                  )}
                  {student.deviceId && (
                    <button onClick={() => handleAction(student._id, 'resetDevice')} className="text-xs bg-purple-50 text-purple-600 font-bold px-3 py-1.5 rounded-lg hover:bg-purple-100 transition flex items-center gap-1" title="مسح الجهاز المرتبط للسماح بالدخول من جهاز جديد">
                      <MonitorSmartphone className="w-3.5 h-3.5" /> Reset Device
                    </button>
                  )}
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
