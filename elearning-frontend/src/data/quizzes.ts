import type { Quiz, QuizQuestion, QuizOption } from "@/@types/Quiz.type";
import { QuestionType } from "@/@types/Quiz.type";

// Mock quiz options
export const mockQuizOptions: QuizOption[] = [
  // Question 1 options
  { id: 1, question_id: 1, option_text: "Hai đường thẳng song song", is_correct: false, order_index: 1 },
  { id: 2, question_id: 1, option_text: "Hai đường thẳng cắt nhau", is_correct: false, order_index: 2 },
  { id: 3, question_id: 1, option_text: "Hai đường thẳng chéo nhau", is_correct: true, order_index: 3 },
  { id: 4, question_id: 1, option_text: "Hai đường thẳng trùng nhau", is_correct: false, order_index: 4 },

  // Question 2 options
  { id: 5, question_id: 2, option_text: "Đúng", is_correct: true, order_index: 1 },
  { id: 6, question_id: 2, option_text: "Sai", is_correct: false, order_index: 2 },

  // Question 3 options
  { id: 7, question_id: 3, option_text: "Vuông góc", is_correct: true, order_index: 1 },
  { id: 8, question_id: 3, option_text: "Song song", is_correct: true, order_index: 2 },
  { id: 9, question_id: 3, option_text: "Cắt nhau", is_correct: false, order_index: 3 },
  { id: 10, question_id: 3, option_text: "Chéo nhau", is_correct: true, order_index: 4 },
];

// Mock quiz questions
export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    quiz_id: 1,
    question_text: "Trong không gian, hai đường thẳng không song song và không cắt nhau được gọi là gì?",
    question_type: QuestionType.SINGLE_CHOICE,
    points: 10,
    order_index: 1,
    explanation: "Hai đường thẳng chéo nhau là hai đường thẳng không cùng nằm trong một mặt phẳng.",
    options: mockQuizOptions.filter(o => o.question_id === 1),
    created_at: "2024-01-10T10:00:00",
    updated_at: "2024-01-10T10:00:00",
  },
  {
    id: 2,
    quiz_id: 1,
    question_text: "Qua một điểm nằm ngoài mặt phẳng, có duy nhất một đường thẳng vuông góc với mặt phẳng đó.",
    question_type: QuestionType.TRUE_FALSE,
    points: 5,
    order_index: 2,
    explanation: "Đây là một trong những định lý cơ bản về đường thẳng vuông góc với mặt phẳng.",
    options: mockQuizOptions.filter(o => o.question_id === 2),
    created_at: "2024-01-10T10:05:00",
    updated_at: "2024-01-10T10:05:00",
  },
  {
    id: 3,
    quiz_id: 1,
    question_text: "Chọn các vị trí tương đối có thể xảy ra giữa hai đường thẳng trong không gian:",
    question_type: QuestionType.MULTIPLE_CHOICE,
    points: 15,
    order_index: 3,
    explanation: "Trong không gian, hai đường thẳng có thể: song song, cắt nhau, chéo nhau, hoặc vuông góc (là trường hợp đặc biệt của cắt nhau hoặc chéo nhau).",
    options: mockQuizOptions.filter(o => o.question_id === 3),
    created_at: "2024-01-10T10:10:00",
    updated_at: "2024-01-10T10:10:00",
  },
];

// Mock quizzes
export const mockQuizzes: Quiz[] = [
  {
    id: 1,
    title: "Kiểm tra kiến thức Chương 1",
    description: "Bài kiểm tra về đường thẳng và mặt phẳng trong không gian",
    passing_score: 70,
    time_limit_minutes: 15,
    questions: mockQuizQuestions.filter(q => q.quiz_id === 1),
    created_at: "2024-01-10T10:00:00",
    updated_at: "2024-01-10T10:00:00",
  },
  {
    id: 2,
    title: "Kiểm tra: Vectơ trong không gian",
    description: "Bài kiểm tra về vectơ và các phép toán vectơ",
    passing_score: 75,
    time_limit_minutes: 20,
    questions: [],
    created_at: "2024-01-10T11:00:00",
    updated_at: "2024-01-10T11:00:00",
  },
  {
    id: 3,
    title: "Kiểm tra tổng hợp Chương 3",
    description: "Bài kiểm tra về quan hệ vuông góc trong không gian",
    passing_score: 80,
    time_limit_minutes: 25,
    questions: [],
    created_at: "2024-01-10T12:00:00",
    updated_at: "2024-01-10T12:00:00",
  },
];

// Helper functions
export const getQuizById = (id: number): Quiz | undefined => {
  return mockQuizzes.find(quiz => quiz.id === id);
};

export const getQuestionsByQuizId = (quizId: number): QuizQuestion[] => {
  return mockQuizQuestions.filter(q => q.quiz_id === quizId);
};

export const getQuestionById = (id: number): QuizQuestion | undefined => {
  return mockQuizQuestions.find(q => q.id === id);
};
