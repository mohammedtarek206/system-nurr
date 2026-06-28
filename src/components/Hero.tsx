"use client";

import { motion } from "framer-motion";
import { Users, CheckCircle, FileText, Award } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const stats = [
    { id: 1, name: "عدد الطلاب", value: "+5,000", icon: Users },
    { id: 2, name: "عدد الناجحين", value: "+4,800", icon: CheckCircle },
    { id: 3, name: "امتحان تجريبي", value: "+10,000", icon: FileText },
    { id: 4, name: "نسبة النجاح", value: "98%", icon: Award },
  ];

  const handleWhatsApp = () => {
    const phone = "201016223940";
    const message = encodeURIComponent(
      "السلام عليكم، أرغب في الاشتراك في منصة الأزهري للتأهيل والتدريب المهني وأريد معرفة تفاصيل الكورسات والاشتراك."
    );
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(`whatsapp://send?phone=${phone}&text=${message}`, "_blank");
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${message}`, "_blank");
    }
  };

  return (
    <div className="relative bg-primary-dark overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Gradients & Elements */}
      <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/90 to-transparent"></div>
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
        <div className="w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
        <div className="w-[500px] h-[500px] bg-gold/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-right"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gold/30 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
              <span className="text-gold-light text-sm font-semibold tracking-wider">بوابتك للنجاح المهني</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.3] mb-6">
              منصة الأزهري للتأهيل والتدريب لاجتياز اختبارات <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Prometric & Pearson VUE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              المنصة المتخصصة الأولى في إعداد وتأهيل الممرضين لاجتياز اختبارات البرومترك. نقدم لك محتوى علمي متكامل، كورسات متخصصة، وتجربة تعليمية فاخرة تضمن لك النجاح والتفوق.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <button
                onClick={handleWhatsApp}
                id="start-journey-btn"
                className="bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold text-lg px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                ابدأ رحلتك الآن
              </button>
              <Link
                href="/courses"
                id="browse-courses-btn"
                className="bg-white/10 text-white border border-white/20 font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
              >
                الكورسات
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 lg:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-lg border border-gold/20 p-6 rounded-2xl hover:border-gold/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <stat.icon className="w-10 h-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 font-medium">{stat.name}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
