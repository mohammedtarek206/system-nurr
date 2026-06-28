"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import PrometricExamClient from "@/components/PrometricExamClient";

function TakeExamContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/student/exams/${id}/take`);
        if (!res.ok) {
          setErrorMsg("حدث خطأ أثناء تحميل الامتحان");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.questions.length === 0) {
          setErrorMsg("لا توجد أسئلة مضافة في هذا الامتحان بعد.");
          setLoading(false);
          return;
        }
        setExam(data.exam);
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        setErrorMsg("تعذر الاتصال بالخادم");
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-primary font-bold text-xl animate-pulse">جاري تحضير بيئة الامتحان...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-6">{errorMsg}</h2>
          <button onClick={() => router.push('/dashboard?tab=exams')} className="w-full bg-primary text-white font-bold py-3 rounded-xl">
            العودة للامتحانات
          </button>
        </div>
      </div>
    );
  }

  if (exam && questions.length > 0) {
    return <PrometricExamClient exam={exam} questions={questions} />;
  }

  return null;
}

export default function TakeExam() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="text-primary font-bold text-xl animate-pulse">جاري التحميل...</div></div>}>
      <TakeExamContent />
    </Suspense>
  );
}
