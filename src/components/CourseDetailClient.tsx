"use client";

import { useState, useEffect } from "react";
import SubscribeModal from "@/components/SubscribeModal";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function CourseDetailClient({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("subscribe") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowModal(true)}
          id="subscribe-course-btn"
          className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-[#061B3D] font-bold text-lg px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          اشترك في الكورس
        </button>
        <a
          href="https://wa.me/201016223940"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/10 text-white border border-white/20 font-bold text-lg px-6 py-4 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
        >
          استفسار عبر واتساب
        </a>
      </div>
      {showModal && (
        <SubscribeModal
          courseId={courseId}
          courseName={courseName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
