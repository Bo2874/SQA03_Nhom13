// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TeacherProfileStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

// User
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Teacher Profile
export interface TeacherProfile {
  userId: number;
  user?: User; // Populated
  idCardFront: string;
  idCardBack: string;
  teachingCertificateUrl: string;
  status: TeacherProfileStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// Subject & Grade Level
export interface Subject {
  id: number;
  name: string;
}

export interface GradeLevel {
  id: number;
  name: string;
}

// Course
export interface Course {
  id: number;
  teacherId: number;
  teacher?: User; // Populated
  title: string;
  summary?: string;
  thumbnailUrl?: string;
  subjectId?: number;
  subject?: Subject;
  gradeLevelId?: number;
  gradeLevel?: GradeLevel;
  status: CourseStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Additional info
  chapterCount?: number;
  episodeCount?: number;
  enrollmentCount?: number;
}

// Exam
export interface Exam {
  id: number;
  teacherId: number;
  teacher?: User; // Populated
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ExamStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Additional info
  questionCount?: number;
  attemptCount?: number;
}

// API Response
export interface ApiResponse<T> {
  message: string;
  result: T;
}

// Chapter
export interface Chapter {
  id: number;
  courseId?: number;
  title: string;
  description?: string;
  order: number;
  episodeCount?: number;
  episodes?: Episode[];
}

// Episode
export interface Episode {
  id: number;
  chapterId?: number;
  title: string;
  description?: string;
  type?: string;
  videoUrl?: string;
  durationSeconds?: number;
  order: number;
  quizzes?: Quiz[];
  quizQuestions?: any[];
  createdAt?: string;
}

// Quiz
export interface Quiz {
  id: number;
  episodeId?: number;
  examId?: number;
  title: string;
  description?: string;
  questions: Question[];
}

// Question Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

// Question
export interface Question {
  id: number;
  quizId: number;
  content: string;
  type: QuestionType;
  orderIndex: number;
  points: number;
  answers: Answer[];
  explanation?: string;
}

// Answer
export interface Answer {
  id: number;
  questionId: number;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

// Approval Action
export interface ApprovalAction {
  id: number;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}
