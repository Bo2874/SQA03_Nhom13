import axiosRequest from "@/config/axios";
import { ApiResponse } from "@/@types/User.type";

export interface ZoomMeeting {
  id: number;
  courseId: number;
  teacherId: number;
  title: string;
  description?: string;
  zoomMeetingId?: string;
  joinUrl?: string;
  startUrl?: string;
  meetingPassword?: string;
  scheduledTime?: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
}

export interface CreateZoomMeetingRequest {
  courseId: number;
  teacherId: number;
  title: string;
  description?: string;
  joinUrl: string;
  zoomMeetingId?: string;
  meetingPassword?: string;
  scheduledTime?: string;
  durationMinutes?: number;
}

export interface UpdateZoomMeetingRequest {
  title?: string;
  description?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status?: string;
}

// GET /zoom/meetings - Get all meetings (optionally filter by courseId)
export const getZoomMeetings = async (courseId?: number): Promise<ApiResponse<ZoomMeeting[]>> => {
  const params = courseId ? { courseId } : {};
  return axiosRequest.get("/zoom/meetings", { params });
};

// GET /zoom/meetings/:id - Get meeting by ID
export const getZoomMeetingById = async (id: number): Promise<ApiResponse<ZoomMeeting>> => {
  return axiosRequest.get(`/zoom/meetings/${id}`);
};

// POST /zoom/meetings - Create meeting
export const createZoomMeeting = async (data: CreateZoomMeetingRequest): Promise<ApiResponse<ZoomMeeting>> => {
  return axiosRequest.post("/zoom/meetings", data);
};

// PUT /zoom/meetings/:id - Update meeting
export const updateZoomMeeting = async (id: number, data: UpdateZoomMeetingRequest): Promise<ApiResponse<ZoomMeeting>> => {
  return axiosRequest.put(`/zoom/meetings/${id}`, data);
};

// DELETE /zoom/meetings/:id - Delete meeting
export const deleteZoomMeeting = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return axiosRequest.delete(`/zoom/meetings/${id}`);
};

const zoomAPI = {
  getZoomMeetings,
  getZoomMeetingById,
  createZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
};

export default zoomAPI;
