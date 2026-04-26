const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export interface SearchCoursesResponse {
  message: string;
  result: {
    courses: CourseSearchResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchTeachersResponse {
  message: string;
  result: {
    teachers: TeacherSearchResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeacherDetailResponse {
  message: string;
  result: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string;
    phone: string;
    createdAt: string;
    courses: CourseSearchResult[];
    totalCourses: number;
  };
}

export const searchCourses = async (
  params: SearchCoursesParams
): Promise<SearchCoursesResponse> => {
  const queryParams = new URLSearchParams();

  if (params.keyword) queryParams.append("keyword", params.keyword);
  if (params.subjectId) queryParams.append("subjectId", params.subjectId.toString());
  if (params.gradeLevelId) queryParams.append("gradeLevelId", params.gradeLevelId.toString());
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const response = await fetch(
    `${API_URL}/courses/search?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to search courses");
  }

  return response.json();
};

export const searchTeachers = async (
  params: SearchTeachersParams
): Promise<SearchTeachersResponse> => {
  const queryParams = new URLSearchParams();

  if (params.keyword) queryParams.append("keyword", params.keyword);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const response = await fetch(
    `${API_URL}/teachers/search?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to search teachers");
  }

  return response.json();
};

export const getTeacherById = async (
  id: number
): Promise<TeacherDetailResponse> => {
  const response = await fetch(`${API_URL}/teachers/${id}`);

  if (!response.ok) {
    throw new Error("Failed to get teacher details");
  }

  return response.json();
};
