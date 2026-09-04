"use client";

import { useState, useEffect } from "react";
import { Award, Users, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, Eye, Sparkles } from "lucide-react";

export default function ExamAttemptsManager() {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterExamType, setFilterExamType] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

    const fetchAttempts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterExamType !== "all") params.set("examType", filterExamType);
            if (search.trim()) params.set("search", search.trim());

            const res = await fetch(`/api/admin/exams/attempts?${params.toString()}`);
            const data = await res.json();
            setAttempts(data.attempts || []);
            setStats(data.stats || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttempts();
    }, [filterExamType]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAttempts();
    };

    return (
        <div className="space-y-6 dir-rtl text-right">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
                        <Award className="w-6 h-6 text-[#1E3A8A]" />
                        إحصائيات ومحاولات الامتحانات
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">متابعة أداء الطلاب ونتائج الامتحانات الفعلية من قاعدة البيانات</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterExamType}
                        onChange={(e) => setFilterExamType(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-[#1E3A8A] bg-white"
                    >
                        <option value="all">جميع الأنواع</option>
                        <option value="NIGHT_EXAM">🌙 امتحانات ليلة الامتحان</option>
                        <option value="NCLEX">🩺 امتحانات NCLEX</option>
                        <option value="REGULAR">📝 الامتحانات العادية</option>
                    </select>

                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 pr-9 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A] w-48 sm:w-64"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                    </form>

                    <button
                        onClick={fetchAttempts}
                        className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">إجمالي المحاولات</span>
                        <span className="text-2xl font-black text-[#061B3D] mt-1 block">{stats.totalAttempts}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">متوسط الدرجات</span>
                        <span className="text-2xl font-black text-blue-600 mt-1 block">{stats.avgScore}%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">أعلى درجة</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.highestScore}%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">أقل درجة</span>
                        <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.lowestScore}%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">نسبة النجاح</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.passRate}%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">نسبة الرسوب</span>
                        <span className="text-2xl font-black text-red-500 mt-1 block">{stats.failRate}%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">الدرجة النهائية 100%</span>
                        <span className="text-2xl font-black text-purple-600 mt-1 block">{stats.perfectScores}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-400 font-bold block">متوسط الوقت</span>
                        <span className="text-2xl font-black text-gray-700 mt-1 block">{stats.avgTimeMinutes} دقيقة</span>
                    </div>
                </div>
            )}

            {/* Attempts Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">جاري تحميل المحاولات والإحصائيات...</div>
                ) : attempts.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">لا توجد محاولات امتحانات مطابقة حتى الآن.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 text-gray-500 font-bold border-b">
                                <tr>
                                    <th className="p-4">الطالب</th>
                                    <th className="p-4">الامتحان</th>
                                    <th className="p-4">نوع الامتحان</th>
                                    <th className="p-4">النقاط والدرجة</th>
                                    <th className="p-4">النسبة</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">تاريخ البداية</th>
                                    <th className="p-4 text-center">تفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attempts.map((att) => {
                                    const examTitle = att.examId?.title || 'امتحان محذوف';
                                    const typeName = att.examType === 'NIGHT_EXAM' ? '🌙 ليلة الامتحان' : att.examType === 'NCLEX' ? '🩺 NCLEX' : '📝 عادي';
                                    const pct = att.percentage ?? 0;
                                    const isPassed = pct >= (att.examId?.passingPercentage || 50);

                                    return (
                                        <tr key={att._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 font-bold text-gray-900">
                                                {att.studentName}
                                                {att.userId?.email && <div className="text-xs font-normal text-gray-400">{att.userId.email}</div>}
                                            </td>

                                            <td className="p-4 font-semibold text-blue-900">{examTitle}</td>

                                            <td className="p-4 font-medium">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${att.examType === 'NIGHT_EXAM' ? 'bg-amber-100 text-amber-800' :
                                                        att.examType === 'NCLEX' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {typeName}
                                                </span>
                                            </td>

                                            <td className="p-4 font-mono font-bold text-gray-800">
                                                {att.earnedPoints ?? att.score ?? 0} / {att.totalPoints ?? '-'}
                                            </td>

                                            <td className="p-4 font-mono font-extrabold text-base">
                                                <span className={isPassed ? 'text-emerald-600' : 'text-red-500'}>
                                                    {pct}%
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                {att.status === 'COMPLETED' ? (
                                                    isPassed ? (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                                            <CheckCircle className="w-3.5 h-3.5" /> ناجح
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                                            <XCircle className="w-3.5 h-3.5" /> راسب
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                                        <Clock className="w-3.5 h-3.5 animate-spin" /> قيد الإجراء
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4 text-xs text-gray-500 font-mono">
                                                {att.startedAt ? new Date(att.startedAt).toLocaleString('ar-EG') : '-'}
                                            </td>

                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedAttempt(att)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
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

            {/* Attempt Details Modal */}
            {selectedAttempt && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-[#061B3D]">تفاصيل محاولة الامتحان</h3>
                                <p className="text-xs text-gray-500 mt-0.5">الطالب: {selectedAttempt.studentName}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAttempt(null)}
                                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                            >
                                إغلاق
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border text-center text-sm font-semibold">
                            <div>
                                <span className="text-gray-400 text-xs block">النقاط المكتسبة</span>
                                <span className="text-lg font-black text-blue-700">{selectedAttempt.earnedPoints ?? selectedAttempt.score ?? 0} / {selectedAttempt.totalPoints ?? '-'}</span>
                            </div>

                            <div>
                                <span className="text-gray-400 text-xs block">النسبة المئوية</span>
                                <span className="text-lg font-black text-emerald-600">{selectedAttempt.percentage ?? 0}%</span>
                            </div>

                            <div>
                                <span className="text-gray-400 text-xs block">الأسئلة الصحيحة</span>
                                <span className="text-lg font-black text-emerald-600">{selectedAttempt.correctCount ?? '-'}</span>
                            </div>

                            <div>
                                <span className="text-gray-400 text-xs block">الأسئلة الخاطئة</span>
                                <span className="text-lg font-black text-red-500">{selectedAttempt.wrongCount ?? '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">اسم الامتحان:</span>
                                <span className="font-bold text-[#061B3D]">{selectedAttempt.examId?.title || 'امتحان'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">نوع الامتحان:</span>
                                <span className="font-bold">{selectedAttempt.examType || 'REGULAR'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">الوقت المستغرق:</span>
                                <span className="font-mono font-bold">{Math.round((selectedAttempt.timeSpentSeconds || 0) / 60)} دقيقة</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">تاريخ البدء:</span>
                                <span className="font-mono">{selectedAttempt.startedAt ? new Date(selectedAttempt.startedAt).toLocaleString('ar-EG') : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">تاريخ التسليم:</span>
                                <span className="font-mono">{selectedAttempt.submittedAt ? new Date(selectedAttempt.submittedAt).toLocaleString('ar-EG') : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
