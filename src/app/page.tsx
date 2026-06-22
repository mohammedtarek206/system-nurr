import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CourseSections from "@/components/CourseSections";

export default function Home() {
  return (
    <>
      <Hero />
      <CourseSections />
      
      {/* Footer minimal */}
      <footer className="bg-primary-dark py-12 text-center border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">منصة الأزهري للتأهيل والتدريب المهني</h2>
          <p className="text-gray-400 mb-8">بوابتك للنجاح في اختبارات Prometric & Pearson VUE</p>
          <div className="w-full h-px bg-white/10 mb-8"></div>
          <p className="text-gray-500">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
