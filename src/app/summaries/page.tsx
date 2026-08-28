"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    Lock, BookOpen, Search, Eye, FileText,
    X, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight,
    LogOut, AlertCircle, Loader2, FileImage, Tag, Calendar
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Summary {
    _id: string;
    title: string;
    description: string;
    fileType: "image" | "pdf";
    status: string;
    order: number;
    views: number;
    coverImage?: string;
    createdAt: string;
    categoryId?: { _id: string; name: string; arName: string };
    targetSpecializations: string[];
    targetType: "all" | "specific";
}

interface Category {
    _id: string;
    name: string;
    arName: string;
}

// ─── Content Protection Hook ─────────────────────────────────────────────────
function useContentProtection(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;

        const prevent = (e: Event) => e.preventDefault();
        const preventKeys = (e: KeyboardEvent) => {
            // Prevent Ctrl+S, Ctrl+P, Ctrl+U, F12, Ctrl+Shift+I/J/C
            if (
                (e.ctrlKey && ['s', 'p', 'u'].includes(e.key.toLowerCase())) ||
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('contextmenu', prevent);
        document.addEventListener('dragstart', prevent);
        document.addEventListener('selectstart', prevent);
        document.addEventListener('keydown', preventKeys as EventListener);

        const style = document.createElement('style');
        style.id = 'content-protection-style';
        style.textContent = `
      .protected-content { user-select: none; -webkit-user-select: none; }
      .protected-content img { pointer-events: none; }
      @media print { body { display: none !important; } }
    `;
        document.head.appendChild(style);

        return () => {
            document.removeEventListener('contextmenu', prevent);
            document.removeEventListener('dragstart', prevent);
            document.removeEventListener('selectstart', prevent);
            document.removeEventListener('keydown', preventKeys as EventListener);
            document.getElementById('content-protection-style')?.remove();
        };
    }, [enabled]);
}

// ─── Watermark Component ─────────────────────────────────────────────────────
function Watermark({ userName, platformName = "منصة الأزهري" }: { userName?: string; platformName?: string }) {
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset({
                x: Math.random() * 20 - 10,
                y: Math.random() * 20 - 10,
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const text = userName ? `${userName}\n${platformName}` : platformName;

    const marks: React.ReactNode[] = [];
    for (let ri = 0; ri < 8; ri++) {
        for (let ci = 0; ci < 4; ci++) {
            marks.push(
                <div
                    key={`wm-${ri}-${ci}`}
                    className="absolute text-white/20 font-bold whitespace-pre-line text-center leading-tight pointer-events-none"
                    style={{
                        top: `${ri * 130 + 40}px`,
                        left: `${ci * 260 + 30}px`,
                        transform: 'rotate(-35deg)',
                        fontSize: '13px',
                        lineHeight: '1.3',
                    }}
                >
                    {text}
                </div>
            );
        }
    }
    return (
        <div
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-20"
            aria-hidden="true"
            style={{ transition: 'transform 3s ease-in-out', transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
            {marks}
        </div>
    );
}

// ─── Access Code Gate ─────────────────────────────────────────────────────────
function AccessGate({ onSuccess }: { onSuccess: () => void }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/summaries/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (res.ok) {
                onSuccess();
            } else {
                setAttempts(a => a + 1);
                setError(data.message || "كود غير صحيح");
            }
        } catch {
            setError("حدث خطأ في الاتصال. حاول مجدداً.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#061B3D] via-[#0a2a5e] to-[#061B3D] flex items-center justify-center p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#D4AF37]/10 rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#f0cc6a] rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-[#D4AF37]/30">
                        <Lock className="w-12 h-12 text-[#061B3D]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">منطقة الملخصات</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        هذه الصفحة مخصصة للمستخدمين المصرح لهم فقط.<br />
                        يرجى إدخال كود الدخول للمتابعة.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-white/80 text-sm font-semibold mb-2 text-right">
                                كود الدخول (Access Code)
                            </label>
                            <input
                                id="access-code-input"
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="أدخل الكود هنا..."
                                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 text-center text-xl font-bold tracking-widest outline-none focus:border-[#D4AF37] focus:bg-white/15 transition-all duration-200"
                                disabled={loading}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            id="access-submit-btn"
                            className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#f0cc6a] text-[#061B3D] font-bold text-lg rounded-2xl hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> جاري التحقق...</>
                            ) : (
                                <><Lock className="w-5 h-5" /> دخول</>
                            )}
                        </button>
                    </form>

                    {attempts >= 3 && (
                        <p className="text-white/40 text-xs mt-5 text-center">
                            بعد 5 محاولات خاطئة سيتم تأمين الوصول مؤقتاً.
                        </p>
                    )}
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    منصة الأزهري للتأهيل والتدريب المهني
                </p>
            </div>
        </div>
    );
}

// ─── Image Viewer ─────────────────────────────────────────────────────────────
function ImageViewer({
    url, title, userName, onClose, summaries, currentIndex, onNavigate
}: {
    url: string; title: string; userName?: string;
    onClose: () => void; summaries?: Summary[]; currentIndex?: number;
    onNavigate?: (direction: 'prev' | 'next') => void;
}) {
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const zoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
    const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
    const fitScreen = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
            if (e.key === 'ArrowLeft' && onNavigate) onNavigate('prev');
            if (e.key === 'ArrowRight' && onNavigate) onNavigate('next');
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, onNavigate]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col protected-content" dir="ltr">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 flex-shrink-0" dir="rtl">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold text-sm truncate max-w-[200px]">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={zoomOut} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition" title="تصغير">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-white text-sm font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={zoomIn} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition" title="تكبير">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={fitScreen} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition" title="ملاءمة الشاشة">
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Image Area */}
            <div
                className="flex-1 overflow-hidden relative flex items-center justify-center"
                onMouseMove={e => {
                    if (!isDragging) return;
                    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
            >
                <Watermark userName={userName} />

                {onNavigate && (
                    <>
                        <button
                            onClick={() => onNavigate('prev')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition backdrop-blur-sm border border-white/10"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => onNavigate('next')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition backdrop-blur-sm border border-white/10"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    }}
                    onMouseDown={e => {
                        if (zoom > 1) {
                            setIsDragging(true);
                            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                        }
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={url}
                        alt={title}
                        className="max-h-[80vh] max-w-[90vw] object-contain select-none"
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                    />
                </div>
            </div>

            {/* Counter */}
            {summaries && currentIndex !== undefined && (
                <div className="text-center py-2 text-white/50 text-xs border-t border-white/10">
                    {currentIndex + 1} / {summaries.length}
                </div>
            )}
        </div>
    );
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
function PdfViewer({ url, title, userName, onClose }: {
    url: string; title: string; userName?: string; onClose: () => void;
}) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col protected-content">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#061B3D] border-b border-[#D4AF37]/20 flex-shrink-0" dir="rtl">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#D4AF37]" />
                        <span className="text-white font-bold text-sm truncate max-w-[250px]">{title}</span>
                    </div>
                </div>
                <span className="text-[#D4AF37] text-xs font-semibold border border-[#D4AF37]/30 px-3 py-1 rounded-full">
                    منصة الأزهري - محمي
                </span>
            </div>

            {/* PDF + Watermark */}
            <div className="flex-1 relative overflow-hidden">
                <Watermark userName={userName} />
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={title}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    referrerPolicy="no-referrer"
                />
                {/* Overlay to prevent right-click on iframe */}
                <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    onContextMenu={e => e.preventDefault()}
                />
            </div>
        </div>
    );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ summary, onClick }: { summary: Summary; onClick: () => void }) {
    const isImage = summary.fileType === 'image';

    return (
        <div
            className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/30 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
            onClick={onClick}
        >
            {/* File Type Banner */}
            <div className={`h-2 ${isImage ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]'}`} />

            <div className="p-6">
                {/* Icon + Type */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isImage ? 'bg-purple-50' : 'bg-blue-50'}`}>
                        {isImage
                            ? <FileImage className="w-7 h-7 text-purple-600" />
                            : <FileText className="w-7 h-7 text-blue-700" />
                        }
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isImage ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {isImage ? 'صورة' : 'PDF'}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[#061B3D] font-bold text-lg mb-2 leading-snug group-hover:text-[#1E3A8A] transition-colors line-clamp-2">
                    {summary.title}
                </h3>

                {/* Description */}
                {summary.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{summary.description}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 flex-wrap">
                    {summary.categoryId && (
                        <span className="flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#b8922a] px-2.5 py-1 rounded-full font-semibold">
                            <Tag className="w-3 h-3" />
                            {summary.categoryId.arName}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(summary.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                    {summary.views > 0 && (
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3" />
                            {summary.views}
                        </span>
                    )}
                </div>

                {/* View Button */}
                <button
                    id={`view-summary-${summary._id}`}
                    className="w-full py-3 bg-gradient-to-r from-[#061B3D] to-[#1E3A8A] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 group-hover:from-[#1E3A8A] group-hover:to-[#2563EB]"
                >
                    <Eye className="w-4 h-4" />
                    عرض الملخص
                </button>
            </div>
        </div>
    );
}

// ─── Main Summaries Page ──────────────────────────────────────────────────────
export default function SummariesPage() {
    const { user } = useAuth();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null = checking
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterType, setFilterType] = useState("");
    const [openSummary, setOpenSummary] = useState<any>(null);
    const [loadingViewer, setLoadingViewer] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useContentProtection(hasAccess === true);

    // ── Check existing session ────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/summaries/session")
            .then(r => r.json())
            .then(data => setHasAccess(!!data.valid))
            .catch(() => setHasAccess(false));
    }, []);

    // ── Fetch summaries once access granted ──────────────────────────────────
    const fetchSummaries = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterCategory) params.set('category', filterCategory);
        if (filterType) params.set('fileType', filterType);

        const res = await fetch(`/api/summaries/list?${params}`);
        if (res.status === 401) { setHasAccess(false); return; }
        const data = await res.json();
        setSummaries(data);
        setLoading(false);
    }, [search, filterCategory, filterType]);

    useEffect(() => {
        if (hasAccess) fetchSummaries();
    }, [hasAccess, fetchSummaries]);

    // ── Fetch categories ──────────────────────────────────────────────────────
    useEffect(() => {
        if (hasAccess) {
            fetch("/api/admin/summary-categories")
                .then(r => r.json())
                .then(setCategories)
                .catch(() => { });
        }
    }, [hasAccess]);

    // ── Open summary viewer ───────────────────────────────────────────────────
    const openViewer = async (summaryId: string, index: number) => {
        setLoadingViewer(true);
        setCurrentImageIndex(index);
        try {
            const res = await fetch(`/api/summaries/view/${summaryId}`);
            if (res.status === 401) { setHasAccess(false); return; }
            const data = await res.json();
            setOpenSummary(data);
        } catch {
            alert('تعذر تحميل الملخص. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoadingViewer(false);
        }
    };

    const navigateImage = (direction: 'prev' | 'next') => {
        const imageSummaries = summaries.filter(s => s.fileType === 'image');
        const newIndex = direction === 'prev'
            ? (currentImageIndex - 1 + imageSummaries.length) % imageSummaries.length
            : (currentImageIndex + 1) % imageSummaries.length;
        setCurrentImageIndex(newIndex);
        openViewer(imageSummaries[newIndex]._id, newIndex);
    };

    const handleLogout = async () => {
        await fetch('/api/summaries/session', { method: 'DELETE' });
        setHasAccess(false);
        setSummaries([]);
    };

    // ── Initial loading spinner ───────────────────────────────────────────────
    if (hasAccess === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#061B3D]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">جاري التحقق من الجلسة...</p>
                </div>
            </div>
        );
    }

    // ── Access Gate ───────────────────────────────────────────────────────────
    if (!hasAccess) {
        return <AccessGate onSuccess={() => setHasAccess(true)} />;
    }

    // ── Viewer ────────────────────────────────────────────────────────────────
    if (openSummary) {
        const userName = user?.name;
        if (openSummary.fileType === 'image') {
            return (
                <ImageViewer
                    url={openSummary.viewerUrl}
                    title={openSummary.title}
                    userName={userName}
                    onClose={() => setOpenSummary(null)}
                    summaries={summaries.filter(s => s.fileType === 'image')}
                    currentIndex={currentImageIndex}
                    onNavigate={navigateImage}
                />
            );
        }
        return (
            <PdfViewer
                url={openSummary.viewerUrl}
                title={openSummary.title}
                userName={userName}
                onClose={() => setOpenSummary(null)}
            />
        );
    }

    // ── Main Content ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F8FAFC] protected-content" dir="rtl">
            {loadingViewer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                        <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin mx-auto mb-3" />
                        <p className="text-[#061B3D] font-bold">جاري تحميل الملخص...</p>
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <div className="bg-gradient-to-br from-[#061B3D] via-[#0d2b5e] to-[#061B3D] py-16 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <span className="text-[#D4AF37] font-semibold text-sm">منطقة الملخصات</span>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">الملخصات العلمية</h1>
                            <p className="text-white/60">مواد تعليمية مختارة ومحمية لأعضاء المنصة</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {user && (
                                <span className="text-white/70 text-sm border border-white/20 px-4 py-2 rounded-xl bg-white/5">
                                    أهلاً، {user.name}
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl transition text-sm font-semibold"
                            >
                                <LogOut className="w-4 h-4" />
                                خروج
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث عن ملخص..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A] bg-gray-50 transition"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A] bg-gray-50 transition min-w-[160px]"
                    >
                        <option value="">جميع الفئات</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.arName}</option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1E3A8A] bg-gray-50 transition min-w-[130px]"
                    >
                        <option value="">جميع الأنواع</option>
                        <option value="image">صورة</option>
                        <option value="pdf">PDF</option>
                    </select>
                </div>
            </div>

            {/* Summaries Grid */}
            <div className="container mx-auto px-4 pb-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-xl mb-2">لا توجد ملخصات متاحة حالياً</p>
                        <p className="text-gray-400 text-sm">جرب تغيير معايير البحث أو تواصل مع الإدارة.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-[#061B3D] font-semibold mb-5 text-sm">
                            تم العثور على <span className="text-[#1E3A8A] font-bold">{summaries.length}</span> ملخص
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {summaries.map((summary, index) => (
                                <SummaryCard
                                    key={summary._id}
                                    summary={summary}
                                    onClick={() => openViewer(summary._id, index)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
