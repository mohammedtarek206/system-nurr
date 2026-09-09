import mongoose, { Schema, Document } from 'mongoose';

export interface IContentAccess extends Document {
    userId: mongoose.Types.ObjectId;
    contentType: 'COURSE' | 'SECTION' | 'LESSON' | 'SUMMARY' | 'EXAM' | 'RESOURCE';
    contentId: mongoose.Types.ObjectId;
    specializationId: mongoose.Types.ObjectId;
    startAt: Date;
    endAt: Date;
    status: 'AVAILABLE' | 'PENDING' | 'LOCKED' | 'EXPIRED' | 'REVOKED' | 'COMPLETED' | 'ACTIVE'; // Keeping ACTIVE as per request notes, and AVAILABLE.
    grantedBy: mongoose.Types.ObjectId;
    grantedAt: Date;
    revokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ContentAccessSchema = new Schema<IContentAccess>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentType: {
        type: String,
        enum: ['COURSE', 'SECTION', 'LESSON', 'SUMMARY', 'EXAM', 'RESOURCE'],
        required: true
    },
    contentId: { type: Schema.Types.ObjectId, required: true },
    specializationId: { type: Schema.Types.ObjectId, ref: 'Specialization', required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ['AVAILABLE', 'PENDING', 'LOCKED', 'EXPIRED', 'REVOKED', 'COMPLETED', 'ACTIVE'],
        default: 'ACTIVE'
    },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date }
}, { timestamps: true });

export const ContentAccess = mongoose.models.ContentAccess || mongoose.model<IContentAccess>('ContentAccess', ContentAccessSchema);
