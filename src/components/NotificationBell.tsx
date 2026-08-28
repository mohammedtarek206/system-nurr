"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCheck,
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
    Volume2,
    VolumeX
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NotificationItem {
    _id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority?: "normal" | "important" | "urgent";
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const previousUnreadCountRef = useRef(0);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/notifications/unread-count");
            if (res.ok) {
                const data = await res.json();
                const count = data.unreadCount || 0;

                // Play sound if unread count increased and sound is enabled
                if (count > previousUnreadCountRef.current && soundEnabled) {
                    playNotificationSound();
                }
                previousUnreadCountRef.current = count;
                setUnreadCount(count);
            }
        } catch (e) {
            console.error("Error fetching unread count:", e);
        }
    };

    const fetchRecentNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=10");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) {
            console.error("Error fetching notifications:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setNotifications([]);
            return;
        }

        // Initial fetch
        fetchUnreadCount();

        // Poll every 15 seconds for real-time updates without page refresh
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 15000);

        return () => clearInterval(interval);
    }, [user, soundEnabled]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            // Audio playback fallback
        }
    };

    const requestBrowserPermission = async () => {
        if ("Notification" in window) {
            const perm = await window.Notification.requestPermission();
            if (perm === "granted") {
                new window.Notification("تم تفعيل الإشعارات بنجاح!", {
                    body: "ستصلك التنبيهات حول الامتحانات والمحاضرات الجديدة فور نشرها.",
                    icon: "/logo.png"
                });
            }
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            fetchRecentNotifications();
        }
        setIsOpen(!isOpen);
    };

    const markAsRead = async (id: string, link?: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark as read", e);
        }

        if (link) {
            setIsOpen(false);
            router.push(link);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    const getIcon = (type: string, priority?: string) => {
        if (priority === "urgent" || type === "EXAM_PERFECT_SCORE") {
            return <Sparkles className="w-5 h-5 text-amber-500" />;
        }
        switch (type) {
            case "NEW_COURSE":
            case "COURSE_ACTIVATED":
            case "SECTION_UNLOCKED":
                return <BookOpen className="w-5 h-5 text-blue-600" />;
            case "NEW_LECTURE":
                return <Video className="w-5 h-5 text-indigo-600" />;
            case "NEW_EXAM":
                return <FileText className="w-5 h-5 text-purple-600" />;
            case "NEW_SUMMARY":
                return <FileCheck className="w-5 h-5 text-emerald-600" />;
            case "EXAM_PASSED":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "EXAM_FAILED":
                return <XCircle className="w-5 h-5 text-red-600" />;
            case "CERTIFICATE_ISSUED":
                return <Award className="w-5 h-5 text-amber-600" />;
            case "COURSE_EXPIRING_SOON":
            case "COURSE_EXPIRED":
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            default:
                return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diffSec < 60) return "الآن";
        if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
        if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
        return `منذ ${Math.floor(diffSec / 86400)} يوم`;
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative p-2.5 rounded-xl text-primary-dark hover:bg-primary/5 transition-all focus:outline-none"
                title="الإشعارات والتنبيهات"
            >
                <Bell className="w-6 h-6 text-primary-dark hover:text-gold transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black px-1.5 py-0.5 min-w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-primary-dark to-primary text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-gold" />
                            <h3 className="font-bold text-base">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <span className="bg-gold text-primary-dark text-xs font-black px-2 py-0.5 rounded-full">
                                    {unreadCount} غير مقروء
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-white/90 hover:text-gold flex items-center gap-1 font-semibold transition"
                                    title="تحديد الكل كمرئي"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    قراءة الكل
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">جاري تحميل الإشعارات...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">
                                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
                                <p className="text-sm font-medium">لا توجد إشعارات حالياً</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => markAsRead(n._id, n.link)}
                                    className={`p-4 flex gap-3 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                                        {getIcon(n.type, n.priority)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-bold truncate ${!n.isRead ? "text-primary-dark font-black" : "text-gray-800"}`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[11px] text-gray-400 font-medium shrink-0 mr-2">
                                                {getTimeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{n.message}</p>
                                    </div>

                                    {!n.isRead && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 self-center" />}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                        <button
                            onClick={requestBrowserPermission}
                            className="text-primary hover:text-gold font-bold flex items-center gap-1 transition"
                        >
                            🔔 تفعيل إشعارات المتصفح
                        </button>
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-primary-dark font-bold hover:text-gold transition"
                        >
                            عرض جميع الإشعارات ←
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
