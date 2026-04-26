export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
}

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  isCorrect: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  explanation?: string | null;
  options: QuizOption[];
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string | null;
  passing_score: number;
  time_limit_minutes?: number | null;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  passing_score?: number;
  time_limit_minutes?: number;
}

export interface CreateQuestionRequest {
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  explanation?: string;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    order_index: number;
  }>;
}
