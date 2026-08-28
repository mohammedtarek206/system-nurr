import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  courseId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  videoType: 'zoom' | 'freeconference' | 'youtube';
  videoUrl: string;
  youtubeUrl?: string;
  thumbnail?: string;
  duration?: string;
  targetSpecializations?: mongoose.Types.ObjectId[];
  targetType?: 'all' | 'specific';
  status?: 'published' | 'draft' | 'archived';
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoType: { type: String, enum: ['zoom', 'freeconference', 'youtube'], default: 'zoom' },
  videoUrl: { type: String, required: true },
  youtubeUrl: { type: String },
  thumbnail: { type: String, default: '' },
  duration: { type: String, default: '' },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
