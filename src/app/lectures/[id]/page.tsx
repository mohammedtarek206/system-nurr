"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Video as VideoIcon,
    Clock,
    Calendar,
    ChevronRight,
    ExternalLink,
    Lock,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    Users,
    Loader2,
    Play
} from "lucide-react";

interface LectureData {
    _id: string;
    title: string;
    description?: string;
    platform: 'ZOOM' | 'FREE_CONFERENCE' | 'VIDEO';
    url?: string;
    courseId: string;
    courseTitle: string;
    sectionId: string;
    sectionTitle: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    duration?: string;
    scheduleStatus: 'Active' | 'Scheduled' | 'Expired';
    isAccessible: boolean;
}

export default function LectureDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [lecture, setLecture] = useState<LectureData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchLecture = async () => {
            setLoading(true);
            setErrorMsg("");
            try {
                const res = await fetch(`/api/videos/${id}`);
                const data = await res.json();

                if (!res.ok) {
                    setErrorMsg(data.message || "تعذر الوصول للمحاضرة");
                    if (data.lecture) {
                        setLecture(data.lecture);
                    }
                    setLoading(false);
                    return;
                }

                if (data.lecture) {
                    setLecture(data.lecture);
                    // Requirement 17: Log actual platform and URL to browser console during development
                    console.log("Lecture Loaded Successfully:", {
                        Platform: data.lecture.platform,
                        URL: data.lecture.url,
                        Accessible: data.lecture.isAccessible
                    });
                } else {
                    setErrorMsg("بيانات المحاضرة غير متاحة");
                }
            } catch (err) {
                console.error("Fetch lecture error:", err);
                setErrorMsg("حدث خطأ في الاتصال بالخادم.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchLecture();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center" dir="rtl">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-[#1E3A8A] animate-spin mx-auto" />
                    <p className="text-gray-600 font-bold text-lg">جاري تحضير المحاضرة...</p>
                </div>
            </div>
        );
    }

    const isLive = lecture?.scheduleStatus === 'Active' && lecture?.isAccessible && !!lecture?.url;
    const isScheduled = lecture?.scheduleStatus === 'Scheduled';
    const isExpired = lecture?.scheduleStatus === 'Expired';

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
            {/* Top Banner */}
            <div className="bg-[#061B3D] text-white py-10 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
                <div className="container mx-auto max-w-4xl relative z-10">
                    <Link
                        href={lecture?.courseId ? `/courses/${lecture.courseId}` : '/courses'}
                        className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-6 text-sm font-semibold"
                    >
                        <ChevronRight className="w-4 h-4" />
                        {lecture?.courseTitle ? `العودة لكورس: ${lecture.courseTitle}` : 'العودة للكورسات'}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* Platform Badge */}
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${lecture?.platform === 'ZOOM'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                                    : lecture?.platform === 'FREE_CONFERENCE'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                                        : 'bg-red-500/20 text-red-300 border-red-400/30'
                                }`}
                        >
                            <VideoIcon className="w-3.5 h-3.5" />
                            {lecture?.platform === 'ZOOM'
                                ? 'محاضرة زووم (Zoom Meeting)'
                                : lecture?.platform === 'FREE_CONFERENCE'
                                    ? 'محاضرة فري كونفرنس (Free Conference)'
                                    : 'فيديو / درس'}
                        </span>

                        {/* Schedule Status Badge */}
                        {isLive && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                متاحة الآن Live
                            </span>
                        )}
                        {isScheduled && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                تبدأ قريباً (Scheduled)
                            </span>
                        )}
                        {isExpired && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                انتهت الصلاحية (Expired)
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black mb-3 leading-snug">{lecture?.title || 'عنوان المحاضرة'}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                        {lecture?.courseTitle && (
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                                {lecture.courseTitle}
                            </span>
                        )}
                        {lecture?.sectionTitle && (
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                <Users className="w-4 h-4 text-[#D4AF37]" />
                                {lecture.sectionTitle}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-4xl px-4 py-8">
                {/* Error / Restriction Banner */}
                {errorMsg && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
                        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-amber-900 mb-2">{errorMsg}</h2>
                        <p className="text-amber-700 text-sm max-w-lg mx-auto mb-4">
                            تأكد من تسديد الاشتراك أو متابعة وقت بداية المحاضرة المحدد من قبل الأدمن.
                        </p>
                    </div>
                )}

                {/* Details Card */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                    {/* Description */}
                    {lecture?.description && (
                        <div>
                            <h3 className="text-lg font-bold text-[#061B3D] mb-2 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                                تفاصيل الشرح والموضوعات
                            </h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-base bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                {lecture.description}
                            </p>
                        </div>
                    )}

                    {/* Timing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">تاريخ ووقت البداية</p>
                                <p className="text-sm font-bold text-gray-800">
                                    {lecture?.startDate ? `${lecture.startDate} ${lecture.startTime || ''}` : 'متاحة بشكل فوري'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold">تاريخ ووقت النهاية</p>
                                <p className="text-sm font-bold text-gray-800">
                                    {lecture?.endDate ? `${lecture.endDate} ${lecture.endTime || ''}` : 'بدون تاريخ انتهاء'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Join Button Area (Requirements 9, 10, 11, 26, 27) */}
                    <div className="pt-4 border-t border-gray-100 text-center">
                        {isLive ? (
                            <div className="space-y-3">
                                {/* Real Anchor Link (Requirement 27: Popup Blocker Prevention) */}
                                <a
                                    href={lecture.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-emerald-600 text-white font-black text-lg px-10 py-4 rounded-2xl hover:bg-emerald-700 transition shadow-lg hover:shadow-emerald-200 transform hover:-translate-y-0.5"
                                >
                                    <ExternalLink className="w-6 h-6" />
                                    الانضمام للمحاضرة الآن (Join Lecture)
                                </a>
                                <p className="text-xs text-gray-400">
                                    سيتم فتح رابط {lecture.platform === 'ZOOM' ? 'Zoom' : lecture.platform === 'FREE_CONFERENCE' ? 'Free Conference' : 'البث'} في تبويب جديد تلقائياً
                                </p>
                            </div>
                        ) : isScheduled ? (
                            <div className="bg-amber-50 text-amber-800 p-6 rounded-2xl border border-amber-200 text-center space-y-3">
                                <Clock className="w-8 h-8 mx-auto text-amber-600" />
                                <h4 className="font-bold text-lg">المحاضرة ستبدأ في الوقت المحدد أعلاه</h4>
                                <p className="text-sm text-amber-700">يرجى العودة في الموعد المحدد للانضمام للبث المباشر.</p>
                                <button disabled className="bg-gray-300 text-gray-500 font-bold px-8 py-3 rounded-xl cursor-not-allowed text-sm">
                                    الانضمام غير متاح حالياً
                                </button>
                            </div>
                        ) : isExpired ? (
                            <div className="bg-rose-50 text-rose-800 p-6 rounded-2xl border border-rose-200 text-center space-y-3">
                                <Lock className="w-8 h-8 mx-auto text-rose-600" />
                                <h4 className="font-bold text-lg">انتهت صلاحية هذه المحاضرة</h4>
                                <p className="text-sm text-rose-700">تواصل مع الإدارة في حال احتجت لإعادة تفعيل الوصول.</p>
                                <button disabled className="bg-gray-300 text-gray-500 font-bold px-8 py-3 rounded-xl cursor-not-allowed text-sm">
                                    المحاضرة منتهية
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 text-gray-600 p-6 rounded-2xl border border-gray-200 text-center space-y-2">
                                <AlertCircle className="w-8 h-8 mx-auto text-gray-400" />
                                <p className="font-bold text-base">رابط المحاضرة غير متاح حالياً.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
