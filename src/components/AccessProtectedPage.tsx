"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    KeyRound, ShieldCheck, Lock, Calendar, Clock, CheckCircle2,
    AlertCircle, Send, Sparkles, BookOpen, User, Phone, MapPin,
    GraduationCap, Hash, ArrowLeft, RefreshCw, Check, PlayCircle, Award, FileText
} from "lucide-react";
import Footer from "@/components/Footer";
import Link from "next/link";

interface AccessProtectedPageProps {
    pageType: "NIGHT_EXAM" | "NCLEX";
    title: string;
    subtitle: string;
    description: string;
    badgeText: string;
    accentColor: "amber" | "blue";
}

export default function AccessProtectedPage({
    pageType,
    title,
    subtitle,
    description,
    badgeText,
    accentColor,
}: AccessProtectedPageProps) {
    const { user } = useAuth();

    // Step state: 'verify' | 'unlocked' | 'booking_success'
    const [step, setStep] = useState<'verify' | 'unlocked' | 'booking_success'>('verify');
    const [accessCode, setAccessCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [verifiedCodeDetails, setVerifiedCodeDetails] = useState<any>(null);

    // Exams State
    const [exams, setExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [examsError, setExamsError] = useState("");

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        studentName: user?.name || "",
        nationalId: "",
        phone: user?.phone || "",
        governorate: "",
        university: "",
        specialization: user?.specialization || "",
        examDate: "",
        preferredTime: "",
        notes: ""
    });
    const [submittingBooking, setSubmittingBooking] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Auto-fill user data when user logs in or loads
    useEffect(() => {
        if (user) {
            setBookingData(prev => ({
                ...prev,
                studentName: prev.studentName || user.name || "",
                phone: prev.phone || user.phone || "",
                specialization: prev.specialization || user.specialization || ""
            }));
        }
    }, [user]);

    // Fetch exams for this section
    const fetchExams = async (code: string) => {
        setLoadingExams(true);
        setExamsError("");
        try {
            const res = await fetch(`/api/student/exams?examType=${pageType}&accessCode=${encodeURIComponent(code)}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setExams(data.exams || []);
            } else {
                setExamsError(data.message || "حدث خطأ أثناء جلب الامتحانات");
                setExams([]);
            }
        } catch (err) {
            console.error(err);
            setExamsError("تعذر الاتصال بالخادم لجلب الامتحانات");
        } finally {
            setLoadingExams(false);
        }
    };

    const verifyCode = async (codeToVerify: string) => {
        if (!codeToVerify.trim()) {
            setVerifyError("يرجى إدخال كود الدخول");
            return;
        }

        setVerifying(true);
        setVerifyError("");

        try {
            const res = await fetch("/api/access-codes/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: codeToVerify, pageType })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setVerifiedCodeDetails(data);
                sessionStorage.setItem(`access_code_${pageType}`, codeToVerify.trim().toUpperCase());
                setStep('unlocked');
                fetchExams(codeToVerify.trim().toUpperCase());
            } else {
                setVerifyError(data.message || "كود الدخول غير صحيح أو انتهت صلاحيته");
            }
        } catch (err) {
            console.error(err);
            setVerifyError("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً");
        } finally {
            setVerifying(false);
        }
    };

    // Check session storage on mount
    useEffect(() => {
        const savedCodeKey = `access_code_${pageType}`;
        const savedCode = sessionStorage.getItem(savedCodeKey);
        if (savedCode) {
            setAccessCode(savedCode);
            verifyCode(savedCode);
        }
    }, [pageType]);

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verifyCode(accessCode);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingError("");

        if (!bookingData.studentName.trim()) {
            setBookingError("يرجى إدخال الاسم بالكامل");
            return;
        }

        if (bookingData.nationalId.length !== 14 || !/^\d+$/.test(bookingData.nationalId)) {
            setBookingError("الرقم القومي يجب أن يتكون من 14 رقم بالضبط");
            return;
        }

        if (!bookingData.phone.trim()) {
            setBookingError("يرجى إدخال رقم الهاتف للتواصل");
            return;
        }

        setSubmittingBooking(true);

        try {
            const res = await fetch("/api/exam-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...bookingData,
                    accessCode: accessCode.trim().toUpperCase(),
                    pageType
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setBookingResult(data.booking);
                setStep('booking_success');
            } else {
                setBookingError(data.message || "حدث خطأ أثناء حجز الامتحان، يرجى المحاولة لاحقاً");
            }
        } catch (err) {
            console.error(err);
            setBookingError("تعذر الاتصال بالخادم، يرجى إعادة المحاولة");
        } finally {
            setSubmittingBooking(false);
        }
    };

    const handleWhatsAppRedirect = () => {
        const pageName = pageType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX';
        const message = `مرحباً، تم حجز امتحان [${pageName}] بنجاح.\nالاسم: ${bookingData.studentName}\nالرقم القومي: ${bookingData.nationalId}\nكود الدخول: ${accessCode.toUpperCase()}`;
        const url = `https://wa.me/201016223940?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    const isAmber = accentColor === "amber";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col dir-rtl text-right font-sans">
            {/* Hero Header Banner */}
            <section className={`relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 text-white ${isAmber
                ? "bg-gradient-to-r from-[#061B3D] via-[#1E3A8A] to-[#3B82F6]"
                : "bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0284C7]"
                }`}>
                <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
                <div className="max-w-5xl mx-auto relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-gold font-semibold text-sm shadow-sm">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>{badgeText}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        {title}
                    </h1>

                    <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto font-light">
                        {subtitle}
                    </p>

                    <p className="text-sm text-gray-300 max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12">
                {/* STEP 1: VERIFY CODE GATE */}
                {step === 'verify' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
                        <div className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6">
                            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${isAmber ? "bg-amber-500/10 text-amber-600 border border-amber-200" : "bg-blue-500/10 text-blue-600 border border-blue-200"
                                }`}>
                                <KeyRound className="w-10 h-10 animate-bounce" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#061B3D]">أدخل كود الدخول الخاص بك</h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    للوصول لمحتوى وحجز امتحانات {pageType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}، يرجى كتابة الكود المعتمد المخصص لك.
                                </p>
                            </div>

                            <form onSubmit={handleVerifySubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        placeholder="مثال: EXAM-2026-NIGHT"
                                        className="w-full text-center text-xl font-mono tracking-widest uppercase px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>

                                {verifyError && (
                                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-right">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <span>{verifyError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 ${isAmber
                                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                                        }`}
                                >
                                    {verifying ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>جاري التثبت من الكود...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            <span>تأكيد الكود والدخول</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="pt-6 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4 text-emerald-600" />
                                <span>نظام حماية وتوثيق مشفر معتمد من منصة التدريب</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: UNLOCKED CONTENT & AVAILABLE EXAMS */}
                {step === 'unlocked' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Success Banner Notice */}
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4 text-emerald-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base">تم التثبت من كود الدخول بنجاح!</h4>
                                    <p className="text-xs text-emerald-700">الكود المفعل: <span className="font-mono font-bold uppercase">{accessCode}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem(`access_code_${pageType}`);
                                    setStep('verify');
                                    setAccessCode("");
                                }}
                                className="text-xs font-semibold underline text-emerald-700 hover:text-emerald-900"
                            >
                                تغيير الكود
                            </button>
                        </div>

                        {/* SECTION A: EXAMS LIST */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#061B3D] flex items-center gap-2">
                                        <FileText className="w-6 h-6 text-[#1E3A8A]" />
                                        الامتحانات المتاحة قسم {pageType === 'NIGHT_EXAM' ? 'ليلة الامتحان' : 'NCLEX'}
                                    </h2>
                                    <p className="text-gray-500 text-xs mt-1">اضغط على "ابدأ الامتحان" للانتقال لمحاكي الاختبار المتطور</p>
                                </div>
                                <button
                                    onClick={() => fetchExams(accessCode)}
                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingExams ? 'animate-spin' : ''}`} /> تحديث الامتحانات
                                </button>
                            </div>

                            {loadingExams ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 text-gray-400 font-bold">
                                    جاري تحميل الامتحانات المتاحة لك...
                                </div>
                            ) : examsError ? (
                                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
                                    {examsError}
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300 space-y-2">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                                    <h4 className="font-bold text-gray-700">لا توجد امتحانات جديدة حالياً</h4>
                                    <p className="text-xs text-gray-400">سيتم إضافة الامتحانات المخصصة لك قريباً بواسطة أدمن المنصة.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {exams.map((exam) => {
                                        const isAvailable = exam.canStart;
                                        const isComingSoon = exam.statusTag === 'COMING_SOON';
                                        const isEnded = exam.statusTag === 'EXAM_ENDED';

                                        return (
                                            <div key={exam._id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="bg-[#1E3A8A]/10 text-[#1E3A8A] px-3 py-1 rounded-full text-xs font-extrabold">
                                                            {pageType === 'NIGHT_EXAM' ? '🌙 ليلة الامتحان' : '🩺 NCLEX'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {exam.questionsCount} أسئلة
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-extrabold text-[#061B3D] leading-snug">
                                                        {exam.title}
                                                    </h3>

                                                    {exam.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-2">
                                                            {exam.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-col gap-1.5 text-xs text-gray-600 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <span className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-blue-600" /> المدة: {exam.duration} دقيقة
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            <Award className="w-4 h-4 text-amber-500" /> نسبة النجاح المطلوب: {exam.passingPercentage}%
                                                        </span>
                                                        {exam.startDate && (
                                                            <span className="flex items-center gap-2 text-gray-500">
                                                                <Calendar className="w-4 h-4 text-slate-400" /> البداية: {exam.startDate} {exam.startTime || ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {exam.statusMessage && (
                                                        <div className="text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-lg text-center">
                                                            {exam.statusMessage}
                                                        </div>
                                                    )}
                                                </div>

                                                {isAvailable ? (
                                                    <Link
                                                        href={`/dashboard/take-exam?id=${exam._id}&code=${encodeURIComponent(accessCode)}`}
                                                        className="w-full bg-gradient-to-r from-[#1E3A8A] to-blue-700 hover:from-blue-900 hover:to-indigo-900 text-white font-extrabold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                                                    >
                                                        <PlayCircle className="w-5 h-5 text-gold" /> ابدأ الامتحان الآن
                                                    </Link>
                                                ) : isComingSoon ? (
                                                    <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3.5 rounded-2xl cursor-not-allowed text-center text-xs">
                                                        قريباً - لم يبدأ موعد الامتحان
                                                    </button>
                                                ) : isEnded ? (
                                                    <button disabled className="w-full bg-red-50 text-red-400 font-bold py-3.5 rounded-2xl cursor-not-allowed text-center text-xs">
                                                        انتهى وقت ممارسة الامتحان
                                                    </button>
                                                ) : (
                                                    <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3.5 rounded-2xl cursor-not-allowed text-center text-xs">
                                                        غير متاح حالياً
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* SECTION B: BOOKING FORM */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">نموذج حجز ومتابعة الجلسات</h3>
                                    <p className="text-xs text-gray-400 mt-1">الرجاء مراجعة البيانات قبل الحفظ</p>
                                </div>
                                <GraduationCap className="w-8 h-8 text-gold" />
                            </div>

                            <form onSubmit={handleBookingSubmit} className="p-6 sm:p-8 space-y-6">
                                {bookingError && (
                                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <span>{bookingError}</span>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-blue-600" />
                                            الاسم بالكامل (ثلاثي/رباعي) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={bookingData.studentName}
                                            onChange={(e) => setBookingData({ ...bookingData, studentName: e.target.value })}
                                            placeholder="أحمد محمد علي"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                            <Hash className="w-4 h-4 text-blue-600" />
                                            الرقم القومي (14 رقم) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={14}
                                            value={bookingData.nationalId}
                                            onChange={(e) => setBookingData({ ...bookingData, nationalId: e.target.value })}
                                            placeholder="29901011234567"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all text-sm font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            رقم الهاتف (واتساب) *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={bookingData.phone}
                                            onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                                            placeholder="01012345678"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all text-sm font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                            <GraduationCap className="w-4 h-4 text-blue-600" />
                                            التخصص الدراسي
                                        </label>
                                        <input
                                            type="text"
                                            value={bookingData.specialization}
                                            onChange={(e) => setBookingData({ ...bookingData, specialization: e.target.value })}
                                            placeholder="تمريض عام / طوارئ / عناية مركزة..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={submittingBooking}
                                        className="w-full py-4 rounded-2xl bg-[#1E3A8A] hover:bg-[#061B3D] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                                    >
                                        {submittingBooking ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                <span>جاري تسجيل الحجز...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                <span>تأكيد وإرسال طلب الحجز</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* STEP 3: BOOKING SUCCESS & WHATSAPP REDIRECT */}
                {step === 'booking_success' && (
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-center p-8 sm:p-12 space-y-6 animate-scaleUp">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>

                        <div>
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                تم التسجيل بنجاح
                            </span>
                            <h2 className="text-3xl font-extrabold text-[#061B3D] mt-2">
                                تهانينا، تم تأكيد حجزك!
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                                تم تسجيل بياناتك بنجاح في قاعدة بيانات المنصة برقم مرجعي للحجز.
                            </p>
                        </div>

                        {bookingResult && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto text-right space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">الاسم:</span>
                                    <span className="font-bold text-[#061B3D]">{bookingResult.studentName}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">الرقم القومي:</span>
                                    <span className="font-mono font-bold text-[#061B3D]">{bookingResult.nationalId}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">كود الدخول:</span>
                                    <span className="font-mono font-bold text-blue-600">{bookingResult.accessCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">الحالة:</span>
                                    <span className="font-bold text-emerald-600">مؤكد ✅</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 max-w-md mx-auto">
                            <button
                                onClick={handleWhatsAppRedirect}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                            >
                                <Send className="w-5 h-5" />
                                <span>إرسال التأكيد عبر الواتساب ومتابعة التعليمات</span>
                            </button>

                            <button
                                onClick={() => setStep('unlocked')}
                                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>العودة لصفحة الامتحانات المتاحة</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
