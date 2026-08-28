import mongoose, { Schema, Document } from 'mongoose';

export interface ISummaryAccessLog extends Document {
    userId?: mongoose.Types.ObjectId;
    summaryId: mongoose.Types.ObjectId;
    sessionId: string;
    accessedAt: Date;
    duration?: number; // in seconds
    ipAddress?: string;
    action: 'view' | 'open';
}

const SummaryAccessLogSchema = new Schema<ISummaryAccessLog>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    summaryId: { type: Schema.Types.ObjectId, ref: 'Summary', required: true },
    sessionId: { type: String, required: true },
    accessedAt: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    ipAddress: { type: String, default: '' },
    action: { type: String, enum: ['view', 'open'], default: 'view' },
}, { timestamps: false });

export const SummaryAccessLog = mongoose.models.SummaryAccessLog || mongoose.model<ISummaryAccessLog>('SummaryAccessLog', SummaryAccessLogSchema);
