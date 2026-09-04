import mongoose, { Schema, Document } from 'mongoose';

export type LecturePlatform = 'ZOOM' | 'FREE_CONFERENCE' | 'VIDEO';
export type PrerequisiteType = 'NONE' | 'PREVIOUS_LESSON' | 'LESSON_EXAM' | 'PREVIOUS_SECTION' | 'SECTION_EXAM' | 'CUSTOM';

export interface IVideo extends Document {
  courseId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  platform: LecturePlatform;
  videoType?: string; // Legacy fallback
  url: string;
  videoUrl?: string; // Legacy fallback
  youtubeUrl?: string;
  thumbnail?: string;
  duration?: string;
  targetSpecializations?: mongoose.Types.ObjectId[];
  targetType?: 'all' | 'specific';
  status: 'published' | 'draft' | 'archived' | 'hidden';
  order: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  prerequisiteType: PrerequisiteType;
  prerequisiteLessonId?: mongoose.Types.ObjectId;
  prerequisiteExamId?: mongoose.Types.ObjectId;
  examId?: mongoose.Types.ObjectId;
  passingPercentage: number;
  accessRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  platform: {
    type: String,
    enum: ['ZOOM', 'FREE_CONFERENCE', 'VIDEO'],
    default: 'ZOOM',
    set: (val: string) => {
      if (!val) return 'ZOOM';
      const clean = val.trim().toUpperCase();
      if (clean === 'ZOOM') return 'ZOOM';
      if (clean === 'FREE_CONFERENCE' || clean === 'FREECONFERENCE' || clean === 'FREE CONFERENCE') return 'FREE_CONFERENCE';
      return 'VIDEO';
    }
  },
  videoType: { type: String }, // Legacy field
  url: { type: String, required: true, trim: true },
  videoUrl: { type: String }, // Legacy field
  youtubeUrl: { type: String },
  thumbnail: { type: String, default: '' },
  duration: { type: String, default: '' },
  targetSpecializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  targetType: { type: String, enum: ['all', 'specific'], default: 'all' },
  status: { type: String, enum: ['published', 'draft', 'archived', 'hidden'], default: 'published' },
  order: { type: Number, default: 0 },
  startDate: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endDate: { type: String, default: '' },
  endTime: { type: String, default: '' },
  prerequisiteType: {
    type: String,
    enum: ['NONE', 'PREVIOUS_LESSON', 'LESSON_EXAM', 'PREVIOUS_SECTION', 'SECTION_EXAM', 'CUSTOM'],
    default: 'NONE'
  },
  prerequisiteLessonId: { type: Schema.Types.ObjectId, ref: 'Video' },
  prerequisiteExamId: { type: Schema.Types.ObjectId, ref: 'Exam' },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
  passingPercentage: { type: Number, default: 80 },
  accessRule: { type: String, default: '' }
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

// Pre-save hook for data normalization & syncing platform / url legacy properties
VideoSchema.pre('save', function (next) {
  if (this.platform) {
    const p = String(this.platform).trim().toUpperCase();
    if (p === 'ZOOM') this.platform = 'ZOOM';
    else if (p === 'FREE_CONFERENCE' || p === 'FREECONFERENCE' || p === 'FREE CONFERENCE') this.platform = 'FREE_CONFERENCE';
    else this.platform = 'VIDEO';
  } else if (this.videoType) {
    const vt = String(this.videoType).trim().toUpperCase();
    if (vt === 'ZOOM') this.platform = 'ZOOM';
    else if (vt === 'FREECONFERENCE' || vt === 'FREE_CONFERENCE' || vt === 'FREE CONFERENCE') this.platform = 'FREE_CONFERENCE';
    else this.platform = 'VIDEO';
  } else {
    this.platform = 'ZOOM';
  }

  // Ensure legacy videoType mirrors platform
  this.videoType = this.platform.toLowerCase();

  // Sync url and videoUrl
  if (this.url && this.url.trim()) {
    this.videoUrl = this.url.trim();
  } else if (this.videoUrl && this.videoUrl.trim()) {
    this.url = this.videoUrl.trim();
  }

  next();
});

export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
