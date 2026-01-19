export enum CourseStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
}

export interface Subject {
  id: number;
  name: string;
}

export interface GradeLevel {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  teacher_id?: number;
  teacher?: any; // Teacher object from backend
  title: string;
  summary: string | null;
  thumbnailUrl?: string | null; // Backend uses camelCase
  subject?: Subject; // Backend always returns subject object
  gradeLevel?: GradeLevel; // Backend uses camelCase and always returns object
  status: CourseStatus;
  rejection_reason?: string | null;
  rejectionReason?: string | null; // Backend uses camelCase
  submitted_at?: string | null;
  submittedAt?: string | null; // Backend uses camelCase
  approved_at?: string | null;
  approvedAt?: string | null; // Backend uses camelCase
  created_at?: string;
  createdAt?: string; // Backend uses camelCase
  updated_at?: string;
  updatedAt?: string; // Backend uses camelCase
  chapters?: any[]; // Chapters array from backend
  materials?: any[]; // Materials array from backend
}

export interface CourseMaterial {
  id: number;
  course_id: number;
  title: string;
  file_url: string;
  file_size_kb: number;
  uploaded_at: string;
}

export interface CreateCourseRequest {
  title: string;
  summary?: string;
  thumbnail?: File;
  subject_id?: number;
  grade_level_id?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  summary?: string;
  thumbnail?: File;
  subject_id?: number;
  grade_level_id?: number;
  status?: CourseStatus;
}

// ==================== CHAPTERS ====================

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChapterRequest {
  title: string;
  order: number;
}

export interface UpdateChapterRequest {
  title?: string;
  order?: number;
}

// ==================== EPISODES ====================

export enum EpisodeType {
  VIDEO = "VIDEO",
  QUIZ = "QUIZ",
}

export interface Episode {
  id: number;
  chapter_id: number;
  title: string;
  type: EpisodeType;
  videoUrl?: string;
  durationSeconds?: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEpisodeRequest {
  title: string;
  type: EpisodeType;
  videoUrl?: string;
  durationSeconds?: number;
  order: number;
}

export interface UpdateEpisodeRequest {
  title?: string;
  type?: EpisodeType;
  videoUrl?: string;
  durationSeconds?: number;
  order?: number;
}

// ==================== QUESTIONS ====================

export interface Question {
  id: number;
  episode_id: number;
  content: string;
  image_url?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionRequest {
  content: string;
  imageUrl?: string;
  order: number;
}

export interface UpdateQuestionRequest {
  content?: string;
  imageUrl?: string;
  order?: number;
}

// ==================== ANSWERS ====================

export interface Answer {
  id: number;
  question_id: number;
  content: string;
  is_correct: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAnswerRequest {
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface UpdateAnswerRequest {
  content?: string;
  isCorrect?: boolean;
  order?: number;
}

// ==================== ENROLLMENTS ====================

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export interface Enrollment {
  id: number;
  course_id: number;
  student_id: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
}

export interface CreateEnrollmentRequest {
  studentId: number;
}

export interface UpdateEnrollmentStatusRequest {
  status: EnrollmentStatus;
}
