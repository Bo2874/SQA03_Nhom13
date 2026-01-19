import axiosRequest from "@/config/axios";
import { ApiResponse, User } from "@/@types/User.type";

// GET /teachers/pending - Get pending teacher approvals (Admin only)
export const getPendingTeachers = async (): Promise<ApiResponse<User[]>> => {
  return axiosRequest.get("/teachers/pending");
};

// GET /teachers - Get approved teachers (Admin only)
export const getApprovedTeachers = async (): Promise<ApiResponse<User[]>> => {
  return axiosRequest.get("/teachers");
};

// PUT /users/:id - Update user info
export const updateUser = async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
  return axiosRequest.put(`/users/${id}`, data);
};

// DELETE /teachers/:id - Delete teacher (Admin only)
export const deleteTeacher = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/teachers/${id}`);
};

// DELETE /students/:id - Delete student (Admin only)
export const deleteStudent = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/students/${id}`);
};

// POST /teachers/featured - Get featured teachers by emails
export const getFeaturedTeachers = async (emails: string[]): Promise<ApiResponse<User[]>> => {
  return axiosRequest.post("/teachers/featured", { emails });
};

const usersAPI = {
  getPendingTeachers,
  getApprovedTeachers,
  updateUser,
  deleteTeacher,
  deleteStudent,
  getFeaturedTeachers,
};

export default usersAPI;
