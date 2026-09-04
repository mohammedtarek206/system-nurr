import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Course, ICourse } from '@/models/Course';
import { Section, ISection } from '@/models/Section';
import { Video, IVideo } from '@/models/Video';
import { Exam, IExam } from '@/models/Exam';
import { Result } from '@/models/Result';
import { CourseProgress } from '@/models/CourseProgress';
import { LessonProgress } from '@/models/LessonProgress';
import { SubscriptionRequest } from '@/models/SubscriptionRequest';
import { Notification } from '@/models/Notification';
import { isContentAccessible, getContentStatus } from '@/lib/dateUtils';

export interface UserContext {
    id: string;
    role: string;
    specializationId?: string;
    name?: string;
}

/**
 * Validates if student has valid subscription/access to the course
 */
export async function checkCourseSubscriptionAccess(user: UserContext, courseDoc: ICourse) {
    // Admin bypass
    if (user.role === 'admin') {
        return { accessible: true };
    }

    // 1. Check specialization target
    if (courseDoc.targetType === 'specific' && courseDoc.targetSpecializations && courseDoc.targetSpecializations.length > 0) {
        if (!user.specializationId) {
            return { accessible: false, reason: 'يرجى اختيار التخصص الدراسي أولاً.' };
        }
        const specIds = courseDoc.targetSpecializations.map(id => id.toString());
        if (!specIds.includes(user.specializationId.toString())) {
            return { accessible: false, reason: 'هذا الكورس مخصص لتخصصات أخرى غير تخصصك الحالي.' };
        }
    }

    // 2. Check course schedule dates
    const scheduleCheck = isContentAccessible(courseDoc.toObject ? courseDoc.toObject() : courseDoc);
    if (!scheduleCheck.accessible) {
        return { accessible: false, reason: scheduleCheck.reason || 'الكورس غير متاح في الوقت الحالي.' };
    }

    // 3. Check Free course or Subscription status
    if (courseDoc.isFree) {
        return { accessible: true };
    }

    // Check database for active approved subscription
    const activeSub = await SubscriptionRequest.findOne({
        userId: user.id,
        $or: [
            { courseId: courseDoc._id },
            { planId: courseDoc._id }
        ],
        status: 'APPROVED'
    });

    if (activeSub) {
        // Check subscription access duration if defined
        if (courseDoc.accessDurationDays && activeSub.updatedAt) {
            const expiryDate = new Date(activeSub.updatedAt);
            expiryDate.setDate(expiryDate.getDate() + courseDoc.accessDurationDays);
            if (new Date() > expiryDate) {
                return { accessible: false, reason: 'انتهت مدة اشتراكك في هذا الكورس. يرجى التجديد للمتابعة.' };
            }
        }
        return { accessible: true };
    }

    // Check if course has any approved subscription under course scope
    const anyCourseSub = await SubscriptionRequest.findOne({
        userId: user.id,
        status: 'APPROVED'
    });

    if (anyCourseSub) {
        return { accessible: true };
    }

    return { accessible: false, reason: 'يلزم الاشتراك بالكورس أولاً للوصول إلى المحتوى.' };
}

/**
 * Returns full tree of course sections & lessons with accurate progression status for user
 */
export async function getCourseProgressionState(userId: string, courseId: string) {
    await connectDB();

    const courseDoc = await Course.findById(courseId);
    if (!courseDoc) return null;

    const sections = await Section.find({ courseId, status: 'published' }).sort({ order: 1, createdAt: 1 });
    const videos = await Video.find({ courseId, status: 'published' }).sort({ order: 1, createdAt: 1 });

    // Get user's course progress doc
    let courseProgress = await CourseProgress.findOne({ userId, courseId });
    if (!courseProgress) {
        courseProgress = await CourseProgress.create({
            userId,
            courseId,
            completedLessons: [],
            completedSections: [],
            progressPercentage: 0,
            status: 'IN_PROGRESS'
        });
    }

    // Get all lesson progress records for this user & course
    const lessonProgressList = await LessonProgress.find({ userId, courseId });
    const lessonProgressMap = new Map<string, any>();
    lessonProgressList.forEach(lp => lessonProgressMap.set(lp.lessonId.toString(), lp));

    // Get all results for this user
    const userResults = await Result.find({ userId }).sort({ createdAt: -1 });

    const mode = courseDoc.progressionMode || 'FREE';

    // Process lessons and compute accessibility
    let completedCount = 0;
    const processedVideos: any[] = [];

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const vidIdStr = video._id.toString();
        const lp = lessonProgressMap.get(vidIdStr);

        let status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' = 'LOCKED';
        let examPassed = false;
        let latestScore = 0;
        let latestPercentage = 0;

        // Check associated exam
        const examIdToPass = video.examId || video.prerequisiteExamId;
        let requiredExamDoc: any = null;
        let canRetake = true;
        let remainingAttempts = 3;

        if (examIdToPass) {
            requiredExamDoc = await Exam.findById(examIdToPass);
            if (requiredExamDoc) {
                const examResults = userResults.filter(r => r.examId.toString() === examIdToPass.toString());
                if (examResults.length > 0) {
                    latestPercentage = examResults[0].percentage;
                    latestScore = examResults[0].score;
                    const passingReq = video.passingPercentage || requiredExamDoc.passingPercentage || requiredExamDoc.passingScore || 80;
                    if (latestPercentage >= passingReq) {
                        examPassed = true;
                    }

                    if (requiredExamDoc.maxAttempts) {
                        remainingAttempts = Math.max(0, requiredExamDoc.maxAttempts - examResults.length);
                        if (remainingAttempts <= 0 && !requiredExamDoc.allowRetake) {
                            canRetake = false;
                        }
                    }
                }
            }
        }

        // Determine status based on progression mode
        if (lp && (lp.status === 'COMPLETED' || lp.completedAt)) {
            status = 'COMPLETED';
            completedCount++;
        } else if (lp && lp.manuallyUnlocked) {
            status = 'UNLOCKED';
        } else if (i === 0 || mode === 'FREE') {
            status = 'UNLOCKED';
        } else if (mode === 'SEQUENTIAL') {
            const prevVid = videos[i - 1];
            const prevLp = lessonProgressMap.get(prevVid._id.toString());
            if (prevLp && (prevLp.status === 'COMPLETED' || courseProgress.completedLessons.includes(prevVid._id))) {
                status = 'UNLOCKED';
            } else {
                status = 'LOCKED';
            }
        } else if (mode === 'EXAM_REQUIRED') {
            const prevVid = videos[i - 1];
            const prevLp = lessonProgressMap.get(prevVid._id.toString());
            const prevExamId = prevVid?.examId || prevVid?.prerequisiteExamId;

            if (prevExamId) {
                const prevExamReq = prevVid.passingPercentage || 80;
                const prevExamResults = userResults.filter(r => r.examId.toString() === prevExamId.toString());
                if (prevExamResults.length > 0 && prevExamResults[0].percentage >= prevExamReq) {
                    status = 'UNLOCKED';
                } else {
                    status = 'LOCKED';
                }
            } else if (prevLp && prevLp.status === 'COMPLETED') {
                status = 'UNLOCKED';
            } else {
                status = 'LOCKED';
            }
        }

        // Custom prerequisite check
        if (video.prerequisiteType === 'LESSON_EXAM' && video.prerequisiteExamId) {
            const reqResults = userResults.filter(r => r.examId.toString() === video.prerequisiteExamId!.toString());
            if (reqResults.length === 0 || reqResults[0].percentage < (video.passingPercentage || 80)) {
                status = 'LOCKED';
            }
        }

        processedVideos.push({
            _id: video._id,
            title: video.title,
            description: video.description,
            platform: video.platform,
            order: video.order,
            sectionId: video.sectionId,
            startDate: video.startDate,
            startTime: video.startTime,
            endDate: video.endDate,
            endTime: video.endTime,
            scheduleStatus: getContentStatus(video),
            examId: video.examId,
            prerequisiteExamId: video.prerequisiteExamId,
            passingPercentage: video.passingPercentage || 80,
            status,
            examPassed,
            latestScore,
            latestPercentage,
            canRetake,
            remainingAttempts,
            url: status === 'UNLOCKED' || status === 'COMPLETED' ? video.url : undefined
        });
    }

    // Update course progress percentage
    const totalLessons = videos.length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    courseProgress.progressPercentage = progressPercentage;
    if (progressPercentage === 100) {
        courseProgress.status = 'COMPLETED';
        courseProgress.completedAt = new Date();
    }
    await courseProgress.save();

    // Process sections
    const processedSections = sections.map(sec => {
        const secVideos = processedVideos.filter(v => v.sectionId.toString() === sec._id.toString());
        const allSecCompleted = secVideos.length > 0 && secVideos.every(v => v.status === 'COMPLETED');
        const hasUnlocked = secVideos.some(v => v.status === 'UNLOCKED' || v.status === 'COMPLETED');

        return {
            _id: sec._id,
            title: sec.title,
            description: sec.description,
            order: sec.order,
            requiredExamId: sec.requiredExamId || sec.requiredExam,
            passingPercentage: sec.passingPercentage || 80,
            status: allSecCompleted ? 'COMPLETED' : hasUnlocked ? 'UNLOCKED' : 'LOCKED',
            lessonsCount: secVideos.length
        };
    });

    return {
        course: {
            _id: courseDoc._id,
            title: courseDoc.title,
            description: courseDoc.description,
            progressionMode: mode,
            finalExamId: courseDoc.finalExamId,
            finalPassingPercentage: courseDoc.finalPassingPercentage || 80,
            nextCourseId: courseDoc.nextCourseId,
            progressPercentage,
            completedLessonsCount: completedCount,
            totalLessonsCount: totalLessons,
            status: courseProgress.status
        },
        sections: processedSections,
        lessons: processedVideos
    };
}

/**
 * Evaluates an exam submission and unlocks subsequent content dynamically
 */
export async function evaluateExamSubmission(userId: string, examId: string, percentage: number, score: number) {
    await connectDB();

    const exam = await Exam.findById(examId);
    if (!exam) return { success: false, message: 'Exam not found' };

    const passingPercentage = exam.passingPercentage || exam.passingScore || 80;
    const isPassed = percentage >= passingPercentage;

    // Save result status
    const latestResult = await Result.findOne({ userId, examId }).sort({ createdAt: -1 });
    if (latestResult) {
        latestResult.status = isPassed ? 'PASSED' : 'FAILED';
        await latestResult.save();
    }

    // Find linked lesson/video if any
    const video = await Video.findOne({
        $or: [{ examId }, { prerequisiteExamId: examId }]
    });

    let nextLessonId: string | null = null;
    let nextCourseId: string | null = null;

    if (video) {
        const courseId = video.courseId.toString();

        // Update lesson progress
        let lp = await LessonProgress.findOne({ userId, lessonId: video._id });
        if (!lp) {
            lp = new LessonProgress({ userId, lessonId: video._id, courseId });
        }

        lp.requiredExamId = new mongoose.Types.ObjectId(examId);
        lp.score = percentage;
        lp.attemptsCount = (lp.attemptsCount || 0) + 1;

        if (isPassed) {
            lp.status = 'COMPLETED';
            lp.completedAt = new Date();
            lp.examPassed = true;
            await lp.save();

            // Add to completed lessons array in CourseProgress
            await CourseProgress.updateOne(
                { userId, courseId },
                {
                    $addToSet: { completedLessons: video._id },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true }
            );

            // Find next video in sequence
            const nextVid = await Video.findOne({
                courseId,
                order: { $gt: video.order },
                status: 'published'
            }).sort({ order: 1 });

            if (nextVid) {
                nextLessonId = nextVid._id.toString();
                // Unlock next lesson in LessonProgress
                await LessonProgress.updateOne(
                    { userId, lessonId: nextVid._id },
                    { $set: { status: 'UNLOCKED', courseId } },
                    { upsert: true }
                );
            }

            // Notify student
            await Notification.create({
                userId,
                title: '🎉 إنجاز ممتاز! اجتزت الامتحان بنجاح',
                message: `تم اجتياز امتحان [${exam.title}] بنسبة ${percentage}%. تم فتح المحاضرة التالية لك.`,
                type: 'system',
                read: false
            });

        } else {
            lp.status = 'FAILED';
            lp.examPassed = false;
            await lp.save();

            // Notify failure
            await Notification.create({
                userId,
                title: '⚠️ نتائج الامتحان',
                message: `لم تحقق درجة النجاح المطلوبة في [${exam.title}] (${percentage}% / المطلوب ${passingPercentage}%).`,
                type: 'system',
                read: false
            });
        }
    }

    // Check Final Course Exam
    if (exam.courseId && isPassed) {
        const course = await Course.findById(exam.courseId);
        if (course && course.finalExamId?.toString() === examId) {
            await CourseProgress.updateOne(
                { userId, courseId: course._id },
                { $set: { status: 'COMPLETED', completedAt: new Date() } }
            );

            if (course.nextCourseId) {
                nextCourseId = course.nextCourseId.toString();
                // Notify next course unlock
                await Notification.create({
                    userId,
                    title: '🎓 تهانينا! إتمام الكورس بالكامل',
                    message: `لقد أنهيت كورس [${course.title}] بنجاح، وتم فتح الكورس التالي لك!`,
                    type: 'system',
                    read: false
                });
            }
        }
    }

    return {
        success: true,
        passed: isPassed,
        score,
        percentage,
        passingPercentage,
        nextLessonId,
        nextCourseId,
        message: isPassed
            ? `تم اجتياز الامتحان بنسبة ${percentage}%. تم فتح المحاضرة التالية بنجاح!`
            : `لم تحقق درجة النجاح المطلوبة (${percentage}% / المطلوب ${passingPercentage}%).`
    };
}
