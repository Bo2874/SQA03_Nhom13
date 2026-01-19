import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";
import {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  CourseMaterial,
  Subject,
  GradeLevel,
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  Episode,
  CreateEpisodeRequest,
  UpdateEpisodeRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  Answer,
  CreateAnswerRequest,
  UpdateAnswerRequest,
} from "@/@types/Course.type";

// ==================== COURSES ====================

// GET /courses/pending - Get pending courses for review (Admin only)
export const getPendingCourses = async (): Promise<ApiResponse<Course[]>> => {
  return axiosRequest.get("/courses/pending");
};

// GET /courses/approved - Get approved/published courses (Public)
export const getApprovedCourses = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  subjectId?: number;
  gradeLevelId?: number;
}): Promise<ApiResponse<{
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  return axiosRequest.get("/courses/approved", { params });
};

// GET /courses - Get courses (with query params for filtering)
export const getCourses = async (params?: {
  status?: string;
  teacherId?: number;
  subjectId?: number;
  gradeLevelId?: number;
}): Promise<ApiResponse<Course[]>> => {
  return axiosRequest.get("/courses", { params });
};

// GET /courses/:id - Get course details
export const getCourseById = async (id: number): Promise<ApiResponse<Course>> => {
  return axiosRequest.get(`/courses/${id}`);
};

// POST /courses - Create course (Teacher only)
export const createCourse = async (data: CreateCourseRequest): Promise<ApiResponse<Course>> => {
  return axiosRequest.post("/courses", data);
};

// PUT /courses/:id - Update course (Teacher/Admin)
export const updateCourse = async (id: number, data: UpdateCourseRequest): Promise<ApiResponse<Course>> => {
  return axiosRequest.put(`/courses/${id}`, data);
};

// PUT /courses/:id/by-admin - Update course by admin (Admin only)
export const updateCourseByAdmin = async (
  id: number,
  data: {
    status?: 'APPROVED' | 'REJECTED' | 'PUBLISHED';
    rejectionReason?: string;
  }
): Promise<ApiResponse<Course>> => {
  return axiosRequest.put(`/courses/${id}/by-admin`, data);
};

// DELETE /courses/:id - Delete course (Teacher/Admin)
export const deleteCourse = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/courses/${id}`);
};

// ==================== COURSE MATERIALS ====================

// POST /courses/:id/materials - Add course material
export const addCourseMaterial = async (
  courseId: number,
  data: {
    title: string;
    fileUrl: string;
    fileSizeKb?: number;
  }
): Promise<ApiResponse<CourseMaterial>> => {
  return axiosRequest.post(`/courses/${courseId}/materials`, data);
};

// GET /courses/:id/materials - Get all course materials
export const getCourseMaterials = async (courseId: number): Promise<ApiResponse<CourseMaterial[]>> => {
  return axiosRequest.get(`/courses/${courseId}/materials`);
};

// GET /courses/:courseId/materials/:id - Get course material by id
export const getCourseMaterialById = async (
  courseId: number,
  materialId: number
): Promise<ApiResponse<CourseMaterial>> => {
  return axiosRequest.get(`/courses/${courseId}/materials/${materialId}`);
};

// PUT /courses/:courseId/materials/:id - Update course material
export const updateCourseMaterial = async (
  courseId: number,
  materialId: number,
  data: {
    title?: string;
    fileUrl?: string;
    fileSizeKb?: number;
  }
): Promise<ApiResponse<CourseMaterial>> => {
  return axiosRequest.put(`/courses/${courseId}/materials/${materialId}`, data);
};

// DELETE /courses/:courseId/materials/:id - Delete course material
export const deleteCourseMaterial = async (
  courseId: number,
  materialId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/courses/${courseId}/materials/${materialId}`);
};

// ==================== CHAPTERS ====================

// POST /courses/:id/chapters - Add chapter
export const addChapter = async (
  courseId: number,
  data: CreateChapterRequest
): Promise<ApiResponse<Chapter>> => {
  return axiosRequest.post(`/courses/${courseId}/chapters`, data);
};

// GET /courses/:courseId/chapters - Get all chapters
export const getAllChapters = async (
  courseId: number
): Promise<ApiResponse<Chapter[]>> => {
  return axiosRequest.get(`/courses/${courseId}/chapters`);
};

// GET /courses/:courseId/chapters/:id - Get chapter details
export const getChapterById = async (
  courseId: number,
  chapterId: number
): Promise<ApiResponse<Chapter>> => {
  return axiosRequest.get(`/courses/${courseId}/chapters/${chapterId}`);
};

// PUT /courses/:courseId/chapters/:id - Update chapter
export const updateChapter = async (
  courseId: number,
  chapterId: number,
  data: UpdateChapterRequest
): Promise<ApiResponse<Chapter>> => {
  return axiosRequest.put(`/courses/${courseId}/chapters/${chapterId}`, data);
};

// DELETE /courses/:courseId/chapters/:id - Delete chapter
export const deleteChapter = async (
  courseId: number,
  chapterId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/courses/${courseId}/chapters/${chapterId}`);
};

// ==================== EPISODES ====================

// POST /courses/:courseId/chapters/:id/episodes - Add episode
export const addEpisode = async (
  courseId: number,
  chapterId: number,
  data: CreateEpisodeRequest
): Promise<ApiResponse<Episode>> => {
  return axiosRequest.post(`/courses/${courseId}/chapters/${chapterId}/episodes`, data);
};

// GET /courses/:courseId/chapters/:chapterId/episodes - Get all episodes
export const getAllEpisodes = async (
  courseId: number,
  chapterId: number
): Promise<ApiResponse<Episode[]>> => {
  return axiosRequest.get(`/courses/${courseId}/chapters/${chapterId}/episodes`);
};

// GET /courses/:courseId/chapters/:chapterId/episodes/:id - Get episode
export const getEpisodeById = async (
  courseId: number,
  chapterId: number,
  episodeId: number
): Promise<ApiResponse<Episode>> => {
  return axiosRequest.get(`/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}`);
};

// PUT /courses/:courseId/chapters/:chapterId/episodes/:id - Update episode
export const updateEpisode = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  data: UpdateEpisodeRequest
): Promise<ApiResponse<Episode>> => {
  return axiosRequest.put(`/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}`, data);
};

// DELETE /courses/:courseId/chapters/:chapterId/episodes/:id - Delete episode
export const deleteEpisode = async (
  courseId: number,
  chapterId: number,
  episodeId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}`);
};

// ==================== QUIZ QUESTIONS ====================

// POST /courses/:courseId/chapters/:chapterId/episodes/:id/questions - Add quiz question
export const addQuizQuestion = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  data: CreateQuestionRequest
): Promise<ApiResponse<Question>> => {
  return axiosRequest.post(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions`,
    data
  );
};

// GET /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions - Get all questions
export const getAllQuestions = async (
  courseId: number,
  chapterId: number,
  episodeId: number
): Promise<ApiResponse<Question[]>> => {
  return axiosRequest.get(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions`
  );
};

// GET /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:id - Get question
export const getQuestionById = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number
): Promise<ApiResponse<Question>> => {
  return axiosRequest.get(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}`
  );
};

// PUT /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:id - Update question
export const updateQuestion = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number,
  data: UpdateQuestionRequest
): Promise<ApiResponse<Question>> => {
  return axiosRequest.put(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}`,
    data
  );
};

// DELETE /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:id - Delete question
export const deleteQuestion = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}`
  );
};

// ==================== QUIZ ANSWERS ====================

// POST /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:id/answers - Add quiz answer
export const addQuizAnswer = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number,
  data: CreateAnswerRequest
): Promise<ApiResponse<Answer>> => {
  return axiosRequest.post(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}/answers`,
    data
  );
};

// GET /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers - Get all answers
export const getAllAnswers = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number
): Promise<ApiResponse<Answer[]>> => {
  return axiosRequest.get(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}/answers`
  );
};

// GET /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:id - Get answer
export const getAnswerById = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number,
  answerId: number
): Promise<ApiResponse<Answer>> => {
  return axiosRequest.get(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}/answers/${answerId}`
  );
};

// PUT /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:id - Update answer
export const updateAnswer = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number,
  answerId: number,
  data: UpdateAnswerRequest
): Promise<ApiResponse<Answer>> => {
  return axiosRequest.put(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}/answers/${answerId}`,
    data
  );
};

// DELETE /courses/:courseId/chapters/:chapterId/episodes/:episodeId/questions/:questionId/answers/:id - Delete answer
export const deleteAnswer = async (
  courseId: number,
  chapterId: number,
  episodeId: number,
  questionId: number,
  answerId: number
): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(
    `/courses/${courseId}/chapters/${chapterId}/episodes/${episodeId}/questions/${questionId}/answers/${answerId}`
  );
};

// ==================== SUBJECTS & GRADE LEVELS ====================

// GET /subjects - Get all subjects
export const getSubjects = async (): Promise<ApiResponse<Subject[]>> => {
  return axiosRequest.get("/subjects");
};

// GET /grade-levels - Get all grade levels
export const getGradeLevels = async (): Promise<ApiResponse<GradeLevel[]>> => {
  return axiosRequest.get("/grade-levels");
};

// ==================== HOME PAGE ====================

// GET /courses/featured/courses - Get featured courses for home page
export const getFeaturedCourses = async (limit: number = 8): Promise<ApiResponse<{
  courses: Course[];
}>> => {
  return axiosRequest.get("/courses/featured/courses", { params: { limit } });
};

// GET /courses/subject/:subjectId - Get courses by subject
export const getCoursesBySubject = async (
  subjectId: number,
  limit: number = 8
): Promise<ApiResponse<{
  courses: Course[];
}>> => {
  return axiosRequest.get(`/courses/subject/${subjectId}`, { params: { limit } });
};

// GET /courses/stats/platform - Get platform statistics
export const getPlatformStats = async (): Promise<ApiResponse<{
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  totalEpisodes: number;
}>> => {
  return axiosRequest.get("/courses/stats/platform");
};

const coursesAPI = {
  // Courses
  getPendingCourses,
  getApprovedCourses,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseByAdmin,
  deleteCourse,

  // Materials
  addCourseMaterial,
  getCourseMaterials,
  getCourseMaterialById,
  updateCourseMaterial,
  deleteCourseMaterial,

  // Chapters
  addChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,

  // Episodes
  addEpisode,
  getAllEpisodes,
  getEpisodeById,
  updateEpisode,
  deleteEpisode,

  // Questions
  addQuizQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,

  // Answers
  addQuizAnswer,
  getAllAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,

  // Metadata
  getSubjects,
  getGradeLevels,

  // Home Page
  getFeaturedCourses,
  getCoursesBySubject,
  getPlatformStats,
};

export default coursesAPI;
