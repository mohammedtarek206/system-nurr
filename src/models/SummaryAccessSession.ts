import mongoose, { Schema, Document } from 'mongoose';

export interface ISummaryAccessSession extends Document {
    userId?: mongoose.Types.ObjectId;
    sessionId: string;
    accessCodeId: mongoose.Types.ObjectId;
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
}

const SummaryAccessSessionSchema = new Schema<ISummaryAccessSession>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, required: true, unique: true },
    accessCodeId: { type: Schema.Types.ObjectId, ref: 'SummaryAccessCode', required: true },
    expiresAt: { type: Date, required: true },
    lastActivity: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
}, { timestamps: true });

export const SummaryAccessSession = mongoose.models.SummaryAccessSession || mongoose.model<ISummaryAccessSession>('SummaryAccessSession', SummaryAccessSessionSchema);
