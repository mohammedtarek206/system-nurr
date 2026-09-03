import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#061B3D] text-white py-12 border-t border-white/10 mt-auto dir-rtl text-right">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10 text-center md:text-right">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                            منصة أحمد الأزهري للتأهيل والتدريب المهني
                        </h2>
                        <p className="text-gray-300 text-sm">
                            بوابتك للنجاح واجتياز اختبارات التمريض والـ Prometric & Pearson VUE & NCLEX
                        </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm font-semibold text-gray-300">
                        <Link href="/" className="hover:text-gold transition-colors">الرئيسية</Link>
                        <Link href="/courses" className="hover:text-gold transition-colors">الكورسات</Link>
                        <Link href="/exams" className="hover:text-gold transition-colors">الامتحانات</Link>
                        <Link href="/night-exam" className="hover:text-gold transition-colors">ليلة الامتحان</Link>
                        <Link href="/nclex" className="hover:text-gold transition-colors">NCLEX</Link>
                    </div>
                </div>

                <div className="pt-6 text-center text-xs text-gray-400">
                    جميع الحقوق محفوظة © {new Date().getFullYear()} منصة أحمد الأزهري للتأهيل والتدريب المهني
                </div>
            </div>
        </footer>
    );
}
