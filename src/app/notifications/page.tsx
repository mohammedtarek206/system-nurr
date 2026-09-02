"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
    Bell,
    CheckCheck,
    Filter,
    BookOpen,
    Video,
    FileText,
    Award,
    AlertTriangle,
    Sparkles,
    Info,
    CheckCircle,
    XCircle,
    FileCheck,
    Settings,
    Volume2,
    VolumeX,
    X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("all");
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Preferences State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [preferences, setPreferences] = useState({
        newCourses: true,
        newLectures: true,
        newExams: true,
        summaries: true,
        announcements: true,
        results: true,
        subscriptionAlerts: true,
        browserNotifications: false,
        sound: false
    });
    const [savingPrefs, setSavingPrefs] = useState(false);

    const fetchNotifications = async (filter = activeTab) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?filter=${filter}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreferences = async () => {
        try {
            const res = await fetch("/api/notifications/preferences");
            if (res.ok) {
                const data = await res.json();
                setPreferences(data);
            }
        } catch (e) {
            console.error("Failed to fetch preferences", e);
        }
    };

    useEffect(() => {
        if (user === null) {
            router.push("/login");
            return;
        }
        if (user) {
            fetchNotifications(activeTab);
            fetchPreferences();
        }
    }, [user, activeTab]);

    const markAsRead = async (id: string, link?: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
        if (link) router.push(link);
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const savePreferences = async (newPrefs: typeof preferences) => {
        setSavingPrefs(true);
        setPreferences(newPrefs);
        try {
            await fetch("/api/notifications/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPrefs)
            });
        } catch (e) {
            console.error("Failed to save preferences", e);
        } finally {
            setSavingPrefs(false);
        }
    };

    const getIcon = (type: string, priority?: string) => {
        if (priority === "urgent" || type === "EXAM_PERFECT_SCORE") {
            return <Sparkles className="w-6 h-6 text-amber-500" />;
        }
        switch (type) {
            case "NEW_COURSE":
            case "COURSE_ACTIVATED":
            case "SECTION_UNLOCKED":
                return <BookOpen className="w-6 h-6 text-blue-600" />;
            case "NEW_LECTURE":
                return <Video className="w-6 h-6 text-indigo-600" />;
            case "NEW_EXAM":
                return <FileText className="w-6 h-6 text-purple-600" />;
            case "NEW_SUMMARY":
                return <FileCheck className="w-6 h-6 text-emerald-600" />;
            case "EXAM_PASSED":
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            case "EXAM_FAILED":
                return <XCircle className="w-6 h-6 text-red-600" />;
            case "CERTIFICATE_ISSUED":
                return <Award className="w-6 h-6 text-amber-600" />;
            case "COURSE_EXPIRING_SOON":
            case "COURSE_EXPIRED":
                return <AlertTriangle className="w-6 h-6 text-orange-500" />;
            default:
                return <Info className="w-6 h-6 text-gray-500" />;
        }
    };

    const tabs = [
        { id: "all", label: "الكل" },
        { id: "unread", label: "غير مقروء" },
        { id: "exams", label: "الامتحانات" },
        { id: "courses", label: "الكورسات" },
        { id: "lectures", label: "المحاضرات" },
        { id: "summaries", label: "الملخصات" },
        { id: "announcements", label: "الإعلانات" },
        { id: "results", label: "النتائج والشهادات" },
        { id: "system", label: "النظام والاشتراكات" }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                {/* Title & Actions Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary-dark">
                            <Bell className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-primary-dark">مركز الإشعارات والتنبيهات</h1>
                            <p className="text-sm text-gray-500">تابع أحدث المحاضرات والامتحانات وتحديثات الكورسات الخاصة بك</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="bg-blue-50 text-primary-dark hover:bg-blue-100 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm"
                            >
                                <CheckCheck className="w-4 h-4 text-primary" />
                                تحديد الكل كمرئي
                            </button>
                        )}
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                        >
                            <Settings className="w-4 h-4 text-gray-600" />
                            إعدادات الإشعارات
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t.id
                                    ? "bg-primary-dark text-white shadow-md shadow-primary-dark/20"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {t.label}
                                {t.id === "unread" && unreadCount > 0 && (
                                    <span className="mr-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="text-center py-16 text-gray-400 font-medium">جاري تحميل الإشعارات...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 stroke-1" />
                            <h3 className="text-lg font-bold text-gray-700 mb-1">لا توجد إشعارات في هذا القسم</h3>
                            <p className="text-sm">سيتم تنبيهك فور نشر أي محتوى جديد يناسب تخصصك وكورساتك.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                onClick={() => markAsRead(n._id, n.link)}
                                className={`p-5 flex items-start gap-4 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-gray-50/80"
                                    }`}
                            >
                                <div className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100 shrink-0">
                                    {getIcon(n.type, n.priority)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                        <h3 className={`text-base font-bold ${!n.isRead ? "text-primary-dark font-black" : "text-gray-800"}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-xs font-semibold text-gray-400 dir-ltr">
                                            {new Date(n.createdAt).toLocaleString("ar-EG")}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{n.message}</p>

                                    {n.link && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-gold transition">
                                            فتح المحتوى المرتبط ←
                                        </span>
                                    )}
                                </div>

                                {!n.isRead && (
                                    <span className="w-3 h-3 bg-blue-600 rounded-full shrink-0 self-center" title="غير مقروء" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Preferences Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Settings className="w-6 h-6 text-primary" />
                                <h3 className="text-xl font-bold text-primary-dark">إعدادات الإشعارات والتنبيهات</h3>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {[
                                { id: "newCourses", label: "تنبيهات الكورسات الجديدة", desc: "تلقي إشعارات عند إضافة كورسات مخصصة لتخصصك" },
                                { id: "newLectures", label: "تنبيهات المحاضرات والدروس", desc: "تلقي إشعارات عند رفع محاضرة جديدة" },
                                { id: "newExams", label: "تنبيهات الامتحانات والاختبارات", desc: "تلقي تنبيه فور نشر امتحان جديد" },
                                { id: "summaries", label: "تنبيهات الملخصات والملفات", desc: "تلقي تنبيه عند نشر ملخصات جديدة" },
                                { id: "announcements", label: "تنبيهات الإعلانات العامة", desc: "استقبال التنويهات الإدارية والإعلانات" },
                                { id: "results", label: "تنبيهات نتائج الامتحانات والشهادات", desc: "تصلك نتائج امتحاناتك والشهادات فور صدورها" },
                                { id: "subscriptionAlerts", label: "تنبيهات اشتراكات الكورسات", desc: "تصلك تنبيهات تفعيل الاشتراكات وقرب انتهاء الصلاحية" },
                                { id: "sound", label: "صوت التنبيه (Sound Alert)", desc: "تشغيل صوت تنبيه لطيف عند وصول إشعار جديد" }
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800">{item.label}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(preferences as any)[item.id]}
                                            onChange={(e) => savePreferences({ ...preferences, [item.id]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-dark"></div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="bg-primary-dark text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary transition shadow-md"
                            >
                                حفظ وإغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-primary-dark py-8 text-center border-t border-white/10 mt-12">
                <div className="container mx-auto px-4">
                    <p className="text-gray-400 text-sm">منصة أحمد الأزهري للتأهيل والتدريب المهني © {new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
}
