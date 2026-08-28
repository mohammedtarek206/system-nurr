import mongoose, { Schema, Document } from 'mongoose';

// Rate limiting: track failed attempts per IP
export interface ISummaryLoginAttempt extends Document {
    ip: string;
    attempts: number;
    lastAttempt: Date;
    lockedUntil?: Date;
}

const SummaryLoginAttemptSchema = new Schema<ISummaryLoginAttempt>({
    ip: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    lastAttempt: { type: Date, default: Date.now },
    lockedUntil: { type: Date, default: null },
}, { timestamps: false });

export const SummaryLoginAttempt = mongoose.models.SummaryLoginAttempt || mongoose.model<ISummaryLoginAttempt>('SummaryLoginAttempt', SummaryLoginAttemptSchema);
