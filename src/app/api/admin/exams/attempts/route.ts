import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ExamAttempt } from '@/models/ExamAttempt';
import { Exam } from '@/models/Exam';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return false;
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        return user.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function GET(req: Request) {
    if (!(await checkAdmin())) return NextResponse.json({ message: "غير مصرح لك بالوصول" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get('examType');
    const examId = searchParams.get('examId');
    const search = searchParams.get('search');

    const query: any = {};

    if (examType && examType !== 'all') {
        query.examType = examType;
    }
    if (examId && examId !== 'all') {
        query.examId = examId;
    }
    if (search && search.trim()) {
        query.$or = [
            { studentName: { $regex: search.trim(), $options: 'i' } }
        ];
    }

    const rawAttempts = await ExamAttempt.find(query)
        .populate('examId', 'title examType category duration passingPercentage')
        .populate('userId', 'fullName email specialization')
        .sort({ createdAt: -1 })
        .lean();

    const completedAttempts = rawAttempts.filter((a: any) => a.status === 'COMPLETED' || a.submittedAt);

    const totalAttempts = completedAttempts.length;
    let totalPercentage = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passedCount = 0;
    let failedCount = 0;
    let perfectScores = 0;
    let totalTimeSeconds = 0;

    completedAttempts.forEach((a: any) => {
        const pct = a.percentage ?? 0;
        totalPercentage += pct;
        if (pct > highestScore) highestScore = pct;
        if (pct < lowestScore) lowestScore = pct;

        const passPercentage = a.examId?.passingPercentage || 50;
        if (pct >= passPercentage) {
            passedCount++;
        } else {
            failedCount++;
        }

        if (pct === 100) perfectScores++;
        totalTimeSeconds += (a.timeSpentSeconds || 0);
    });

    if (totalAttempts === 0) {
        lowestScore = 0;
    }

    const stats = {
        totalAttempts,
        avgScore: totalAttempts > 0 ? Math.round(totalPercentage / totalAttempts) : 0,
        highestScore,
        lowestScore,
        passRate: totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0,
        failRate: totalAttempts > 0 ? Math.round((failedCount / totalAttempts) * 100) : 0,
        perfectScores,
        avgTimeMinutes: totalAttempts > 0 ? Math.round((totalTimeSeconds / totalAttempts) / 60) : 0
    };

    return NextResponse.json({
        stats,
        attempts: rawAttempts
    });
}
