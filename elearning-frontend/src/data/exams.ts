import type { Exam, ExamQuestion, ExamQuestionOption, ExamSubmission, ExamLeaderboardStats } from "@/@types/Exam.type";
import { ExamStatus, ExamSubmissionStatus } from "@/@types/Exam.type";

// Mock exam question options
export const mockExamQuestionOptions: ExamQuestionOption[] = [
  // Question 1
  { id: 1, question_id: 1, option_text: "10", is_correct: false, order_index: 1 },
  { id: 2, question_id: 1, option_text: "15", is_correct: true, order_index: 2 },
  { id: 3, question_id: 1, option_text: "20", is_correct: false, order_index: 3 },
  { id: 4, question_id: 1, option_text: "25", is_correct: false, order_index: 4 },

  // Question 2
  { id: 5, question_id: 2, option_text: "Đúng", is_correct: true, order_index: 1 },
  { id: 6, question_id: 2, option_text: "Sai", is_correct: false, order_index: 2 },

  // Question 3
  { id: 7, question_id: 3, option_text: "Định lý Pythagore", is_correct: true, order_index: 1 },
  { id: 8, question_id: 3, option_text: "Định lý Talet", is_correct: true, order_index: 2 },
  { id: 9, question_id: 3, option_text: "Định lý sin", is_correct: false, order_index: 3 },
  { id: 10, question_id: 3, option_text: "Ba đường vuông góc", is_correct: true, order_index: 4 },
];

// Mock exam questions
export const mockExamQuestions: ExamQuestion[] = [
  {
    id: 1,
    exam_id: 1,
    question_text: "Cho hình hộp ABCD.A'B'C'D'. Tính góc giữa hai đường thẳng AC và A'C'.",
    question_type: "SINGLE_CHOICE",
    points: 10,
    explanation: "Trong hình hộp, AC và A'C' là hai đường chéo của hai mặt đáy song song. Do đó góc giữa chúng bằng 15 độ theo tính chất hình học không gian.",
    order_index: 1,
    options: mockExamQuestionOptions.filter(o => o.question_id === 1),
    created_at: "2024-01-10T09:00:00",
    updated_at: "2024-01-10T09:00:00",
  },
  {
    id: 2,
    exam_id: 1,
    question_text: "Trong không gian, nếu đường thẳng d vuông góc với hai đường thẳng nằm trong mặt phẳng (P) thì d vuông góc với (P).",
    question_type: "TRUE_FALSE",
    points: 5,
    explanation: "Điều kiện đúng: d phải vuông góc với hai đường thẳng CẮT NHAU trong mặt phẳng (P). Nếu hai đường thẳng song song hoặc trùng nhau thì không đủ điều kiện.",
    order_index: 2,
    options: mockExamQuestionOptions.filter(o => o.question_id === 2),
    created_at: "2024-01-10T09:05:00",
    updated_at: "2024-01-10T09:05:00",
  },
  {
    id: 3,
    exam_id: 1,
    question_text: "Chọn các định lý có thể áp dụng trong hình học không gian:",
    question_type: "MULTIPLE_CHOICE",
    points: 15,
    explanation: "Định lý Pythagore, Talet và ba đường vuông góc đều có thể áp dụng trong hình học không gian. Định lý sin chủ yếu được dùng trong tam giác phẳng.",
    order_index: 3,
    options: mockExamQuestionOptions.filter(o => o.question_id === 3),
    created_at: "2024-01-10T09:10:00",
    updated_at: "2024-01-10T09:10:00",
  },
];

// Mock exams
export const mockExams: Exam[] = [
  {
    id: 1,
    teacher_id: 1,
    course_id: 1,
    title: "Kiểm tra giữa kỳ - Toán hình học không gian",
    description: "Bài kiểm tra giữa kỳ về hình học không gian lớp 11",
    duration_minutes: 45,
    passing_score: 50,
    max_attempts: 2,
    start_time: "2024-02-01T08:00:00",
    end_time: "2024-02-15T23:59:59",
    status: ExamStatus.PUBLISHED,
    created_at: "2024-01-10T09:00:00",
    updated_at: "2024-01-20T10:00:00",
  },
  {
    id: 2,
    teacher_id: 1,
    course_id: 1,
    title: "Kiểm tra cuối kỳ - Toán 11",
    description: "Bài kiểm tra tổng hợp cuối học kỳ I",
    duration_minutes: 90,
    passing_score: 50,
    max_attempts: 1,
    start_time: "2024-03-01T08:00:00",
    end_time: "2024-03-10T23:59:59",
    status: ExamStatus.DRAFT,
    created_at: "2024-01-15T10:00:00",
    updated_at: "2024-01-15T10:00:00",
  },
  {
    id: 3,
    teacher_id: 1,
    course_id: null,
    title: "Đề thi thử THPT Quốc gia 2024",
    description: "Đề thi thử môn Toán theo cấu trúc mới",
    duration_minutes: 120,
    passing_score: 40,
    max_attempts: 3,
    start_time: null,
    end_time: null,
    status: ExamStatus.PUBLISHED,
    created_at: "2024-01-20T15:00:00",
    updated_at: "2024-01-20T15:00:00",
  },
  {
    id: 4,
    teacher_id: 1,
    course_id: 2,
    title: "Kiểm tra 15 phút - Giải tích 12",
    description: "Kiểm tra nhanh về đạo hàm",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: null,
    start_time: "2024-01-25T08:00:00",
    end_time: "2024-01-25T17:00:00",
    status: ExamStatus.ARCHIVED,
    created_at: "2024-01-18T11:00:00",
    updated_at: "2024-01-26T09:00:00",
  },
];

// Helper functions
export const getExamById = (id: number): Exam | undefined => {
  return mockExams.find(exam => exam.id === id);
};

export const getExamsByCourseId = (courseId: number): Exam[] => {
  return mockExams.filter(exam => exam.course_id === courseId);
};

export const getQuestionsByExamId = (examId: number): ExamQuestion[] => {
  return mockExamQuestions.filter(q => q.exam_id === examId);
};

export const getExamQuestionById = (id: number): ExamQuestion | undefined => {
  return mockExamQuestions.find(q => q.id === id);
};

// Calculate total points for an exam
export const getExamTotalPoints = (examId: number): number => {
  const questions = getQuestionsByExamId(examId);
  return questions.reduce((total, q) => total + q.points, 0);
};

// Mock exam submissions (results)
export const mockExamSubmissions: ExamSubmission[] = [
  {
    id: 1,
    exam_id: 1,
    user_id: 101,
    user_name: "Nguyễn Văn An",
    user_email: "nguyenvanan@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=11",
    score: 30,
    total_points: 30,
    percentage: 100,
    time_spent_minutes: 38,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T09:00:00",
    submitted_at: "2024-02-05T09:38:00",
    graded_at: "2024-02-05T10:00:00",
  },
  {
    id: 2,
    exam_id: 1,
    user_id: 102,
    user_name: "Trần Thị Bình",
    user_email: "tranthibinh@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=25",
    score: 28,
    total_points: 30,
    percentage: 93.33,
    time_spent_minutes: 42,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T09:15:00",
    submitted_at: "2024-02-05T09:57:00",
    graded_at: "2024-02-05T10:15:00",
  },
  {
    id: 3,
    exam_id: 1,
    user_id: 103,
    user_name: "Lê Minh Châu",
    user_email: "leminhchau@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=32",
    score: 27,
    total_points: 30,
    percentage: 90,
    time_spent_minutes: 40,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T10:00:00",
    submitted_at: "2024-02-05T10:40:00",
    graded_at: "2024-02-05T11:00:00",
  },
  {
    id: 4,
    exam_id: 1,
    user_id: 104,
    user_name: "Phạm Quốc Duy",
    user_email: "phamquocduy@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=13",
    score: 25,
    total_points: 30,
    percentage: 83.33,
    time_spent_minutes: 44,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T10:30:00",
    submitted_at: "2024-02-05T11:14:00",
    graded_at: "2024-02-05T11:30:00",
  },
  {
    id: 5,
    exam_id: 1,
    user_id: 105,
    user_name: "Hoàng Thị Hà",
    user_email: "hoangthiha@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=44",
    score: 24,
    total_points: 30,
    percentage: 80,
    time_spent_minutes: 41,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T11:00:00",
    submitted_at: "2024-02-05T11:41:00",
    graded_at: "2024-02-05T12:00:00",
  },
  {
    id: 6,
    exam_id: 1,
    user_id: 106,
    user_name: "Vũ Đức Khang",
    user_email: "vuduckhang@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=15",
    score: 22,
    total_points: 30,
    percentage: 73.33,
    time_spent_minutes: 43,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T13:00:00",
    submitted_at: "2024-02-05T13:43:00",
    graded_at: "2024-02-05T14:00:00",
  },
  {
    id: 7,
    exam_id: 1,
    user_id: 107,
    user_name: "Đỗ Thị Lan",
    user_email: "dothilan@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=26",
    score: 20,
    total_points: 30,
    percentage: 66.67,
    time_spent_minutes: 45,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T14:00:00",
    submitted_at: "2024-02-05T14:45:00",
    graded_at: "2024-02-05T15:00:00",
  },
  {
    id: 8,
    exam_id: 1,
    user_id: 108,
    user_name: "Ngô Văn Minh",
    user_email: "ngovanminh@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=12",
    score: 18,
    total_points: 30,
    percentage: 60,
    time_spent_minutes: 39,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-05T15:00:00",
    submitted_at: "2024-02-05T15:39:00",
    graded_at: "2024-02-05T16:00:00",
  },
  {
    id: 9,
    exam_id: 1,
    user_id: 109,
    user_name: "Bùi Thị Nga",
    user_email: "buithinga@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=45",
    score: 15,
    total_points: 30,
    percentage: 50,
    time_spent_minutes: 37,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-06T09:00:00",
    submitted_at: "2024-02-06T09:37:00",
    graded_at: "2024-02-06T10:00:00",
  },
  {
    id: 10,
    exam_id: 1,
    user_id: 110,
    user_name: "Đinh Văn Phong",
    user_email: "dinhvanphong@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=14",
    score: 12,
    total_points: 30,
    percentage: 40,
    time_spent_minutes: 35,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-06T10:00:00",
    submitted_at: "2024-02-06T10:35:00",
    graded_at: "2024-02-06T11:00:00",
  },
  {
    id: 11,
    exam_id: 1,
    user_id: 111,
    user_name: "Trương Thị Quỳnh",
    user_email: "truongthiquynh@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=27",
    score: 26,
    total_points: 30,
    percentage: 86.67,
    time_spent_minutes: 40,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-06T11:00:00",
    submitted_at: "2024-02-06T11:40:00",
    graded_at: "2024-02-06T12:00:00",
  },
  {
    id: 12,
    exam_id: 1,
    user_id: 112,
    user_name: "Võ Minh Tuấn",
    user_email: "vominhtuan@example.com",
    user_avatar: "https://i.pravatar.cc/150?img=16",
    score: 23,
    total_points: 30,
    percentage: 76.67,
    time_spent_minutes: 42,
    status: ExamSubmissionStatus.GRADED,
    started_at: "2024-02-06T13:00:00",
    submitted_at: "2024-02-06T13:42:00",
    graded_at: "2024-02-06T14:00:00",
  },
];

// Helper functions for exam submissions
export const getSubmissionsByExamId = (examId: number): ExamSubmission[] => {
  return mockExamSubmissions
    .filter(submission => submission.exam_id === examId)
    .sort((a, b) => b.score - a.score); // Sort by score descending
};

export const getExamLeaderboardStats = (examId: number): ExamLeaderboardStats => {
  const submissions = getSubmissionsByExamId(examId);
  const exam = getExamById(examId);

  if (submissions.length === 0) {
    return {
      total_participants: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      pass_rate: 0,
      average_time_spent: 0,
    };
  }

  const totalScore = submissions.reduce((sum, s) => sum + s.percentage, 0);
  const passedCount = submissions.filter(s => s.percentage >= (exam?.passing_score || 50)).length;
  const totalTime = submissions.reduce((sum, s) => sum + s.time_spent_minutes, 0);

  return {
    total_participants: submissions.length,
    average_score: totalScore / submissions.length,
    highest_score: Math.max(...submissions.map(s => s.percentage)),
    lowest_score: Math.min(...submissions.map(s => s.percentage)),
    pass_rate: (passedCount / submissions.length) * 100,
    average_time_spent: totalTime / submissions.length,
  };
};
