"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import zoomAPI, { ZoomMeeting } from "@/apis/zoom";
import { toast } from "react-hot-toast";

interface ZoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  teacherId: number;
  onSuccess?: () => void;
}

export default function ZoomManagementModal({
  isOpen,
  onClose,
  courseId,
  teacherId,
  onSuccess,
}: ZoomManagementModalProps) {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      teacherId: JSON.parse(localStorage.getItem("user") || "{}").id,
      description: "",
      joinUrl: "",
      zoomMeetingId: "",
      meetingPassword: "",
      scheduledTime: "",
      durationMinutes: 60,
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadMeetings();
    }
  }, [isOpen, courseId]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await zoomAPI.getZoomMeetings(courseId);
      setMeetings(response.result || response || []);
    } catch (error) {
      toast.error("Không thể tải danh sách Zoom meetings");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setCreating(true);
      await zoomAPI.createZoomMeeting({
        courseId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        joinUrl: data.joinUrl,
        zoomMeetingId: data.zoomMeetingId || undefined,
        meetingPassword: data.meetingPassword || undefined,
        scheduledTime: data.scheduledTime || undefined,
        durationMinutes: data.durationMinutes,
      });

      toast.success("Đã tạo Zoom meeting thành công!");
      reset();
      setShowCreateForm(false);
      loadMeetings();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo meeting");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa meeting này?")) return;

    try {
      await zoomAPI.deleteZoomMeeting(id);
      toast.success("Đã xóa meeting");
      loadMeetings();
      onSuccess?.();
    } catch (error) {
      toast.error("Không thể xóa meeting");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa đặt lịch";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/55 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Quản lý Zoom Meetings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-6 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Zoom Meeting mới
            </button>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo Meeting Mới</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("title", { required: "Tiêu đề không được để trống" })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: Buổi học online - Chương 1"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    {...register("description")}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Mô tả nội dung buổi học..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin Zoom Meeting</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    Hãy tạo meeting trên Zoom trước, sau đó dán thông tin vào đây
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link tham gia (Join URL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("joinUrl", { required: "Link tham gia không được để trống" })}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://zoom.us/j/123456789..."
                      />
                      {errors.joinUrl && (
                        <p className="text-red-500 text-sm mt-1">{errors.joinUrl.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mã phòng (Meeting ID)
                        </label>
                        <input
                          {...register("zoomMeetingId")}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123 456 789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu (Password)
                        </label>
                        <input
                          {...register("meetingPassword")}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="abc123"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian (tùy chọn)
                    </label>
                    <input
                      {...register("scheduledTime")}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời lượng (phút)
                    </label>
                    <input
                      {...register("durationMinutes", { valueAsNumber: true })}
                      type="number"
                      min="15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {creating ? "Đang tạo..." : "Tạo Meeting"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Meetings List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Đang tải...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Chưa có Zoom meeting nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{meeting.title}</h4>
                      {meeting.description && (
                        <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {meeting.durationMinutes} phút
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(meeting.scheduledTime)}
                        </div>
                        {meeting.zoomMeetingId && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            ID: {meeting.zoomMeetingId}
                          </div>
                        )}
                      </div>
                      {meeting.startUrl && (
                        <div className="mt-3">
                          <a
                            href={meeting.startUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Bắt đầu Meeting (Host)
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="ml-4 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
