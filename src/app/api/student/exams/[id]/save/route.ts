import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ExamAttempt } from '@/models/ExamAttempt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id: examId } = await params;

        const token = (await cookies()).get('token')?.value;
        let user: any = null;
        if (token) {
            try {
                user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            } catch {
                // Invalid token, treat as guest
            }
        }

        const { attemptId, questionId, selectedOptionOriginalIndex, flagged } = await req.json();

        if (!attemptId) return NextResponse.json({ message: 'attemptId required' }, { status: 400 });

        const query: any = {
            _id: attemptId,
            examId,
            status: 'IN_PROGRESS'
        };

        if (user) {
            query.userId = user.id;
        } else {
            // Guest session must match the fallback ID used in start/route.ts
            query.userId = '000000000000000000000000';
        }

        const attempt = await ExamAttempt.findOne(query);
        if (!attempt) return NextResponse.json({ message: 'Attempt not found, not yours, or already completed' }, { status: 404 });

        // Update answer
        if (questionId !== undefined && selectedOptionOriginalIndex !== undefined) {
            const existingIdx = attempt.answers.findIndex(
                (a: any) => a.questionId.toString() === questionId.toString()
            );
            if (existingIdx >= 0) {
                attempt.answers[existingIdx].selectedOptionOriginalIndex = selectedOptionOriginalIndex;
                attempt.answers[existingIdx].answeredAt = new Date();
            } else {
                attempt.answers.push({
                    questionId,
                    selectedOptionOriginalIndex,
                    answeredAt: new Date()
                });
            }
        }

        // Update flag
        if (questionId !== undefined && flagged !== undefined) {
            const flaggedStr = attempt.flaggedQuestions.map((f: any) => f.toString());
            if (flagged && !flaggedStr.includes(questionId.toString())) {
                attempt.flaggedQuestions.push(questionId);
            } else if (!flagged) {
                attempt.flaggedQuestions = attempt.flaggedQuestions.filter(
                    (f: any) => f.toString() !== questionId.toString()
                );
            }
        }

        attempt.markModified('answers');
        attempt.markModified('flaggedQuestions');
        await attempt.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[SAVE ANSWER ERROR]', error);
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
    }
}
