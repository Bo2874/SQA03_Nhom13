import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";
import {
  Exam,
  ExamQuestion,
  CreateExamRequest,
  UpdateExamRequest,
  ExamStatus,
} from "@/@types/Exam.type";

// ==================== EXAMS ====================

// GET /exams - Get exams with optional filters
export const getExams = async (params?: {
  page?: number;
  limit?: number;
  status?: ExamStatus;
}): Promise<ApiResponse<Exam[]>> => {
  return axiosRequest.get("/exams", { params });
};

// GET /exams/:id - Get exam details
export const getExamById = async (id: number): Promise<ApiResponse<Exam>> => {
  return axiosRequest.get(`/exams/${id}`);
};

// POST /exams - Create exam (Teacher only)
export const createExam = async (
  data: CreateExamRequest
): Promise<ApiResponse<Exam>> => {
  return axiosRequest.post("/exams", data);
};

// PUT /exams/:id - Update exam (Teacher/Admin)
export const updateExam = async (
  id: number,
  data: UpdateExamRequest
): Promise<ApiResponse<Exam>> => {
  return axiosRequest.put(`/exams/${id}`, data);
};

// DELETE /exams/:id - Delete exam (Teacher/Admin)
export const deleteExam = async (
  id: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/exams/${id}`);
};

// ==================== EXAM QUESTIONS ====================

// POST /exams/:id/questions - Create exam question
export const createExamQuestion = async (data: {
  examId: number;
  content: string;
  imageUrl?: string;
  order: number;
}): Promise<ApiResponse<ExamQuestion>> => {
  // Don't send examId in body - backend extracts it from URL
  const { examId, ...bodyData } = data;
  return axiosRequest.post(`/exams/${examId}/questions`, bodyData);
};

// GET /exams/:id/questions - Get all questions (from exam details)
export const getExamQuestions = async (
  examId: number
): Promise<ApiResponse<any>> => {
  const exam = await getExamById(examId);
  return { ...exam, result: (exam as any).result?.questions || [] };
};

// PUT /exams/:examId/questions/:id - Update exam question
export const updateExamQuestion = async (
  examId: number,
  questionId: number,
  data: {
    content?: string;
    imageUrl?: string;
    order?: number;
  }
): Promise<ApiResponse<any>> => {
  return axiosRequest.put(`/exams/${examId}/questions/${questionId}`, data);
};

// DELETE /exams/:examId/questions/:id - Delete exam question
export const deleteExamQuestion = async (
  examId: number,
  questionId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/exams/${examId}/questions/${questionId}`);
};

// ==================== EXAM ANSWERS ====================

// POST /exams/:examId/questions/:id/answers - Create exam answer
export const createExamAnswer = async (data: {
  examId: number;
  questionId: number;
  content: string;
  isCorrect: boolean;
}): Promise<ApiResponse<any>> => {
  // Don't send questionId in body - backend extracts it from URL
  const { questionId, examId, ...bodyData } = data;
  return axiosRequest.post(
    `/exams/${examId}/questions/${questionId}/answers`,
    bodyData
  );
};

// GET answers for a question (from exam details)
export const getQuestionAnswers = async (
  examId: number,
  questionId: number
): Promise<ApiResponse<any>> => {
  const exam = await getExamById(examId);
  const question = (exam as any).result?.questions?.find(
    (q: any) => q.id === questionId
  );
  return { ...exam, result: question?.answers || [] };
};

// PUT /exams/:examId/questions/:qId/answers/:id - Update answer
export const updateExamAnswer = async (
  examId: number,
  questionId: number,
  answerId: number,
  data: {
    content?: string;
    isCorrect?: boolean;
  }
): Promise<ApiResponse<any>> => {
  return axiosRequest.put(
    `/exams/${examId}/questions/${questionId}/answers/${answerId}`,
    data
  );
};

// DELETE /exams/:examId/questions/:qId/answers/:id - Delete answer
export const deleteExamAnswer = async (
  examId: number,
  questionId: number,
  answerId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(
    `/exams/${examId}/questions/${questionId}/answers/${answerId}`
  );
};

// ==================== EXAM LEADERBOARD ====================

// GET /exams/:id/leaderboard - Get exam leaderboard
export const getExamLeaderboard = async (
  id: number
): Promise<ApiResponse<any>> => {
  return axiosRequest.get(`/exams/${id}/leaderboard`);
};

// ==================== EXAM ATTEMPTS (Student) ====================

// POST /exams/:id/attempts/start - Start exam attempt
export const startExamAttempt = async (
  examId: number
): Promise<ApiResponse<any>> => {
  return axiosRequest.post(`/exams/${examId}/attempts/start`);
};

// POST /exams/:id/attempts/:attemptId/submit - Submit exam
export const submitExamAttempt = async (
  examId: number,
  attemptId: number,
  answers: Record<number, number> // questionId -> answerId
): Promise<ApiResponse<any>> => {
  return axiosRequest.post(`/exams/${examId}/attempts/${attemptId}/submit`, {
    responsesJson: answers,
  });
};

// GET /exams/:id/attempts/my-attempt - Get current user's attempt
export const getMyExamAttempt = async (
  examId: number
): Promise<ApiResponse<any>> => {
  return axiosRequest.get(`/exams/${examId}/attempts/my-attempt`);
};

// ==================== EXPORT ====================

const examsAPI = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  createExamQuestion,
  createExamAnswer,
  getExamLeaderboard,
  // Question management
  getExamQuestions,
  updateExamQuestion,
  deleteExamQuestion,
  // Answer management
  getQuestionAnswers,
  updateExamAnswer,
  deleteExamAnswer,
  // Student exam attempts
  startExamAttempt,
  submitExamAttempt,
  getMyExamAttempt,
};

export default examsAPI;
