"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, CheckCircle, FileText, ChevronRight, ChevronLeft, AlertCircle, Calculator } from "lucide-react";

function TakeExamContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  const handleCalc = (val: string) => {
    if (val === "=") {
      try { setCalcInput(eval(calcInput).toString()); } catch(e) { setCalcInput("Error"); }
    } else if (val === "C") {
      setCalcInput("");
    } else {
      if (calcInput === "Error") {
        setCalcInput(val);
      } else {
        setCalcInput(prev => prev + val);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchExam = async () => {
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
      setTimeLeft(data.exam.duration * 60);
      setLoading(false);
    };
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (loading || result || isSubmitting || errorMsg) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, result, isSubmitting, errorMsg]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await fetch(`/api/student/exams/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    });
    const data = await res.json();
    setResult(data);
    setIsSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="text-primary font-bold text-xl animate-pulse">جاري تحضير بيئة الامتحان...</div></div>;

  if (errorMsg) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center max-w-md w-full">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-6">{errorMsg}</h2>
        <button onClick={() => router.push('/dashboard?tab=exams')} className="w-full bg-primary text-white font-bold py-3 rounded-xl">العودة للامتحانات</button>
      </div>
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border-t-4 border-primary">
          <CheckCircle className={`w-20 h-20 mx-auto mb-6 ${result.passed ? 'text-green-500' : 'text-red-500'}`} />
          <h1 className="text-3xl font-bold text-primary-dark mb-2">انتهى الامتحان!</h1>
          <p className="text-gray-500 mb-8">{exam.title}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500 mb-1 font-semibold">الدرجة</div>
              <div className="text-3xl font-black text-primary-dark">{result.score} <span className="text-lg text-gray-400">/ {questions.length}</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500 mb-1 font-semibold">النسبة المئوية</div>
              <div className={`text-3xl font-black ${result.passed ? 'text-green-600' : 'text-red-600'}`}>{result.percentage}%</div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl font-bold text-lg mb-8 border ${result.passed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {result.passed ? 'تهانينا! لقد اجتزت الامتحان بنجاح كبير.' : 'للأسف، لم تجتز الامتحان. يجب عليك المذاكرة والمحاولة مرة أخرى.'}
          </div>
          
          <button onClick={() => router.push('/dashboard?tab=results')} className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-4 rounded-xl hover:shadow-lg transition">
            العودة لسجل النتائج
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestionIdx];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary"><FileText className="w-5 h-5"/></div>
          <div>
            <h1 className="font-bold text-primary-dark leading-tight">{exam.title}</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">سؤال {currentQuestionIdx + 1} من {questions.length}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          <Clock className="w-5 h-5" />
          <span className="tracking-wider text-lg">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto max-w-4xl p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gold"></div>
          <h2 className="text-2xl font-bold text-primary-dark mb-8 leading-relaxed">
            {currentQuestionIdx + 1}. {q.text}
          </h2>
          
          <div className="space-y-4">
            {q.options.map((opt: string, idx: number) => {
              const isSelected = answers[q._id] === idx;
              return (
                <label key={idx} className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md transform -translate-y-0.5' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-white' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <input type="radio" name={q._id} className="hidden" checked={isSelected} onChange={() => setAnswers({...answers, [q._id]: idx})} />
                  <span className="text-lg text-gray-700 font-medium">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <button 
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <ChevronRight className="w-5 h-5" /> السابق
          </button>
          
          {currentQuestionIdx === questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20 transition transform hover:-translate-y-0.5">
              <CheckCircle className="w-5 h-5" /> {isSubmitting ? 'جاري التسليم...' : 'إنهاء وتسليم'}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition transform hover:-translate-y-0.5"
            >
              التالي <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>

      {/* Floating Calculator Button */}
      <button 
        onClick={() => setShowCalc(!showCalc)} 
        className="fixed bottom-6 right-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 border-2 border-gray-700"
        title="الآلة الحاسبة"
      >
        <Calculator className="w-6 h-6" />
      </button>

      {/* Calculator Widget */}
      {showCalc && (
        <div className="fixed bottom-24 right-6 bg-gray-900 text-white p-5 rounded-2xl shadow-2xl z-50 w-72 border border-gray-700 font-sans" dir="ltr">
          <div className="bg-gray-800 p-4 rounded-xl mb-4 text-right text-2xl font-mono h-16 overflow-hidden flex items-center justify-end shadow-inner tracking-wider">
            {calcInput || "0"}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalc(btn)} 
                className={`p-3 rounded-xl text-xl font-bold shadow-sm active:scale-95 transition-all ${
                  btn === '=' ? 'bg-primary hover:bg-primary-dark text-white' : 
                  btn === 'C' ? 'bg-red-500 hover:bg-red-600 text-white' : 
                  ['/','*','-','+'].includes(btn) ? 'bg-gray-700 hover:bg-gray-600 text-gold' : 
                  'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TakeExam() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="text-primary font-bold text-xl animate-pulse">جاري التحميل...</div></div>}>
      <TakeExamContent />
    </Suspense>
  );
}
