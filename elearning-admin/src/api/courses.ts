import http from './http';
import type { Course, ApiResponse } from '../types';

export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  subject_id?: number;
  grade_level_id?: number;
}

export interface UpdateCourseByAdminDto {
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  rejectionReason?: string;
}

const coursesAPI = {
  /**
   * Get all courses except DRAFT (admin can see all courses except teacher's drafts)
   */
  getCourses: async (params?: CoursesQueryParams): Promise<ApiResponse<Course[]>> => {
    // Add status filter to exclude DRAFT
    const queryParams = {
      ...params,
      status: params?.status || 'PENDING_REVIEW,APPROVED,REJECTED,PUBLISHED',
    };
    const response = await http.get('/api/v1/courses', { params: queryParams });
    return response.data;
  },

  /**
   * Get course by ID
   */
  getCourseById: async (id: number): Promise<ApiResponse<Course>> => {
    const response = await http.get(`/api/v1/courses/${id}`);
    return response.data;
  },

  /**
   * Get course chapters
   */
  getCourseChapters: async (courseId: number): Promise<ApiResponse<any[]>> => {
    const response = await http.get(`/api/v1/courses/${courseId}/chapters`);
    return response.data;
  },

  /**
   * Approve or reject course (admin only)
   */
  updateCourseByAdmin: async (
    courseId: number,
    data: UpdateCourseByAdminDto
  ): Promise<ApiResponse<Course>> => {
    const response = await http.put(`/api/v1/courses/${courseId}/by-admin`, data);
    return response.data;
  },

  /**
   * Approve course (convenience method)
   */
  approveCourse: async (courseId: number): Promise<ApiResponse<Course>> => {
    return coursesAPI.updateCourseByAdmin(courseId, { status: 'APPROVED' });
  },

  /**
   * Reject course (convenience method)
   */
  rejectCourse: async (
    courseId: number,
    rejectionReason: string
  ): Promise<ApiResponse<Course>> => {
    return coursesAPI.updateCourseByAdmin(courseId, {
      status: 'REJECTED',
      rejectionReason,
    });
  },

  /**
   * Publish course (convenience method)
   */
  publishCourse: async (courseId: number): Promise<ApiResponse<Course>> => {
    return coursesAPI.updateCourseByAdmin(courseId, { status: 'PUBLISHED' });
  },
};

export default coursesAPI;
