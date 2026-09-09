import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  image: string;
  order: number;
  requiredExamId?: mongoose.Types.ObjectId;
  requiredExam?: mongoose.Types.ObjectId; // Legacy alias
  passingPercentage: number;
  targetSpecializations?: mongoose.Types.ObjectId[];
  targetType?: 'all' | 'specific';
  accessRequiresApproval?: boolean;
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
  requiredExamId: { type: Schema.Types.ObjectId, ref: 'Exam' },
  requiredExam: { type: Schema.Types.ObjectId, ref: 'Exam' },
  passingPercentage: { type: Number, default: 80 },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
  accessRequiresApproval: { type: Boolean, default: false },
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
}, { timestamps: true });

export const Section = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);
