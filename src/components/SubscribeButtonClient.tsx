"use client";

import { useState } from "react";
import SubscribeModal from "@/components/SubscribeModal";
import { MessageCircle } from "lucide-react";

export default function SubscribeButtonClient({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-[#061B3D] font-bold py-2.5 px-4 rounded-xl text-center text-sm hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-1"
      >
        <MessageCircle className="w-4 h-4" />
        اشترك الآن
      </button>
      {showModal && (
        <SubscribeModal courseId={courseId} courseName={courseName} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
