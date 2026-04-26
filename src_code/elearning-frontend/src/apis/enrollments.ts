import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";
import {
  Enrollment,
  CreateEnrollmentRequest,
  UpdateEnrollmentStatusRequest,
} from "@/@types/Course.type";

// ==================== ENROLLMENTS ====================

// POST /courses/:courseId/enrollments - Create enrollment (Subscribe to course)
export const createEnrollment = async (
  courseId: number,
  data: CreateEnrollmentRequest
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.post(`/courses/${courseId}/enrollments`, data);
};

// GET /courses/students/enrollments - Get subscribed courses
// Note: Backend automatically gets studentId from authenticated user's token
export const getSubscribedCourses = async (params?: {
  subscribed?: boolean;
  studentId?: number;
}): Promise<ApiResponse<Enrollment[]>> => {
  return axiosRequest.get("/courses/students/enrollments", {
    params: params ? {
      subscribed: params.subscribed,
      'student-id': params.studentId,
    } : undefined,
  });
};

// GET /courses/:courseId/enrollments/:id - Get enrollment by id
export const getEnrollmentById = async (
  courseId: number,
  enrollmentId: number
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.get(`/courses/${courseId}/enrollments/${enrollmentId}`);
};

// PUT /courses/:courseId/enrollments/:id/status - Update enrollment status
export const updateEnrollmentStatus = async (
  courseId: number,
  enrollmentId: number,
  data: UpdateEnrollmentStatusRequest
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.put(`/courses/${courseId}/enrollments/${enrollmentId}/status`, data);
};

// POST /courses/:courseId/enrollments/:enrollmentId/episodes/:episodeId/complete - Mark episode as complete
export const markEpisodeComplete = async (
  courseId: number,
  enrollmentId: number,
  episodeId: number
): Promise<ApiResponse<{ message: string; enrollment: Enrollment }>> => {
  return axiosRequest.post(`/courses/${courseId}/enrollments/${enrollmentId}/episodes/${episodeId}/complete`);
};

// PUT /courses/:courseId/enrollments/:enrollmentId/last-episode - Update last watched episode
export const updateLastEpisode = async (
  courseId: number,
  enrollmentId: number,
  episodeId: number
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.put(`/courses/${courseId}/enrollments/${enrollmentId}/last-episode`, {
    episodeId
  });
};

// POST /courses/:courseId/enrollments/:enrollmentId/complete - Complete course
export const completeCourse = async (
  courseId: number,
  enrollmentId: number
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.post(`/courses/${courseId}/enrollments/${enrollmentId}/complete`);
};

// POST /courses/:courseId/enrollments/:enrollmentId/reset - Reset course to start over
export const resetCourse = async (
  courseId: number,
  enrollmentId: number
): Promise<ApiResponse<Enrollment>> => {
  return axiosRequest.post(`/courses/${courseId}/enrollments/${enrollmentId}/reset`);
};

const enrollmentsAPI = {
  createEnrollment,
  getSubscribedCourses,
  getEnrollmentById,
  updateEnrollmentStatus,
  markEpisodeComplete,
  updateLastEpisode,
  completeCourse,
  resetCourse,
};

export default enrollmentsAPI;
