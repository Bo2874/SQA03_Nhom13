import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";

export interface SearchCoursesParams {
  keyword?: string;
  subjectId?: number;
  gradeLevelId?: number;
  page?: number;
  limit?: number;
}

export interface SearchTeachersParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface CourseSearchResult {
  id: number;
  title: string;
  summary: string;
  thumbnailUrl?: string;
  status: string;
  subject?: {
    id: number;
    name: string;
  };
  gradeLevel?: {
    id: number;
    name: string;
  };
  teacher?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  chapterCount?: number;
  totalEpisodes?: number;
  enrollmentCount?: number;
}

export interface TeacherSearchResult {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string;
  phone: string;
  totalCourses: number;
  totalStudents: number;
  createdAt: string;
}

// GET /courses/search - Search courses
export const searchCourses = async (
  params: SearchCoursesParams
): Promise<ApiResponse<{
  courses: CourseSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  return axiosRequest.get("/courses/search", { params });
};

// GET /teachers/search - Search teachers
export const searchTeachers = async (
  params: SearchTeachersParams
): Promise<ApiResponse<{
  teachers: TeacherSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  return axiosRequest.get("/teachers/search", { params });
};

// GET /teachers/:id - Get teacher by id
export const getTeacherById = async (
  id: number
): Promise<ApiResponse<{
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string;
  phone: string;
  createdAt: string;
  courses: CourseSearchResult[];
  totalCourses: number;
}>> => {
  return axiosRequest.get(`/teachers/${id}`);
};

const searchAPI = {
  searchCourses,
  searchTeachers,
  getTeacherById,
};

export default searchAPI;
