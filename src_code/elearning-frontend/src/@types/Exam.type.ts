export enum ExamStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  LIVE = "LIVE",
  CLOSED = "CLOSED",
}

export interface Exam {
  id: number;
  teacher_id: number;
  course_id: number | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  max_attempts: number | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: number;
  exam_id: number;
  content: string; // Backend field
  question_text: string; // Frontend field (for display compatibility)
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  points: number;
  explanation?: string;
  order_index: number;
  order: number; // Backend field
  imageUrl?: string; // Backend field
  options?: ExamQuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface ExamQuestionOption {
  id: number;
  question_id: number;
  content: string; // Backend field
  option_text: string; // Frontend field (for display compatibility)
  is_correct: boolean;
  order_index: number;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  course_id?: number;
  duration_minutes: number;
  passing_score: number;
  max_attempts?: number;
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  course_id?: number;
  duration_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  status?: ExamStatus;
}

export enum ExamSubmissionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  GRADED = "GRADED",
}

export interface ExamSubmission {
  id: number;
  exam_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  score: number;
  total_points: number;
  percentage: number;
  time_spent_minutes: number;
  status: ExamSubmissionStatus;
  started_at: string;
  submitted_at: string;
  graded_at?: string;
}

export interface ExamLeaderboardStats {
  total_participants: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  average_time_spent: number;
}
