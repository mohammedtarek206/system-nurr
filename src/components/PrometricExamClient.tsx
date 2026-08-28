"use client";

import { useState, useEffect } from "react";
import { Flag, Calculator, MessageSquare, ChevronLeft, ChevronRight, Settings, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";

type DisplayTheme = 'default' | 'gray' | 'yellow' | 'pink' | 'dark';
type Phase = "landing" | "instructions" | "form" | "exam" | "sectionReview" | "result" | "reviewAnswers";

interface DisplayOption { text: string; originalIndex: number; }
interface ClientQuestion { _id: string; text: string; clinicalCase: string; options: DisplayOption[]; }
interface ReviewQuestion extends ClientQuestion { correctAnswer: number; studentAnswer: number | null; isFlagged: boolean; isCorrect: boolean; }

function getQuestionStatus(answered: boolean, flagged: boolean) {
  if (answered && flagged) return "ANSWERED_FLAGGED";
  if (answered) return "ATTEMPTED";
  if (flagged) return "FLAGGED";
  return "UNATTEMPTED";
}

export default function PrometricExamClient({ exam }: { exam: any }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("landing");
  const [instructionPage, setInstructionPage] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // answers: questionId -> originalIndex selected
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [strikeThroughs, setStrikeThroughs] = useState<Record<string, number[]>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [theme, setTheme] = useState<DisplayTheme>('default');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [resultData, setResultData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError, setStartError] = useState("");
  const [isStarting, setIsStarting] = useState(false);


  // --- Timer ---
  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const id = setInterval(() => {
      setTimeLeft(p => p - 1);
      setTimeSpent(p => p + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // --- Start Exam ---
  const startExam = async () => {
    if (!studentName.trim()) return alert("Please enter your name");
    setIsStarting(true);
    setStartError("");
    try {
      const res = await fetch(`/api/student/exams/${exam._id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName })
      });
      const data = await res.json();
      if (!res.ok) { setStartError(data.message || "Failed to start exam"); setIsStarting(false); return; }

      setAttemptId(data.attempt._id);
      setQuestions(data.questions);

      // Restore saved answers if resuming
      const savedAnswers: Record<string, number | null> = {};
      const savedFlags: Record<string, boolean> = {};
      (data.attempt.answers || []).forEach((a: any) => {
        savedAnswers[a.questionId] = a.selectedOptionOriginalIndex;
      });
      (data.attempt.flaggedQuestions || []).forEach((qId: string) => {
        savedFlags[qId] = true;
      });
      setAnswers(savedAnswers);
      setFlags(savedFlags);
      setStartTime(new Date(data.attempt.startedAt));
      setPhase("exam");
    } catch (e: any) {
      setStartError(e.message || "Network error");
    }
    setIsStarting(false);
  };

  // --- Auto-Save (debounced) ---
  const saveToServer = async (questionId: string, selectedOptionOriginalIndex: number | null, flagged?: boolean) => {
    if (!attemptId) return;
    try {
      await fetch(`/api/student/exams/${exam._id}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, questionId, selectedOptionOriginalIndex, flagged })
      });
    } catch (e) { console.error('[SAVE ERROR]', e); }
  };

  const handleOptionSelect = (originalIdx: number) => {
    const qId = questions[currentQuestionIndex]._id;
    setAnswers(prev => ({ ...prev, [qId]: originalIdx }));
    saveToServer(qId, originalIdx);
  };

  const toggleFlag = () => {
    const qId = questions[currentQuestionIndex]._id;
    const newVal = !flags[qId];
    setFlags(prev => ({ ...prev, [qId]: newVal }));
    saveToServer(qId, answers[qId] ?? null, newVal);
  };

  const handleStrikeThrough = (e: React.MouseEvent, displayIdx: number) => {
    e.preventDefault();
    const qId = questions[currentQuestionIndex]._id;
    const curr = strikeThroughs[qId] || [];
    setStrikeThroughs(prev => ({
      ...prev,
      [qId]: curr.includes(displayIdx) ? curr.filter(i => i !== displayIdx) : [...curr, displayIdx]
    }));
  };

  const handleHighlight = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    try {
      const span = document.createElement('span');
      span.style.backgroundColor = '#ffeb3b';
      sel.getRangeAt(0).surroundContents(span);
      sel.removeAllRanges();
    } catch { }
  };

  const saveComment = () => {
    const qId = questions[currentQuestionIndex]._id;
    setComments(prev => ({ ...prev, [qId]: currentComment }));
    setShowComment(false);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowFinishModal(false);
    try {
      const res = await fetch(`/api/student/exams/${exam._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, timeSpentSeconds: timeSpent })
      });
      const data = await res.json();
      if (data.alreadySubmitted) { setResultData(data); setPhase("result"); return; }
      if (!res.ok) {
        console.error('[SUBMIT FAIL]', data);
        alert(`فشل تقديم الامتحان: ${data.message || 'خطأ غير معروف'}`);
        setIsSubmitting(false);
        return;
      }
      setResultData(data);
      setPhase("result");
    } catch (e: any) {
      console.error('[SUBMIT ERROR]', e);
      alert(`خطأ في الاتصال: ${e.message}`);
    }
    setIsSubmitting(false);
  };

  // --- Themes ---
  const themes: Record<DisplayTheme, string> = {
    default: "bg-[#F0F4F8] text-[#333]",
    gray: "bg-gray-200 text-gray-800",
    yellow: "bg-[#FFFDE7] text-[#424242]",
    pink: "bg-[#FCE4EC] text-[#424242]",
    dark: "bg-[#121212] text-[#E0E0E0]",
  };
  const isDark = theme === 'dark';
  const themeClass = themes[theme];
  const contentBg = isDark ? "bg-[#1E1E1E]" : "bg-white";
  const headerBg = isDark ? "bg-[#2D2D2D] border-gray-700" : "bg-white border-gray-200";
  const sidebarBg = isDark ? "bg-[#252525] border-gray-700" : "bg-gray-50 border-gray-200";
  const footerBg = isDark ? "bg-[#2D2D2D] border-gray-700" : "bg-white border-gray-200";
  const cardBorder = isDark ? "border-gray-600" : "border-gray-300";

  // ==================== PHASES ====================

  if (phase === "landing") return (
    <div className="min-h-screen bg-[#061B3D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-10 text-center shadow-2xl">
        <h1 className="text-4xl font-black text-[#061B3D] mb-2">Prometric Exam Simulator</h1>
        <p className="text-gray-500 mb-8">Best Experience</p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4 text-left">
          <div><span className="text-xs text-gray-500 font-bold uppercase">Exam</span><p className="font-bold text-[#061B3D]">{exam.title}</p></div>
          <div><span className="text-xs text-gray-500 font-bold uppercase">Questions</span><p className="font-bold text-[#061B3D]">{exam.questionsCount || '?'}</p></div>
          <div><span className="text-xs text-gray-500 font-bold uppercase">Duration</span><p className="font-bold text-[#061B3D]">{exam.duration} min</p></div>
          <div><span className="text-xs text-gray-500 font-bold uppercase">Pass</span><p className="font-bold text-green-600 text-lg">{exam.passingScore}%</p></div>
        </div>
        <button onClick={() => { setInstructionPage(1); setPhase("instructions"); }} className="bg-green-600 text-white font-bold text-xl px-12 py-4 rounded-xl hover:bg-green-700 transition shadow-lg">
          Start Your Exam
        </button>
      </div>
    </div>
  );

  if (phase === "instructions") {
    const pages = ["Welcome", "About", "Interface", "Answering", "Highlighting", "Themes", "Flagging", "Comments & Timing"];
    const content: Record<number, string> = {
      1: "Welcome to the Nursing Prometric Exam Simulator. Ensure a quiet environment and stable internet.",
      2: "Multiple-choice questions with one correct answer. No penalty for incorrect answers.",
      3: "Top header: time & progress. Left sidebar: question navigator. Main area: question & options.",
      4: "Click option to select. Click again to change. Right-click to strikethrough an option.",
      5: "Select text then click Highlight to mark in yellow.",
      6: "Click Settings in footer to change theme (Default, Gray, Yellow, Pink, Dark).",
      7: "Click Flag to mark a question for review. Flagged questions show a red flag in sidebar.",
      8: "Use Comment to add notes per question. Timer counts down. Click Finish Exam when ready.",
    };
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full h-[80vh] flex flex-col">
          <div className="bg-[#061B3D] text-white p-4 font-bold text-center">{pages[instructionPage - 1]}</div>
          <div className="flex-1 p-8 overflow-y-auto text-gray-700 text-lg leading-relaxed">
            <p>{content[instructionPage]}</p>
            {instructionPage === 8 && <div className="bg-blue-50 p-6 border-l-4 border-blue-500 mt-8 rounded text-blue-900 font-medium">End of instructions. Enter your name on the next screen.</div>}
          </div>
          <div className="border-t p-4 flex justify-between items-center bg-gray-50">
            <button disabled={instructionPage === 1} onClick={() => setInstructionPage(p => p - 1)} className="px-8 py-3 bg-gray-200 rounded-lg font-bold disabled:opacity-50">Previous</button>
            <span className="font-bold text-gray-500">Page {instructionPage} / 8</span>
            {instructionPage === 8
              ? <button onClick={() => setPhase("form")} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold">Start Examination</button>
              : <button onClick={() => setInstructionPage(p => p + 1)} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold">Next</button>
            }
          </div>
        </div>
      </div>
    );
  }

  if (phase === "form") return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <h2 className="text-2xl font-bold text-[#061B3D] mb-6">Candidate Details</h2>
        <div className="mb-4 text-left">
          <label className="block text-sm font-bold mb-2">Exam Name</label>
          <input disabled value={exam.title} className="w-full px-4 py-2 bg-gray-100 border rounded-lg text-gray-600 font-semibold" />
        </div>
        <div className="mb-6 text-left">
          <label className="block text-sm font-bold mb-2">Student Name *</label>
          <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startExam()}
            placeholder="Enter your full name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
        </div>
        {startError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">{startError}</div>}
        <button onClick={startExam} disabled={isStarting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {isStarting ? "جاري تحميل الامتحان..." : "Start Exam"}
        </button>
      </div>
    </div>
  );

  if (phase === "sectionReview") {
    const attempted = questions.filter(q => answers[q._id] !== undefined && answers[q._id] !== null).length;
    const flagged = questions.filter(q => flags[q._id]).length;
    const unattempted = questions.length - attempted;
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col p-4">
        <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col max-w-5xl mx-auto w-full">
          <div className="bg-[#061B3D] text-white p-4 font-bold flex justify-between items-center">
            <span>Section Review</span><span>{exam.title}</span>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm font-semibold">
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-400 inline-block" /> Attempted ({attempted})</span>
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded border border-gray-400 bg-white inline-block" /> Unattempted ({unattempted})</span>
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-400 inline-block" /> Flagged ({flagged})</span>
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-purple-400 inline-block" /> Answered+Flagged</span>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6 text-center">
              {[['Total', questions.length, 'gray'], ['Attempted', attempted, 'blue'], ['Unattempted', unattempted, 'gray'], ['Flagged', flagged, 'yellow']].map(([label, val, color]) => (
                <div key={label as string} className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
                  <div className={`text-3xl font-bold text-${color}-600`}>{val}</div>
                  <div className={`text-sm font-semibold text-${color}-800`}>{label}</div>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q._id];
                const isFlagged = !!flags[q._id];
                const isAnswered = ans !== undefined && ans !== null;
                const status = getQuestionStatus(isAnswered, isFlagged);
                let cls = "bg-white border-gray-300 text-gray-600";
                if (status === "ATTEMPTED") cls = "bg-blue-100 border-blue-400 text-blue-800";
                if (status === "FLAGGED") cls = "bg-yellow-100 border-yellow-400 text-yellow-800";
                if (status === "ANSWERED_FLAGGED") cls = "bg-purple-100 border-purple-400 text-purple-800";
                return (
                  <button key={q._id} onClick={() => { setCurrentQuestionIndex(idx); setPhase("exam"); }}
                    className={`relative p-3 border-2 rounded font-bold transition flex items-center justify-center ${cls}`}>
                    {isFlagged && <Flag className="w-2.5 h-2.5 text-red-500 absolute top-0.5 right-0.5" />}
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t p-4 flex justify-between items-center bg-gray-50">
            <button onClick={() => setPhase("exam")} className="px-6 py-2 bg-gray-200 rounded font-semibold text-gray-700">Back to Exam</button>
            <button onClick={() => setShowFinishModal(true)} disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Finish Exam"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && resultData) {
    const pct = resultData.percentage ?? 0;
    const passed = resultData.passed ?? (pct >= exam.passingScore);
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
          <div className="bg-[#061B3D] text-white p-6 text-center">
            <h1 className="text-3xl font-black mb-1">Examination Result</h1>
            <p className="opacity-70 text-sm">Prometric Simulator</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 text-base mb-8 border-b pb-8">
              <div><span className="text-gray-500">Candidate:</span> <span className="font-bold">{resultData.studentName}</span></div>
              <div><span className="text-gray-500">Exam:</span> <span className="font-bold">{resultData.examTitle || exam.title}</span></div>
              <div><span className="text-gray-500">Started:</span> <span className="font-bold">{resultData.startedAt ? new Date(resultData.startedAt).toLocaleTimeString() : '-'}</span></div>
              <div><span className="text-gray-500">Submitted:</span> <span className="font-bold">{resultData.submittedAt ? new Date(resultData.submittedAt).toLocaleTimeString() : '-'}</span></div>
              <div><span className="text-gray-500">Time Spent:</span> <span className="font-bold">{formatTime(resultData.timeSpentSeconds || 0)}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-bold">{new Date().toLocaleDateString()}</span></div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 mb-8 border-b pb-8">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={passed ? "#16a34a" : "#dc2626"} strokeWidth="10"
                    strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * pct) / 100} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${passed ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-black ${passed ? 'text-green-600' : 'text-red-600'}`}>{passed ? 'PASSED' : 'FAILED'}</div>
                <p className="text-gray-500 mt-1">Pass required: <strong>{exam.passingScore}%</strong></p>
                <p className="font-bold text-lg mt-1">{resultData.correctAnswers ?? resultData.score} / {resultData.totalQuestions} correct questions</p>
                {resultData.totalPoints !== undefined && (
                  <p className="font-extrabold text-blue-700 text-base mt-0.5">
                    Score: {resultData.earnedPoints ?? resultData.score} / {resultData.totalPoints} total points
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
              {[['Total', resultData.totalQuestions, 'gray'], ['Correct', resultData.correctAnswers ?? resultData.score, 'green'], ['Wrong', resultData.incorrectAnswers ?? resultData.wrongCount, 'red'], ['Omitted', resultData.unansweredCount ?? resultData.unanswered, 'yellow']].map(([l, v, c]) => (
                <div key={l as string} className={`bg-${c}-50 p-4 rounded-xl border border-${c}-100`}>
                  <div className={`text-2xl font-bold text-${c}-600`}>{v}</div>
                  <div className={`text-xs font-bold text-${c}-700 uppercase mt-1`}>{l}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              {resultData.reviewQuestions?.length > 0 && (
                <button onClick={() => { setCurrentQuestionIndex(0); setPhase("reviewAnswers"); }}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                  Review Answers
                </button>
              )}
              <button onClick={() => router.push('/dashboard')} className="bg-[#061B3D] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#1E3A8A] transition">
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "reviewAnswers" && resultData?.reviewQuestions) {
    const rq: ReviewQuestion[] = resultData.reviewQuestions;
    const q = rq[currentQuestionIndex];
    if (!q) return <div>No review data available.</div>;
    const isCorrect = q.isCorrect;
    const unanswered = q.studentAnswer === null || q.studentAnswer === undefined;
    return (
      <div className={`min-h-screen flex flex-col ${themeClass} font-sans select-none`} dir="ltr">
        <header className={`flex p-4 border-b ${headerBg} shadow-sm`}>
          <div className="flex-1 font-bold text-blue-600">REVIEW MODE – READ ONLY</div>
          <div className="font-bold">{unanswered ? "⬜ Unanswered" : isCorrect ? "✅ Correct" : "❌ Wrong"} — Q{currentQuestionIndex + 1}/{rq.length}</div>
          <button onClick={() => setPhase("result")} className="ml-6 text-sm font-bold border border-current px-4 py-1.5 rounded hover:bg-black/5">← Back to Result</button>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className={`w-20 border-r ${sidebarBg} overflow-y-auto py-4 flex flex-col items-center gap-2`}>
            {rq.map((rqItem, idx) => {
              const s = rqItem.studentAnswer; const c = rqItem.correctAnswer;
              let cls = "bg-gray-200 border-gray-300";
              if (s !== null && s === c) cls = "bg-green-100 border-green-400 text-green-800";
              else if (s !== null) cls = "bg-red-100 border-red-400 text-red-800";
              if (currentQuestionIndex === idx) cls += " ring-2 ring-blue-500 scale-105";
              return (
                <button key={idx} onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-12 h-10 relative flex items-center justify-center font-bold border transition-all ${cls}`}>
                  {rqItem.isFlagged && <Flag className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-yellow-600" />}
                  {idx + 1}
                </button>
              );
            })}
          </aside>
          <main className={`flex-1 overflow-y-auto p-6 md:p-10 ${contentBg}`}>
            <div className="max-w-3xl mx-auto">
              {q.clinicalCase && <div className="mb-6 p-4 rounded border-l-4 border-blue-500 bg-blue-50"><h4 className="font-bold mb-2 uppercase text-xs opacity-70">Clinical Scenario</h4><p className="whitespace-pre-line">{q.clinicalCase}</p></div>}
              <div className="font-semibold text-xl whitespace-pre-line mb-8">{q.text}</div>
              <div className="space-y-3">
                {q.options.map((opt, di) => {
                  const origIdx = opt.originalIndex;
                  const isStudAns = q.studentAnswer === origIdx;
                  const isCorAns = q.correctAnswer === origIdx;
                  let style = `border-2 rounded-xl p-4 flex items-start gap-3 ${cardBorder}`;
                  if (isCorAns) style = "border-2 rounded-xl p-4 flex items-start gap-3 border-green-500 bg-green-50 text-green-900 ring-2 ring-green-400";
                  else if (isStudAns && !isCorAns) style = "border-2 rounded-xl p-4 flex items-start gap-3 border-red-500 bg-red-50 text-red-900";
                  return (
                    <div key={di} className={style}>
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold ${isCorAns ? 'bg-green-500 text-white' : isStudAns ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>
                        {isCorAns ? <CheckCircle className="w-5 h-5" /> : isStudAns ? <XCircle className="w-5 h-5" /> : String.fromCharCode(65 + di)}
                      </div>
                      <div className="flex-1 font-medium pt-0.5">{opt.text}</div>
                      {isCorAns && <span className="text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded text-xs">Correct</span>}
                      {isStudAns && !isCorAns && <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">Your Answer</span>}
                    </div>
                  );
                })}
              </div>
              {q.isFlagged && <div className="mt-6 flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded-lg"><Flag className="w-4 h-4" /> This question was flagged for review.</div>}
            </div>
          </main>
        </div>
        <footer className={`p-4 border-t ${footerBg} flex justify-center gap-4`}>
          <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="flex items-center gap-2 px-6 py-3 bg-gray-200 rounded font-bold disabled:opacity-50"><ChevronLeft className="w-5 h-5" /> Previous</button>
          <button disabled={currentQuestionIndex === rq.length - 1} onClick={() => setCurrentQuestionIndex(p => p + 1)} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded font-bold disabled:opacity-50">Next <ChevronRight className="w-5 h-5" /></button>
        </footer>
      </div>
    );
  }

  // ==================== EXAM PHASE ====================
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center">Loading exam...</div>;
  const q = questions[currentQuestionIndex];
  const qId = q._id;
  const isAnswered = answers[qId] !== undefined && answers[qId] !== null;
  const isFlagged = !!flags[qId];
  const status = getQuestionStatus(isAnswered, isFlagged);
  const statusColors: Record<string, string> = {
    UNATTEMPTED: "text-gray-500",
    ATTEMPTED: "text-blue-600",
    FLAGGED: "text-yellow-600",
    ANSWERED_FLAGGED: "text-purple-600",
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClass} font-sans select-none`} dir="ltr">
      {/* Header */}
      <header className={`flex flex-col p-2 px-4 border-b ${headerBg} shadow-sm shrink-0 gap-2`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="font-bold text-lg">PROMETRIC</div>
            <div className="text-sm font-semibold opacity-80 border-l border-current pl-4">
              <div>Exam: <strong>{exam.title}</strong></div>
              <div>Candidate: <strong>{studentName}</strong></div>
            </div>
          </div>
          <div className="text-sm font-bold opacity-80 flex gap-6">
            <span>Q: {currentQuestionIndex + 1}/{questions.length}</span>
            <span className={statusColors[status]}>{status.replace('_', ' + ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono font-bold text-lg px-3 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-black/5'}`}>
              <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
            <button onClick={() => setPhase("sectionReview")} className="text-sm font-bold border border-current px-4 py-1.5 rounded hover:bg-black/5">
              Finish Section
            </button>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(questions.filter(qq => answers[qq._id] !== undefined && answers[qq._id] !== null).length / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-20 md:w-24 border-r ${sidebarBg} overflow-y-auto shrink-0 py-4 flex flex-col items-center gap-2`}>
          {questions.map((qq, idx) => {
            const a = answers[qq._id]; const f = !!flags[qq._id];
            const isAns = a !== undefined && a !== null;
            const st = getQuestionStatus(isAns, f);
            let cls = "bg-white border-gray-300 text-gray-600";
            if (idx === currentQuestionIndex) cls = "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-400";
            else if (st === "ANSWERED_FLAGGED") cls = "bg-purple-100 border-purple-400 text-purple-800";
            else if (st === "ATTEMPTED") cls = "bg-blue-100 border-blue-400 text-blue-800";
            else if (st === "FLAGGED") cls = "bg-yellow-100 border-yellow-400 text-yellow-800";
            return (
              <button key={qq._id} onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-12 h-10 flex items-center justify-center font-bold border-2 relative transition-all ${cls}`}>
                {f && <Flag className={`w-2.5 h-2.5 absolute top-0.5 right-0.5 ${idx === currentQuestionIndex ? 'text-white' : 'text-red-500'}`} />}
                {idx + 1}
              </button>
            );
          })}
          {/* Legend */}
          <div className="mt-4 px-2 text-xs space-y-1 text-center opacity-70">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-400 rounded-sm inline-block" /><span>Done</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-sm inline-block" /><span>Flag</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 border border-purple-400 rounded-sm inline-block" /><span>Both</span></div>
          </div>
        </aside>

        {/* Main */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${contentBg}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
              <div className="font-bold text-xl">Question {currentQuestionIndex + 1} of {questions.length}</div>
              <div className="text-xs font-semibold opacity-50">ID: {qId.slice(-6)}</div>
            </div>
            <div className="text-lg leading-relaxed mb-8 select-text cursor-text" id="selectable-area">
              {q.clinicalCase && (
                <div className={`mb-6 p-4 rounded border-l-4 border-blue-500 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                  <h4 className="font-bold mb-2 uppercase text-sm opacity-70">Clinical Scenario</h4>
                  <p className="whitespace-pre-line">{q.clinicalCase}</p>
                </div>
              )}
              <div className="font-semibold whitespace-pre-line">{q.text}</div>
            </div>
            <div className="space-y-3">
              {q.options.map((opt, displayIdx) => {
                const origIdx = opt.originalIndex;
                const isSelected = answers[qId] === origIdx;
                const isStruck = (strikeThroughs[qId] || []).includes(displayIdx);
                return (
                  <div key={displayIdx}
                    onContextMenu={e => handleStrikeThrough(e, displayIdx)}
                    onClick={() => !isStruck && handleOptionSelect(origIdx)}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : `${cardBorder} hover:bg-black/5`}
                      ${isStruck ? 'opacity-40 line-through cursor-not-allowed bg-gray-100' : ''}
                      ${isDark && isSelected ? 'bg-blue-900/30' : ''}
                    `}
                  >
                    <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center font-bold text-sm mt-0.5 ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-current'}`}>
                      {isSelected ? <div className="w-3 h-3 bg-blue-600 rounded-full" /> : String.fromCharCode(65 + displayIdx)}
                    </div>
                    <div className="flex-1 font-medium select-text">{opt.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className={`p-3 border-t ${footerBg} shrink-0 flex flex-wrap justify-between items-center gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
        <div className="flex gap-2">
          <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /> Previous</button>
          <button disabled={currentQuestionIndex === questions.length - 1} onClick={() => setCurrentQuestionIndex(p => p + 1)} className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50">Next <ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => setShowDisplaySettings(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold text-sm"><Settings className="w-4 h-4" /> Settings</button>
          <button onClick={() => setShowCalculator(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold text-sm"><Calculator className="w-4 h-4" /> Calculator</button>
          <button onClick={() => { setCurrentComment(comments[qId] || ""); setShowComment(true); }} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold text-sm"><MessageSquare className="w-4 h-4" /> Comment</button>
          <button onClick={handleHighlight} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold text-sm"><span className="w-3 h-3 bg-yellow-400 border border-yellow-600 rounded-sm inline-block" /> Highlight</button>
          <button onClick={toggleFlag} className={`flex items-center gap-2 px-3 py-2 rounded font-semibold text-sm border ${isFlagged ? 'bg-red-50 text-red-600 border-red-200' : 'hover:bg-black/5 border-transparent'}`}>
            <Flag className="w-4 h-4" /> {isFlagged ? "Unflag" : "Flag For Review"}
          </button>
        </div>
        <div>
          <button onClick={() => setPhase("sectionReview")} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Finish Exam</button>
        </div>
      </footer>

      {/* Finish Confirmation Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <h2 className="text-2xl font-black text-[#061B3D] mb-3">Finish Exam?</h2>
            <p className="text-gray-600 mb-2">Are you sure you want to submit your exam?</p>
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl mb-6">
              <div><span className="text-gray-500">Answered:</span> <strong>{questions.filter(qq => answers[qq._id] !== undefined && answers[qq._id] !== null).length}</strong></div>
              <div><span className="text-gray-500">Unanswered:</span> <strong>{questions.filter(qq => answers[qq._id] === undefined || answers[qq._id] === null).length}</strong></div>
              <div><span className="text-gray-500">Flagged:</span> <strong>{questions.filter(qq => flags[qq._id]).length}</strong></div>
              <div><span className="text-gray-500">Total:</span> <strong>{questions.length}</strong></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishModal(false)} className="flex-1 px-6 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator */}
      {showCalculator && (
        <div className="fixed top-20 right-6 bg-white border shadow-2xl rounded-lg w-64 z-50 text-black overflow-hidden">
          <div className="bg-gray-100 p-2 border-b flex justify-between items-center"><span className="font-bold text-sm">Calculator</span><button onClick={() => setShowCalculator(false)}><X className="w-4 h-4" /></button></div>
          <div className="p-3">
            <input readOnly value={calcInput} className="w-full bg-gray-100 border text-right p-2 mb-3 text-lg font-mono rounded" />
            <div className="grid grid-cols-4 gap-1">
              {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '.', '+'].map(b => (
                <button key={b} onClick={() => b === 'C' ? setCalcInput('') : setCalcInput(p => p + b)} className="bg-gray-200 hover:bg-gray-300 p-2 rounded font-bold">{b}</button>
              ))}
              <button onClick={() => { try { setCalcInput(String(eval(calcInput))); } catch { setCalcInput('Error'); } }} className="col-span-4 bg-blue-500 text-white hover:bg-blue-600 p-2 rounded font-bold mt-1">=</button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showComment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-black overflow-hidden">
            <div className="bg-[#061B3D] text-white p-3 font-bold flex justify-between items-center">
              <span>Comment – Q{currentQuestionIndex + 1}</span><button onClick={() => setShowComment(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <textarea rows={5} value={currentComment} onChange={e => setCurrentComment(e.target.value)} className="w-full border rounded p-2 focus:outline-none focus:border-blue-500" placeholder="Type your comment..." />
            </div>
            <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowComment(false)} className="px-4 py-2 border rounded font-semibold">Cancel</button>
              <button onClick={saveComment} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showDisplaySettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm text-black overflow-hidden">
            <div className="bg-[#061B3D] text-white p-3 font-bold flex justify-between items-center">
              <span>Display Settings</span><button onClick={() => setShowDisplaySettings(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2">
              {(['default', 'gray', 'yellow', 'pink', 'dark'] as DisplayTheme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)} className={`w-full text-left px-4 py-3 border rounded font-semibold flex justify-between ${theme === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                  <span className="capitalize">{t} Theme</span>
                  {theme === t && <CheckCircle className="w-5 h-5" />}
                </button>
              ))}
            </div>
            <div className="p-3 border-t bg-gray-50 text-center">
              <button onClick={() => setShowDisplaySettings(false)} className="px-8 py-2 bg-blue-600 text-white rounded font-bold">Apply & Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
