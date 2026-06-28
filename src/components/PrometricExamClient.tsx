"use client";

import { useState, useEffect, useRef } from "react";
import { Flag, Calculator, MessageSquare, ChevronLeft, ChevronRight, Settings, CheckCircle, XCircle, Search, Clock, LayoutGrid, X } from "lucide-react";
import { useRouter } from "next/navigation";

type DisplayTheme = 'default' | 'gray' | 'yellow' | 'pink' | 'dark';

export default function PrometricExamClient({ exam, questions }: { exam: any, questions: any[] }) {
  const router = useRouter();
  
  // Phases: landing -> instructions -> form -> exam -> review -> result
  const [phase, setPhase] = useState<"landing" | "instructions" | "form" | "exam" | "review" | "result">("landing");
  
  // Instruction Pagination
  const [instructionPage, setInstructionPage] = useState(1);
  const totalInstructionPages = 8;
  
  // Student Form
  const [studentName, setStudentName] = useState("");
  
  // Exam State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [strikeThroughs, setStrikeThroughs] = useState<Record<number, number[]>>({}); // questionIndex -> array of option indices
  
  // Modals
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [theme, setTheme] = useState<DisplayTheme>('default');
  
  // Time Tracking
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Results
  const [resultData, setResultData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    if (phase === "exam" && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timerId);
    } else if (phase === "exam" && timeLeft === 0) {
      handleFinishExam();
    }
  }, [phase, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    if (!studentName.trim()) {
      alert("Please enter your name");
      return;
    }
    setStartTime(new Date());
    setPhase("exam");
  };

  const handleOptionSelect = (optIndex: number) => {
    setAnswers({ ...answers, [currentQuestionIndex]: optIndex });
  };

  const toggleFlag = () => {
    setFlags({ ...flags, [currentQuestionIndex]: !flags[currentQuestionIndex] });
  };

  const handleStrikeThrough = (e: React.MouseEvent, optIndex: number) => {
    e.preventDefault(); // Prevent context menu
    const currentStrikes = strikeThroughs[currentQuestionIndex] || [];
    if (currentStrikes.includes(optIndex)) {
      setStrikeThroughs({ ...strikeThroughs, [currentQuestionIndex]: currentStrikes.filter(i => i !== optIndex) });
    } else {
      setStrikeThroughs({ ...strikeThroughs, [currentQuestionIndex]: [...currentStrikes, optIndex] });
    }
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    try {
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      
      const span = document.createElement('span');
      span.style.backgroundColor = '#ffeb3b';
      span.style.color = '#000';
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      console.log("Highlighting complex elements not fully supported here");
    }
  };

  const saveComment = () => {
    setComments({ ...comments, [currentQuestionIndex]: currentComment });
    setShowComment(false);
  };

  const handleFinishExam = () => {
    setPhase("review");
  };

  const submitFinalResult = async () => {
    setIsSubmitting(true);
    
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    
    const processedAnswers = questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctAnswer;
      
      if (selected === undefined) {
        unanswered++;
      } else if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
      
      return {
        questionId: q._id,
        selectedOption: selected !== undefined ? selected : null,
        isCorrect,
        isFlagged: !!flags[idx]
      };
    });
    
    const formattedComments = Object.keys(comments).map(idx => ({
      questionId: questions[Number(idx)]._id,
      text: comments[Number(idx)]
    }));

    const score = correct;
    const percentage = Math.round((correct / questions.length) * 100);

    const payload = {
      studentName,
      examId: exam._id,
      score,
      percentage,
      totalQuestions: questions.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unanswered,
      flagged: Object.keys(flags).filter(k => flags[Number(k)]).length,
      timeSpentSeconds: timeSpent,
      startTime: startTime || new Date(),
      endTime: new Date(),
      answers: processedAnswers,
      comments: formattedComments
    };

    try {
      await fetch('/api/student/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setResultData(payload);
      setPhase("result");
    } catch (error) {
      alert("Failed to submit exam. Please try again.");
    }
    setIsSubmitting(false);
  };

  // --- Themes ---
  const themeClasses = {
    default: "bg-[#F0F4F8] text-[#333333]",
    gray: "bg-gray-200 text-gray-800",
    yellow: "bg-[#FFFDE7] text-[#424242]",
    pink: "bg-[#FCE4EC] text-[#424242]",
    dark: "bg-[#121212] text-[#E0E0E0]",
  };

  const themeClass = themeClasses[theme];
  const isDark = theme === 'dark';
  
  const contentBg = isDark ? "bg-[#1E1E1E]" : "bg-white";
  const headerBg = isDark ? "bg-[#2D2D2D] border-gray-700" : "bg-white border-gray-200";
  const sidebarBg = isDark ? "bg-[#252525] border-gray-700" : "bg-gray-50 border-gray-200";
  const footerBg = isDark ? "bg-[#2D2D2D] border-gray-700" : "bg-white border-gray-200";
  const cardBorder = isDark ? "border-gray-600" : "border-gray-300";

  // Render Methods
  if (phase === "landing") {
    return (
      <div className="min-h-screen bg-[#061B3D] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-10 text-center shadow-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-[#061B3D] mb-2">Prometric Exam Simulator</h1>
            <p className="text-gray-500 text-lg">Best Experience</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex flex-col items-center">
            <LayoutGrid className="w-12 h-12 text-blue-500 mb-4" />
            <p className="text-blue-800 font-medium mb-6">Use a computer for optimal experience.</p>
            
            <div className="w-full bg-white rounded-lg p-4 border border-blue-100 grid grid-cols-2 gap-4 text-left">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Exam Name</span>
                <span className="font-bold text-[#061B3D] text-sm">{exam.title}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Total Questions</span>
                <span className="font-bold text-[#061B3D] text-sm">{questions.length} Questions</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Duration</span>
                <span className="font-bold text-[#061B3D] text-sm">{exam.duration} Minutes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Sections</span>
                <span className="font-bold text-[#061B3D] text-sm">1 Section</span>
              </div>
              <div className="flex flex-col col-span-2 border-t pt-3 mt-1">
                <span className="text-xs text-gray-500 font-bold uppercase">Passing Score</span>
                <span className="font-bold text-green-600 text-lg">{exam.passingScore}%</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { setInstructionPage(1); setPhase("instructions"); }}
            className="bg-green-600 text-white font-bold text-xl px-12 py-4 rounded-xl hover:bg-green-700 transition shadow-lg transform hover:scale-105"
          >
            Start Your Exam
          </button>
        </div>
      </div>
    );
  }

  if (phase === "instructions") {
    const pageTitles = [
      "Welcome to SCFHS Examination",
      "About the Examination",
      "Interface Overview",
      "Answering Questions",
      "Highlighting Text",
      "Changing Themes & Styles",
      "Filtering & Flagging Questions",
      "Comments, Timing & Breaks"
    ];

    const getPageContent = (page: number) => {
      switch (page) {
        case 1: return <p>Welcome to the Al-Azhari Prometric Exam Simulator. This simulator is designed to replicate the exact environment of official licensing examinations. Please ensure you are in a quiet environment and have a stable internet connection before proceeding.</p>;
        case 2: return <p>This examination consists of multiple-choice questions designed to assess your professional knowledge. Each question has four possible options with only one correct answer. No points are deducted for incorrect answers.</p>;
        case 3: return <p>The interface is divided into three main areas:<br/>- <b>Top Header:</b> Displays candidate details, remaining time, and exam progress.<br/>- <b>Left Navigation:</b> Allows you to jump directly to any question.<br/>- <b>Main Content:</b> Displays the question, clinical scenario, and answer options.</p>;
        case 4: return <p>To answer a question, simply click on the desired option. Your answer will be automatically saved. To change your answer, click on a different option. You can right-click on any option to strike it through if you want to eliminate it.</p>;
        case 5: return <p>You can highlight important parts of the question text. To do this, select the text using your mouse, then click the "Highlight" button located above the question. The selected text will be marked in yellow.</p>;
        case 6: return <p>You can customize the appearance of the exam simulator for optimal comfort. Click the "Settings" button in the footer to choose between Default, Gray, Yellow, Pink, or Dark Mode themes. Your preference will be saved for the duration of the exam.</p>;
        case 7: return <p>If you are unsure about a question, you can click the "Flag" button in the footer. A red flag icon will appear next to the question number in the left sidebar, reminding you to review it later before finalizing the section.</p>;
        case 8: return <p>You can leave a comment on any specific question by clicking the "Comment" button. Keep an eye on the countdown timer in the top right. Once you have reviewed all questions, click "Finish Section" to submit your exam.</p>;
        default: return null;
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full h-[80vh] flex flex-col">
          <div className="bg-[#061B3D] text-white p-4 font-bold text-center">
            {pageTitles[instructionPage - 1]}
          </div>
          <div className="flex-1 p-8 overflow-y-auto prose max-w-none text-gray-700 text-lg leading-relaxed">
            {getPageContent(instructionPage)}
            
            {instructionPage === totalInstructionPages && (
              <div className="bg-blue-50 p-6 border-l-4 border-blue-500 mt-8 rounded text-blue-900 font-medium">
                You have reached the end of the instructions. Please verify your details on the next screen before starting the examination.
              </div>
            )}
          </div>
          <div className="border-t p-4 flex justify-between items-center bg-gray-50">
            <button 
              disabled={instructionPage === 1}
              onClick={() => setInstructionPage(p => p - 1)}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span className="font-bold text-gray-500">Page {instructionPage} of {totalInstructionPages}</span>
            {instructionPage === totalInstructionPages ? (
              <button onClick={() => setPhase("form")} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg transition">
                Start Examination
              </button>
            ) : (
              <button onClick={() => setInstructionPage(p => p + 1)} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-[#061B3D] mb-6">Candidate Details</h2>
          <div className="mb-4 text-left">
            <label className="block text-sm font-bold text-gray-700 mb-2">Exam Name</label>
            <input type="text" disabled value={exam.title} className="w-full px-4 py-2 bg-gray-100 border rounded-lg text-gray-600 font-semibold" />
          </div>
          <div className="mb-8 text-left">
            <label className="block text-sm font-bold text-gray-700 mb-2">Student Name *</label>
            <input 
              type="text" 
              value={studentName} 
              onChange={e => setStudentName(e.target.value)} 
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
            />
          </div>
          <button onClick={startExam} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    const answeredCount = Object.keys(answers).length;
    const flaggedCount = Object.keys(flags).filter(k => flags[Number(k)]).length;
    
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col p-4">
        <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col max-w-5xl mx-auto w-full">
          <div className="bg-[#061B3D] text-white p-4 font-bold flex justify-between items-center">
            <span>Section Review</span>
            <span>{exam.title}</span>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-6 mb-8 text-center">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-3xl font-bold text-blue-600">{answeredCount}</div>
                <div className="text-sm font-semibold text-blue-800">Attempted</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-600">{questions.length - answeredCount}</div>
                <div className="text-sm font-semibold text-gray-800">Unattempted</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{flaggedCount}</div>
                <div className="text-sm font-semibold text-yellow-800">Flagged</div>
              </div>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentQuestionIndex(idx); setPhase("exam"); }}
                  className={`relative p-3 border rounded font-bold transition flex flex-col items-center justify-center
                    ${answers[idx] !== undefined ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {flags[idx] && <Flag className="w-3 h-3 text-red-500 absolute top-1 right-1" />}
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="border-t p-4 flex justify-between items-center bg-gray-50">
            <button onClick={() => setPhase("exam")} className="px-6 py-2 bg-gray-200 rounded font-semibold text-gray-700">
              Back to Exam
            </button>
            <button 
              onClick={submitFinalResult} 
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Finish Exam"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
          <div className="bg-[#061B3D] text-white p-6 text-center">
            <h1 className="text-3xl font-black mb-2">Examination Result</h1>
            <p className="opacity-80">Prometric Simulator</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-lg mb-8 border-b pb-8">
              <div><span className="text-gray-500 font-semibold">Candidate:</span> <span className="font-bold text-[#061B3D]">{resultData.studentName}</span></div>
              <div><span className="text-gray-500 font-semibold">Exam:</span> <span className="font-bold text-[#061B3D]">{exam.title}</span></div>
              <div><span className="text-gray-500 font-semibold">Date:</span> <span className="font-bold text-[#061B3D]">{new Date(resultData.endTime).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500 font-semibold">Time Taken:</span> <span className="font-bold text-[#061B3D]">{formatTime(resultData.timeSpentSeconds)}</span></div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-8 border-b pb-8">
              {/* Circular Chart */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={resultData.percentage >= exam.passingScore ? "#16a34a" : "#dc2626"} 
                    strokeWidth="10" strokeDasharray="282.7" 
                    strokeDashoffset={282.7 - (282.7 * resultData.percentage) / 100} 
                    className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${resultData.percentage >= exam.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                    {resultData.percentage}%
                  </span>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className={`font-black text-3xl mb-2 ${resultData.percentage >= exam.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                  {resultData.percentage >= exam.passingScore ? 'PASSED' : 'FAILED'}
                </div>
                <div className="text-gray-500 text-lg font-medium">
                  Passing score required: <span className="font-bold text-gray-800">{exam.passingScore}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="text-2xl font-bold text-[#061B3D]">{resultData.totalQuestions}</div>
                <div className="text-xs font-bold text-gray-500 uppercase mt-1">Total</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-2xl font-bold text-green-600">{resultData.correctAnswers}</div>
                <div className="text-xs font-bold text-green-700 uppercase mt-1">Correct</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="text-2xl font-bold text-red-600">{resultData.incorrectAnswers}</div>
                <div className="text-xs font-bold text-red-700 uppercase mt-1">Incorrect</div>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl border">
                <div className="text-2xl font-bold text-gray-600">{resultData.unanswered}</div>
                <div className="text-xs font-bold text-gray-500 uppercase mt-1">Omitted</div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
               <button onClick={() => router.push('/dashboard')} className="bg-[#061B3D] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#1E3A8A] transition shadow">
                 Return to Dashboard
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Phase: Exam (Prometric UI) ---
  const q = questions[currentQuestionIndex];
  if (!q) return <div>Loading...</div>;

  return (
    <div className={`min-h-screen flex flex-col ${themeClass} font-sans select-none transition-colors duration-300`} dir="ltr">
      
      {/* Top Header */}
      <header className={`flex flex-col p-2 px-4 border-b ${headerBg} shadow-sm shrink-0 gap-2`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="font-bold text-lg tracking-wider">PROMETRIC</div>
            <div className="text-sm font-semibold opacity-80 border-l border-current pl-4 flex flex-col">
              <span>Exam: <span className="font-bold">{exam.title}</span></span>
              <span>Candidate: <span className="font-bold">{studentName}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold opacity-80">
            <div>Question: {currentQuestionIndex + 1} of {questions.length}</div>
            <div className="border-l border-current pl-4">Section: 1 of 1</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-mono font-bold text-lg bg-black/5 px-3 py-1 rounded">
              <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
            <button onClick={() => setPhase("review")} className="text-sm font-bold border border-current px-4 py-1.5 rounded hover:bg-black/5 transition">
              Finish Section
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Question Grid */}
        <aside className={`w-20 md:w-24 border-r ${sidebarBg} overflow-y-auto shrink-0 py-4 flex flex-col items-center gap-2 custom-scrollbar`}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-12 h-10 flex items-center justify-center font-bold border relative
                ${currentQuestionIndex === idx ? 'ring-2 ring-blue-500 bg-blue-500 text-white border-blue-500' : 
                  answers[idx] !== undefined ? 'bg-gray-300 border-gray-400 text-gray-800' : 'bg-white border-gray-300 text-gray-600'}
              `}
            >
              {flags[idx] && <Flag className={`w-3 h-3 absolute top-0.5 right-0.5 ${currentQuestionIndex === idx ? 'text-white' : 'text-red-500'}`} />}
              {idx + 1}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${contentBg}`}>
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
              <div className="font-bold text-xl">Question {currentQuestionIndex + 1} of {questions.length}</div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold opacity-70">ID: {q._id.substring(18)}</div>
              </div>
            </div>

            {/* Content Selection Area */}
            <div className="text-lg leading-relaxed mb-8 select-text cursor-text" id="selectable-area">
              {q.clinicalCase && (
                <div className={`mb-6 p-4 rounded border-l-4 border-blue-500 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                  <h4 className="font-bold mb-2 uppercase text-sm opacity-70">Clinical Scenario</h4>
                  <p className="whitespace-pre-line">{q.clinicalCase}</p>
                </div>
              )}
              <div className="font-semibold whitespace-pre-line">
                {q.text}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt: string, oIdx: number) => {
                const isSelected = answers[currentQuestionIndex] === oIdx;
                const isStruck = (strikeThroughs[currentQuestionIndex] || []).includes(oIdx);
                
                return (
                  <div 
                    key={oIdx}
                    onContextMenu={(e) => handleStrikeThrough(e, oIdx)}
                    onClick={() => !isStruck && handleOptionSelect(oIdx)}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : `${cardBorder} hover:bg-black/5`}
                      ${isStruck ? 'opacity-40 line-through cursor-not-allowed bg-gray-100' : ''}
                      ${isDark && isSelected ? 'bg-blue-900/30' : ''}
                      ${isDark && isStruck ? 'bg-gray-800' : ''}
                    `}
                  >
                    <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center font-bold text-sm mt-0.5
                      ${isSelected ? 'border-blue-600 bg-white text-white' : 'border-current'}
                    `}>
                      {isSelected ? <div className="w-3 h-3 bg-blue-600 rounded-full" /> : String.fromCharCode(65 + oIdx)}
                    </div>
                    <div className="flex-1 font-medium select-text">{opt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Footer Navigation */}
      <footer className={`p-3 border-t ${footerBg} shrink-0 flex flex-wrap justify-between items-center gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
        <div className="flex gap-2">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(p => p - 1)}
            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 transition disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
          
          <button 
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex(p => p + 1)}
            className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => setShowDisplaySettings(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold transition text-sm">
            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
          </button>
          <button onClick={() => setShowCalculator(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold transition text-sm">
            <Calculator className="w-4 h-4" /> Calculator
          </button>
          <button onClick={() => {setCurrentComment(comments[currentQuestionIndex] || ""); setShowComment(true);}} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold transition text-sm">
            <MessageSquare className="w-4 h-4" /> Comment
          </button>
          <button onClick={handleHighlight} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded font-semibold transition text-sm">
            <span className="w-3 h-3 bg-yellow-400 border border-yellow-600 rounded-sm inline-block"></span> Highlight
          </button>
          <button onClick={toggleFlag} className={`flex items-center gap-2 px-3 py-2 rounded font-semibold transition text-sm
            ${flags[currentQuestionIndex] ? 'bg-red-50 text-red-600 border border-red-200' : 'hover:bg-black/5 border border-transparent'}
          `}>
            <Flag className="w-4 h-4" /> Flag For Review
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setPhase("review")} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition">
            Finish Exam
          </button>
        </div>
      </footer>

      {/* --- Modals --- */}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed top-20 right-20 bg-white border border-gray-300 shadow-2xl rounded-lg w-64 z-50 overflow-hidden text-black">
          <div className="bg-gray-100 p-2 border-b flex justify-between items-center cursor-move">
            <span className="font-bold text-sm">Calculator</span>
            <button onClick={() => setShowCalculator(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="p-3">
            <input type="text" readOnly value={calcInput} className="w-full bg-gray-100 border text-right p-2 mb-3 text-lg font-mono rounded" />
            <div className="grid grid-cols-4 gap-1">
              {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+'].map(btn => (
                <button 
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setCalcInput('');
                    else setCalcInput(prev => prev + btn);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 p-2 rounded font-bold"
                >
                  {btn}
                </button>
              ))}
              <button 
                onClick={() => {
                  try { setCalcInput(eval(calcInput).toString()); } catch { setCalcInput('Error'); }
                }} 
                className="col-span-4 bg-blue-500 text-white hover:bg-blue-600 p-2 rounded font-bold mt-1"
              >
                =
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showComment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg text-black overflow-hidden">
            <div className="bg-[#061B3D] text-white p-3 font-bold flex justify-between items-center">
              <span>Item Comment (Question {currentQuestionIndex + 1})</span>
              <button onClick={() => setShowComment(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-2">Enter your comments or feedback regarding this specific question.</p>
              <textarea 
                rows={5}
                value={currentComment}
                onChange={e => setCurrentComment(e.target.value)}
                className="w-full border rounded p-2 focus:outline-none focus:border-blue-500"
                placeholder="Type your comment here..."
              />
            </div>
            <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowComment(false)} className="px-4 py-2 border rounded font-semibold hover:bg-gray-100">Cancel</button>
              <button onClick={saveComment} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Comment</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showDisplaySettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm text-black overflow-hidden">
            <div className="bg-[#061B3D] text-white p-3 font-bold flex justify-between items-center">
              <span>Display Settings</span>
              <button onClick={() => setShowDisplaySettings(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {(['default', 'gray', 'yellow', 'pink', 'dark'] as DisplayTheme[]).map(t => (
                <button 
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-full text-left px-4 py-3 border rounded font-semibold flex items-center justify-between
                    ${theme === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  <span className="capitalize">{t} Theme</span>
                  {theme === t && <CheckCircle className="w-5 h-5" />}
                </button>
              ))}
            </div>
            <div className="p-3 border-t bg-gray-50 text-center">
              <button onClick={() => setShowDisplaySettings(false)} className="px-8 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Apply & Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
