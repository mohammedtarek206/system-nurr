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
              المنصة المتخصصة الأولى في إعداد وتأهيل الممرضين لاجتياز اختبارات البرومترك. نقدم لك محتوى علمي متكامل، امتحانات محاكية للواقع، وتجربة تعليمية فاخرة تضمن لك النجاح والتفوق.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link href="/login" className="bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold text-lg px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                ابدأ رحلتك الآن
              </Link>
              <Link href="/exams" className="bg-white/10 text-white border border-white/20 font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                تصفح المحاضرات
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
