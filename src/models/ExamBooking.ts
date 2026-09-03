import mongoose, { Schema, Document } from 'mongoose';

export interface IExamBooking extends Document {
    userId?: mongoose.Types.ObjectId;
    fullName: string;
    examDate: string;
    eligibilityNumber: string;
    pageType: 'NIGHT_EXAM' | 'NCLEX';
    accessCodeId?: mongoose.Types.ObjectId;
    accessCode?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
    updatedAt: Date;
}

const ExamBookingSchema = new Schema<IExamBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true, trim: true },
    examDate: { type: String, required: true },
    eligibilityNumber: { type: String, required: true, trim: true },
    pageType: { type: String, enum: ['NIGHT_EXAM', 'NCLEX'], required: true },
    accessCodeId: { type: Schema.Types.ObjectId, ref: 'AccessCode' },
    accessCode: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

export const ExamBooking = mongoose.models.ExamBooking || mongoose.model<IExamBooking>('ExamBooking', ExamBookingSchema);
