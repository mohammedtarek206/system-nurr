"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2, XCircle, Clock, Calendar, Search, Filter, ShieldAlert,
    UserCheck, AlertCircle, Loader2, Check, RefreshCw, Key, User, FileText, BookOpen, BookMarked, HelpCircle
} from "lucide-react";

export default function ContentAccessRequestsManager() {
    const [requests, setRequests] = useState<any[]>([]);
    const [accessList, setAccessList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'requests' | 'granted'>('requests');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state for Approval/Extension
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [selectedAccess, setSelectedAccess] = useState<any>(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [adminNotes, setAdminNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, accRes] = await Promise.all([
                fetch(`/api/access-requests?status=${statusFilter}&contentType=${typeFilter}`),
                fetch(`/api/admin/content-access?contentType=${typeFilter}`)
            ]);
            const reqData = await reqRes.json();
            const accData = await accRes.json();
            setRequests(Array.isArray(reqData.requests) ? reqData.requests : Array.isArray(reqData) ? reqData : []);
            setAccessList(Array.isArray(accData.accessList) ? accData.accessList : Array.isArray(accData) ? accData : []);
        } catch (e) {
            console.error("Error fetching access data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, typeFilter]);

    const handleApproveRequest = async () => {
        if (!selectedRequest) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/admin/access-requests/${selectedRequest._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "APPROVE",
                    startAt: startDate,
                    endAt: endDate,
                    adminNotes
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedRequest(null);
                fetchData();
            } else {
                setActionError(data.message || "فشلت عملية الموافقة");
            }
        } catch (e) {
            setActionError("حدث خطأ في الاتصال بالخادم");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (reqId: string) => {
        if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;
        try {
            const res = await fetch(`/api/admin/access-requests/${reqId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "REJECT" }),
            });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExtendAccess = async () => {
        if (!selectedAccess) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/admin/content-access/${selectedAccess._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endAt: endDate,
                    adminNotes
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedAccess(null);
                fetchData();
            } else {
                setActionError(data.message || "فشلت عملية التمديد");
            }
        } catch (e) {
            setActionError("حدث خطأ في الاتصال بالخادم");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeAccess = async (accessId: string) => {
        if (!confirm("هل أنت متأكد من إلغاء صلاحية الوصول لهذه المادة نهائياً؟")) return;
        try {
            const res = await fetch(`/api/admin/content-access/${accessId}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredRequests = requests.filter(r =>
        (r.userId?.fullName || r.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAccess = accessList.filter(a =>
        (a.userId?.fullName || a.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'COURSE': return <BookOpen className="w-4 h-4 text-blue-600" />;
            case 'SUMMARY': return <BookMarked className="w-4 h-4 text-amber-600" />;
            case 'EXAM': return <HelpCircle className="w-4 h-4 text-emerald-600" />;
            default: return <FileText className="w-4 h-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6 dir-rtl text-right">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-[#061B3D] flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-[#1E3A8A]" />
                        إدارة طلبات وصلاحيات الوصول للمحتوى
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">مراجعة طلبات الطلاب، الموافقة مع تحديد تواريخ البداية والنهاية، وتمديد الصلاحيات</p>
                </div>
            </div>

            {/* Sub Tabs */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Clock className="w-4 h-4" /> طلبات الوصول ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('granted')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'granted' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> الصلاحيات الممنوحة والنشطة ({accessList.length})
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'requests' && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#1E3A8A] bg-white"
                        >
                            <option value="PENDING">في انتظار الموافقة</option>
                            <option value="APPROVED">مقبولة</option>
                            <option value="REJECTED">مرفوضة</option>
                            <option value="EXPIRED">منتهية</option>
                        </select>
                    )}

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#1E3A8A] bg-white"
                    >
                        <option value="all">جميع أنواع المحتوى</option>
                        <option value="COURSE">كورسات</option>
                        <option value="SUMMARY">ملخصات</option>
                        <option value="EXAM">امتحانات</option>
                        <option value="LESSON">محاضرات</option>
                    </select>

                    <div className="relative w-48">
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute top-2.5 right-2.5" />
                    </div>
                </div>
            </div>

            {/* Requests View */}
            {activeTab === 'requests' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 font-bold">جاري تحميل الطلبات...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">لا توجد طلبات وصول بهذه المواصفات.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 text-gray-500 font-bold border-b">
                                    <tr>
                                        <th className="p-4">الطالب</th>
                                        <th className="p-4">المحتوى المطلوب</th>
                                        <th className="p-4">تاريخ الطلب</th>
                                        <th className="p-4">الحالة</th>
                                        <th className="p-4 text-center">إجراءات الإدارة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRequests.map((req) => (
                                        <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-[#061B3D]">{req.userId?.fullName || 'طالب غير معرف'}</div>
                                                <div className="text-xs text-gray-400">{req.userId?.email || ''}</div>
                                            </td>

                                            <td className="p-4 font-semibold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    {getContentIcon(req.contentType)}
                                                    <span>[{req.contentType}]</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-xs font-mono text-gray-500">
                                                {new Date(req.createdAt).toLocaleString('ar-EG')}
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {req.status === 'PENDING' ? 'في انتظار الموافقة' :
                                                        req.status === 'APPROVED' ? 'مقبول' :
                                                            req.status === 'REJECTED' ? 'مرفوض' : 'منتهي'}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center">
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setStartDate(new Date().toISOString().split('T')[0]);
                                                                setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> موافقة وتحديد المدة
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(req._id)}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition"
                                                        >
                                                            رفض
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-mono">تم التعامل معه</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Granted Access View */}
            {activeTab === 'granted' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 font-bold">جاري تحميل الصلاحيات...</div>
                    ) : filteredAccess.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">لا توجد صلاحيات ممنوحة حلياً.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 text-gray-500 font-bold border-b">
                                    <tr>
                                        <th className="p-4">الطالب</th>
                                        <th className="p-4">المحتوى Mapped</th>
                                        <th className="p-4">تاريخ البداية</th>
                                        <th className="p-4">تاريخ الانتهاء</th>
                                        <th className="p-4">الحالة</th>
                                        <th className="p-4 text-center">إجراءات الإدارة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAccess.map((acc) => {
                                        const isExpired = acc.endAt && new Date(acc.endAt) < new Date();
                                        return (
                                            <tr key={acc._id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-[#061B3D]">{acc.userId?.fullName || 'طالب'}</div>
                                                    <div className="text-xs text-gray-400">{acc.userId?.email || ''}</div>
                                                </td>

                                                <td className="p-4 font-semibold text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        {getContentIcon(acc.contentType)}
                                                        <span>[{acc.contentType}]</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-xs font-mono text-gray-600">
                                                    {acc.startAt ? new Date(acc.startAt).toLocaleDateString('ar-EG') : 'فوراً'}
                                                </td>

                                                <td className="p-4 text-xs font-mono font-bold text-blue-700">
                                                    {acc.endAt ? new Date(acc.endAt).toLocaleDateString('ar-EG') : 'مفتوح'}
                                                </td>

                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isExpired ? 'bg-red-100 text-red-800' :
                                                            acc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {isExpired ? 'منتهي (EXPIRED)' : acc.status}
                                                    </span>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAccess(acc);
                                                                setEndDate(acc.endAt ? new Date(acc.endAt).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition flex items-center gap-1"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" /> تمديد الصلاحية
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevokeAccess(acc._id)}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition"
                                                        >
                                                            إلغاء الصلاحية
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
            )}

            {/* Approval Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
                        <h3 className="text-lg font-bold text-[#061B3D]">الموافقة على طلب الوصول وتحديد فترة الصلاحية</h3>

                        {actionError && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">{actionError}</div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ بداية الصلاحية *</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ انتهاء الصلاحية *</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الإدارة (تظهر في الإشعار للطالب)</label>
                                <input
                                    type="text"
                                    placeholder="مثال: تم تفعيل وصولك بنجاح لمدة شهر..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleApproveRequest}
                                disabled={actionLoading}
                                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                                {actionLoading ? "جاري الموافقة..." : "تأكيد منح الصلاحية"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Extension Modal */}
            {selectedAccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
                        <h3 className="text-lg font-bold text-[#061B3D]">تمديد تاريخ انتهاء الصلاحية</h3>

                        {actionError && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">{actionError}</div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ الانتهاء الجديد *</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات التمديد</label>
                                <input
                                    type="text"
                                    placeholder="سبب التمديد..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1E3A8A]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <button
                                onClick={() => setSelectedAccess(null)}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleExtendAccess}
                                disabled={actionLoading}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                            >
                                {actionLoading ? "جاري التمديد..." : "حفظ التمديد"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
