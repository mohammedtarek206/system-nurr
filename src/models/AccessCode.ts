import mongoose, { Schema, Document } from 'mongoose';

export interface IUsedUser {
    userId?: mongoose.Types.ObjectId;
    fullName?: string;
    eligibilityNumber?: string;
    usedAt: Date;
}

export interface IAccessCode extends Document {
    code: string;
    pageType: 'NIGHT_EXAM' | 'NCLEX';
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    status: 'Active' | 'Expired' | 'Disabled';
    maxUses: number; // 0 = unlimited
    currentUses: number;
    usedUsers: IUsedUser[];
    createdAt: Date;
    updatedAt: Date;
}

const AccessCodeSchema = new Schema<IAccessCode>({
    code: { type: String, required: true, uppercase: true, trim: true },
    pageType: { type: String, enum: ['NIGHT_EXAM', 'NCLEX'], required: true },
    startDate: { type: String, default: '' },
    startTime: { type: String, default: '' },
    endDate: { type: String, default: '' },
    endTime: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' },
    maxUses: { type: Number, default: 0 },
    currentUses: { type: Number, default: 0 },
    usedUsers: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        fullName: { type: String },
        eligibilityNumber: { type: String },
        usedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Compound index for quick code lookup by pageType
AccessCodeSchema.index({ code: 1, pageType: 1 }, { unique: true });

export const AccessCode = mongoose.models.AccessCode || mongoose.model<IAccessCode>('AccessCode', AccessCodeSchema);
