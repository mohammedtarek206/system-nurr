"use client";

import { useState, useEffect } from "react";
import { Trash2, Users, Edit } from "lucide-react";

export default function StudentsManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) return;
    const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    if (res.ok) fetchStudents();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          إدارة الطلاب
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">جاري تحميل الطلاب...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          لا يوجد طلاب مسجلين حتى الآن.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 rounded-tr-xl">الاسم</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">تاريخ التسجيل</th>
                <th className="p-4 rounded-tl-xl text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-bold text-primary-dark">{student.fullName}</td>
                  <td className="p-4 text-gray-600">{student.email}</td>
                  <td className="p-4 text-gray-600">{student.phone}</td>
                  <td className="p-4 text-gray-600">{new Date(student.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    <button onClick={() => handleDelete(student._id)} className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition">
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
