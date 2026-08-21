import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    examId: mongoose.Types.ObjectId;
    score: number;
    percentage: number;
    certificateNumber: string;
    issuedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    certificateNumber: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Certificate = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
