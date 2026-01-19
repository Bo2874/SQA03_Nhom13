import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";
import { TeacherProfile } from "@/@types/Teacher.type";

// GET /teachers/pending - Get pending teachers for approval (Admin only)
export const getPendingTeachers = async (): Promise<ApiResponse<TeacherProfile[]>> => {
  return axiosRequest.get("/teachers/pending");
};

// GET /teachers - Get approved teachers
export const getApprovedTeachers = async (): Promise<ApiResponse<TeacherProfile[]>> => {
  return axiosRequest.get("/teachers");
};

// GET /teacher-profiles/:id - Get teacher profile
export const getTeacherProfile = async (id: number): Promise<ApiResponse<TeacherProfile>> => {
  return axiosRequest.get(`/teacher-profiles/${id}`);
};

// PUT /teacher-profiles/:id - Update teacher profile (Teacher only)
export const updateTeacherProfile = async (
  id: number,
  data: FormData
): Promise<ApiResponse<TeacherProfile>> => {
  return axiosRequest.put(`/teacher-profiles/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// PUT /teacher-profiles/admin/:id - Approve/reject teacher (Admin only)
export const updateTeacherProfileByAdmin = async (
  id: number,
  data: {
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    rejectionReason?: string;
  }
): Promise<ApiResponse<TeacherProfile>> => {
  return axiosRequest.put(`/teacher-profiles/admin/${id}`, data);
};

const teacherProfilesAPI = {
  getPendingTeachers,
  getApprovedTeachers,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherProfileByAdmin,
};

export default teacherProfilesAPI;
