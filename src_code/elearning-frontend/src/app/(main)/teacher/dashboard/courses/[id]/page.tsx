"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CourseStatus } from "@/@types/Course.type";
import { EpisodeType } from "@/@types/Episode.type";
import ChapterModal from "@/components/teacher/ChapterModal";
import EpisodeModal from "@/components/teacher/EpisodeModal";
import ZoomManagementModal from "@/components/teacher/ZoomManagementModal";
import MaterialModal from "@/components/teacher/MaterialModal";
import type { Course, CourseMaterial } from "@/@types/Course.type";
import type { Chapter } from "@/@types/Chapter.type";
import type { Episode } from "@/@types/Episode.type";
import coursesAPI from "@/apis/courses";
import { formatFileSize, getFileIcon } from "@/utils/cloudinary";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  // State quản lý dữ liệu khóa học
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chapters" | "materials">("overview");
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]); // Danh sách các chương đang mở rộng

  // State quản lý Modal thêm/sửa chương
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // State quản lý Modal thêm/sửa bài học
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  // State quản lý Modal Zoom
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // State quản lý Modal tài liệu
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);

  // Tải dữ liệu khóa học khi component mount
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Hàm tải thông tin khóa học từ API
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getCourseById(courseId);
      setCourse(response.result);
      setChapters(response.result.chapters || []);
      setMaterials(response.result.materials || []);
    } catch (error: any) {
      console.error("Error fetching course:", error);
      alert(error.message || "Không thể tải thông tin khóa học");
    } finally {
      setLoading(false);
    }
  };

  // Mở/đóng chương trong danh sách
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // Tính tổng số bài học trong tất cả các chương
  const totalEpisodes = chapters.reduce((total, chapter) => {
    return total + (chapter.episodes?.length || 0);
  }, 0);

  // === XỬ LÝ CHƯƠNG ===
  const handleCreateChapter = () => {
    setEditingChapter(null);
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chương này?")) return;

    try {
      await coursesAPI.deleteChapter(courseId, chapterId);
      alert("Xóa chương thành công!");
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xóa chương");
    }
  };

  // === XỬ LÝ BÀI HỌC ===
  const handleCreateEpisode = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setEditingEpisode(null);
    setIsEpisodeModalOpen(true);
  };

  const handleEditEpisode = (episode: Episode) => {
    setSelectedChapterId(episode.chapter_id);
    setEditingEpisode(episode);
    setIsEpisodeModalOpen(true);
  };

  const handleDeleteEpisode = async (episode: Episode) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;

    try {
      await coursesAPI.deleteEpisode(courseId, episode.chapter_id, episode.id);
      alert("Xóa bài học thành công!");
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xóa bài học");
    }
  };

  // Callback khi modal lưu thành công
  const handleModalSuccess = () => {
    fetchCourseData();
  };

  // === XỬ LÝ TÀI LIỆU ===
  const handleCreateMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialModalOpen(true);
  };

  const handleEditMaterial = (material: CourseMaterial) => {
    setEditingMaterial(material);
    setIsMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;

    try {
      await coursesAPI.deleteCourseMaterial(courseId, materialId);
      alert("Xóa tài liệu thành công!");
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xóa tài liệu");
    }
  };

  // === XỬ LÝ TRẠNG THÁI KHÓA HỌC ===
  // Gửi khóa học cho admin xét duyệt
  const handleSubmitForReview = async () => {
    if (!confirm("Bạn có chắc chắn muốn gửi khóa học này để chờ duyệt?")) return;

    try {
      await coursesAPI.updateCourse(courseId, { status: CourseStatus.PENDING_REVIEW });
      alert("Đã gửi khóa học để chờ duyệt!");
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi gửi khóa học");
    }
  };

  // Chuyển khóa học về trạng thái nháp để chỉnh sửa
  const handleBackToDraft = async () => {
    if (!confirm("Bạn có chắc chắn muốn chuyển khóa học về nháp? Bạn có thể chỉnh sửa và gửi duyệt lại sau.")) return;

    try {
      await coursesAPI.updateCourse(courseId, { status: CourseStatus.DRAFT });
      alert("Đã chuyển khóa học về nháp!");
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi chuyển khóa học về nháp");
    }
  };

  // Format thời lượng từ giây sang MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy khóa học</h1>
          <button
            onClick={() => router.back()}
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Hàm hiển thị badge trạng thái khóa học với màu sắc tương ứng
  const getStatusBadge = (status: CourseStatus) => {
    const statusConfig = {
      [CourseStatus.DRAFT]: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Nháp",
      },
      [CourseStatus.PENDING_REVIEW]: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
      },
      [CourseStatus.APPROVED]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Đã duyệt",
      },
      [CourseStatus.PUBLISHED]: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã xuất bản",
      },
      [CourseStatus.REJECTED]: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Bị từ chối",
      },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              {getStatusBadge(course.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {course.subject?.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {course.grade_level?.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cập nhật: {new Date(course.updatedAt || course.updated_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Zoom Meetings
            </button>
            <Link
              href={`/teacher/dashboard/courses/${courseId}/edit`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Chỉnh sửa
            </Link>
            {/* Nút gửi duyệt: hiển thị khi khóa học ở trạng thái DRAFT hoặc REJECTED */}
            {(course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED)  && (
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium"
              >
                {course.status === CourseStatus.REJECTED ? "Gửi duyệt lại" : "Gửi duyệt"}
              </button>
            )}
            {/* Nút chuyển về nháp: hiển thị khi đang chờ duyệt để có thể rút lại */}
            {course.status === CourseStatus.PENDING_REVIEW && (
              <button
                onClick={handleBackToDraft}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
              >
                Chuyển về nháp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Alert */}
      {course.status === CourseStatus.REJECTED && (course.rejectionReason || course.rejection_reason) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Khóa học bị từ chối</h3>
              <p className="text-sm text-red-700">{course.rejectionReason || course.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("chapters")}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "chapters"
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Chương học
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "materials"
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tài liệu
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ảnh bìa</h2>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                {(course.thumbnailUrl || course.thumbnailUrl) ? (
                  <Image
                    src={course.thumbnailUrl || course.thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả khóa học</h2>
              <p className="text-gray-700 leading-relaxed">
                {course.summary || "Chưa có mô tả"}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thống kê</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Chương học</span>
                  <span className="font-semibold text-gray-900">{chapters.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bài học</span>
                  <span className="font-semibold text-gray-900">{totalEpisodes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Học sinh</span>
                  <span className="font-semibold text-gray-900">{course?.enrollmentCount}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                  <p className="font-medium text-gray-900">
                    {new Date(course.createdAt || course.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                {(course.submittedAt || course.submitted_at) && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ngày gửi duyệt</p>
                    <p className="font-medium text-gray-900">
                      {new Date(course.submittedAt || course.submitted_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}
                {(course.approvedAt || course.approved_at) && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ngày duyệt</p>
                    <p className="font-medium text-gray-900">
                      {new Date(course.approvedAt || course.approved_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chapters" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Chương học</h2>
            {/* Chỉ hiển thị nút "Thêm chương" khi khóa học chưa xuất bản */}
            {course?.status !== CourseStatus.PUBLISHED && (
              <button
                onClick={handleCreateChapter}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm chương
              </button>
            )}
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-gray-500">Chưa có chương học nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => {
                const episodes = chapter.episodes || [];
                const isExpanded = expandedChapters.includes(chapter.id);

                return (
                  <div
                    key={chapter.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {chapter.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {episodes.length} bài học
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditChapter(chapter)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Chỉnh sửa chương"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {/* Ẩn nút xóa chương khi khóa học đã xuất bản để bảo toàn cấu trúc */}
                        {course?.status !== CourseStatus.PUBLISHED && (
                          <button
                            onClick={() => handleDeleteChapter(chapter.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa chương"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Episodes List */}
                    {isExpanded && (
                      <div className="p-4 bg-white space-y-2">
                        {episodes.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">
                            Chưa có bài học nào
                          </p>
                        ) : (
                          episodes.map((episode, index) => (
                            <div
                              key={episode.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-medium text-gray-500 w-8">
                                  {index + 1}
                                </span>
                                {episode.type === EpisodeType.VIDEO ? (
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-blue-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-purple-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {episode.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>
                                      {episode.type === EpisodeType.VIDEO
                                        ? "Video"
                                        : "Quiz"}
                                    </span>
                                    {episode.durationSeconds && (
                                      <span>
                                        {formatDuration(episode.durationSeconds)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditEpisode(episode)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Chỉnh sửa bài học"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                {/* Ẩn nút xóa bài học khi khóa học đã xuất bản */}
                                {course?.status !== CourseStatus.PUBLISHED && (
                                  <button
                                    onClick={() => handleDeleteEpisode(episode)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa bài học"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <button
                          onClick={() => handleCreateEpisode(chapter.id)}
                          className="w-full mt-3 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-500 hover:text-primary-500 font-medium transition-colors"
                        >
                          + Thêm bài học
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "materials" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Tài liệu</h2>
            <button
              onClick={handleCreateMaterial}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tải lên tài liệu
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500">Chưa có tài liệu nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">{getFileIcon(material.fileUrl)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" title={material.title}>
                          {material.title}
                        </h3>
                        {material.fileSizeKb && (
                          <p className="text-sm text-gray-500">
                            {formatFileSize(material.fileSizeKb * 1024)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={material.fileUrl}
                      download={material.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm text-center transition-colors"
                    >
                      Tải xuống
                    </a>
                    <button
                      onClick={() => handleEditMaterial(material)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        chapter={editingChapter}
        courseId={courseId}
        onSuccess={handleModalSuccess}
      />

      <EpisodeModal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        episode={editingEpisode}
        chapterId={selectedChapterId || 0}
        courseId={courseId}
        onSuccess={handleModalSuccess}
      />

      <ZoomManagementModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        courseId={courseId}
        teacherId={course?.teacherId || course?.teacher?.id || 0}
      />

      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setEditingMaterial(null);
        }}
        courseId={courseId}
        material={editingMaterial}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
