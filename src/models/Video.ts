import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  youtubeUrl: string;
  targetSpecializations?: mongoose.Types.ObjectId[];
  targetType?: 'all' | 'specific';
  createdAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
}, { timestamps: true });

export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
