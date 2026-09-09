import mongoose, { Schema, Document } from 'mongoose';

export interface ISummary extends Document {
    title: string;
    description: string;
    categoryId: mongoose.Types.ObjectId;
    driveUrl: string;
    fileType: 'image' | 'pdf';
    targetSpecializations: mongoose.Types.ObjectId[];
    targetType: 'all' | 'specific';
    status: 'draft' | 'published' | 'hidden';
    order: number;
    accessRequiresApproval?: boolean;
    startDate?: string;
    endDate?: string;
    coverImage?: string;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const SummarySchema = new Schema<ISummary>({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'SummaryCategory', required: true },
    driveUrl: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'pdf'], required: true },
    targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
    targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
    status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'draft' },
    order: { type: Number, default: 0 },
    accessRequiresApproval: { type: Boolean, default: false },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    views: { type: Number, default: 0 },
}, { timestamps: true });

export const Summary = mongoose.models.Summary || mongoose.model<ISummary>('Summary', SummarySchema);
