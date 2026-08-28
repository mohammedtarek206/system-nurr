import mongoose, { Schema, Document } from 'mongoose';

export interface ISummaryAccessCode extends Document {
    codeHash: string;     // bcrypt hash of the actual code
    label: string;        // friendly name for admin display
    active: boolean;
    validFrom: Date;
    validUntil: Date;
    maxUses: number;      // 0 = unlimited
    currentUses: number;
    createdAt: Date;
    updatedAt: Date;
}

const SummaryAccessCodeSchema = new Schema<ISummaryAccessCode>({
    codeHash: { type: String, required: true },
    label: { type: String, required: true },
    active: { type: Boolean, default: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    maxUses: { type: Number, default: 0 },
    currentUses: { type: Number, default: 0 },
}, { timestamps: true });

export const SummaryAccessCode = mongoose.models.SummaryAccessCode || mongoose.model<ISummaryAccessCode>('SummaryAccessCode', SummaryAccessCodeSchema);
