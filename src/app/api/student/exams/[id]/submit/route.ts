import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Exam } from '@/models/Exam';
import { Question } from '@/models/Question';
import { ExamAttempt } from '@/models/ExamAttempt';
import { Result } from '@/models/Result';
import { Certificate } from '@/models/Certificate';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: examId } = await params;

    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    let user: any;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, timeSpentSeconds } = body;

    if (!attemptId) return NextResponse.json({ message: 'attemptId is required' }, { status: 400 });

    // Load attempt
    const attempt = await ExamAttempt.findOne({ _id: attemptId, userId: user.id, examId });
    if (!attempt) return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });

    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Exam already submitted', alreadySubmitted: true }, { status: 409 });
    }

    // Mark as submitting to prevent double-submit
    attempt.status = 'SUBMITTING';
    await attempt.save();

    // Load exam and questions
    const exam = await Exam.findById(examId);
    if (!exam) return NextResponse.json({ message: 'Exam not found' }, { status: 404 });

    // Load questions WITH correctAnswer (server-side only)
    const allQuestions = await Question.find({ examId }).lean();

    // Calculate score using attempt.answers and Question points
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let earnedPoints = 0;
    let totalPoints = 0;

    const processedAnswers = attempt.questionOrder.map((qId: any) => {
      const question = allQuestions.find((q: any) => q._id.toString() === qId.toString());
      if (!question) return null;

      const qPoints = Number(question.points) || 1;
      totalPoints += qPoints;

      const answerEntry = attempt.answers.find((a: any) => a.questionId.toString() === qId.toString());
      const selected = answerEntry ? answerEntry.selectedOptionOriginalIndex : null;
      const isFlagged = attempt.flaggedQuestions.some((f: any) => f.toString() === qId.toString());

      let isCorrect = false;
      let qEarnedPoints = 0;

      if (selected === null || selected === undefined) {
        unansweredCount++;
      } else if (selected === question.correctAnswer) {
        correctCount++;
        isCorrect = true;
        earnedPoints += qPoints;
        qEarnedPoints = qPoints;
      } else {
        wrongCount++;
      }

      return {
        questionId: qId,
        selectedOption: selected,
        isCorrect,
        isFlagged,
        points: qPoints,
        earnedPoints: qEarnedPoints
      };
    }).filter(Boolean);

    const score = earnedPoints;
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= (exam.passingScore || 50);
    const submittedAt = new Date();

    // Save result
    const result = await Result.create({
      userId: user.id,
      studentName: attempt.studentName,
      examId,
      score,
      earnedPoints,
      totalPoints,
      percentage,
      totalQuestions: attempt.questionOrder.length,
      correctAnswers: correctCount,
      incorrectAnswers: wrongCount,
      unanswered: unansweredCount,
      flagged: attempt.flaggedQuestions.length,
      timeSpentSeconds: timeSpentSeconds || 0,
      startTime: attempt.startedAt,
      endTime: submittedAt,
      answers: processedAnswers,
      comments: [],
      questionOrder: attempt.questionOrder,
      answerOrder: attempt.answerOrders.map((ao: any) => ({
        questionId: ao.questionId,
        options: ao.shuffledOrder
      })),
      status: passed ? 'PASSED' : 'FAILED'
    });

    // Update attempt status
    attempt.status = 'COMPLETED';
    attempt.submittedAt = submittedAt;
    attempt.score = score;
    attempt.earnedPoints = earnedPoints;
    attempt.totalPoints = totalPoints;
    attempt.percentage = percentage;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unansweredCount = unansweredCount;
    attempt.timeSpentSeconds = timeSpentSeconds || 0;
    attempt.resultId = result._id;
    await attempt.save();

    // Auto-generate certificate if passed and exam linked to course
    if (passed && exam.courseId) {
      const existingCert = await Certificate.findOne({ userId: user.id, courseId: exam.courseId });
      if (!existingCert) {
        const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        await Certificate.create({
          userId: user.id,
          courseId: exam.courseId,
          examId: exam._id,
          score,
          percentage,
          certificateNumber: certNumber
        });
      }
    }

    // Build review data with original question/answer details
    const reviewQuestions = attempt.questionOrder.map((qId: any) => {
      const question = allQuestions.find((q: any) => q._id.toString() === qId.toString());
      if (!question) return null;

      const aoEntry = attempt.answerOrders.find((ao: any) => ao.questionId.toString() === qId.toString());
      const shuffledOrder: number[] = aoEntry ? aoEntry.shuffledOrder : question.options.map((_: any, i: number) => i);

      const displayOptions = shuffledOrder.map((origIdx: number) => ({
        text: question.options[origIdx],
        originalIndex: origIdx
      }));

      const answerEntry = attempt.answers.find((a: any) => a.questionId.toString() === qId.toString());
      const selected = answerEntry ? answerEntry.selectedOptionOriginalIndex : null;
      const isFlagged = attempt.flaggedQuestions.some((f: any) => f.toString() === qId.toString());

      return {
        _id: question._id,
        text: question.text,
        clinicalCase: question.clinicalCase || '',
        options: displayOptions,
        correctAnswer: question.correctAnswer,
        studentAnswer: selected,
        isFlagged,
        isCorrect: selected !== null && selected === question.correctAnswer
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      resultId: result._id,
      score,
      earnedPoints,
      totalPoints,
      percentage,
      passed,
      totalQuestions: attempt.questionOrder.length,
      correctAnswers: correctCount,
      incorrectAnswers: wrongCount,
      unansweredCount,
      flaggedCount: attempt.flaggedQuestions.length,
      timeSpentSeconds: timeSpentSeconds || 0,
      startedAt: attempt.startedAt,
      submittedAt,
      studentName: attempt.studentName,
      examTitle: exam.title,
      reviewQuestions
    });
  } catch (error: any) {
    console.error('[SUBMIT EXAM ERROR]', error.stack || error);
    // Try to reset attempt status if something went wrong
    try {
      const body = await (req as any).json?.().catch(() => ({}));
      if (body?.attemptId) {
        await ExamAttempt.findByIdAndUpdate(body.attemptId, { status: 'IN_PROGRESS' });
      }
    } catch { }
    return NextResponse.json({
      message: error.message || 'Server error during submission',
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
