"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "499",
      duration: "3 شهور",
      features: [
        "الوصول للمحاضرات الأساسية",
        "ملفات PDF للملخصات",
        "امتحانات جزئية",
        "دعم فني عبر البريد",
      ],
      recommended: false,
    },
    {
      name: "Premium",
      price: "999",
      duration: "6 شهور",
      features: [
        "الوصول لجميع المحاضرات",
        "ملفات PDF والمراجع",
        "امتحانات شاملة ومحاكية",
        "جلسات نقاش لايف",
        "أولوية الدعم الفني",
      ],
      recommended: true,
    },
    {
      name: "Standard",
      price: "749",
      duration: "4 شهور",
      features: [
        "الوصول لمعظم المحاضرات",
        "ملفات PDF",
        "امتحانات شاملة",
        "دعم فني مباشر",
      ],
      recommended: false,
    },
  ];

  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">باقات الاشتراك</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            اختر الباقة المناسبة لك وابدأ رحلة التفوق واجتياز اختبار البرومترك بنجاح
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-3xl bg-white p-8 ${
                plan.recommended
                  ? "border-2 border-gold shadow-[0_0_40px_rgba(212,175,55,0.15)] md:-translate-y-4 md:scale-105 z-10"
                  : "border border-gray-200 shadow-lg"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-gold to-gold-light text-primary-dark font-bold px-4 py-1.5 rounded-full text-sm shadow-md">
                    الأكثر مبيعاً
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-4 ${plan.recommended ? "text-gold" : "text-primary-dark"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-primary-dark">{plan.price}</span>
                  <span className="text-xl font-bold text-gray-400">ريال</span>
                </div>
                <p className="text-gray-500 font-medium">المدة: {plan.duration}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${plan.recommended ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"}`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.recommended
                    ? "bg-gradient-to-r from-gold to-gold-light text-primary-dark hover:shadow-lg hover:-translate-y-1"
                    : "bg-primary/5 text-primary-dark hover:bg-primary hover:text-white"
                }`}
              >
                اشترك الآن
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
