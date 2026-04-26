"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Image from "next/image";
import { EpisodeType } from "@/@types/Episode.type";
import ChapterModal from "@/components/teacher/ChapterModal";
import EpisodeModal from "@/components/teacher/EpisodeModal";
import type { Course, Subject, GradeLevel } from "@/@types/Course.type";
import type { Chapter } from "@/@types/Chapter.type";
import type { Episode } from "@/@types/Episode.type";
import coursesAPI from "@/apis/courses";
import {
  uploadImageToCloudinary,
  isValidImageFile,
  isValidFileSize,
  formatFileSize,
} from "@/utils/cloudinary";
import toast from "react-hot-toast";

const courseSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề không được để trống")
    .min(10, "Tiêu đề phải có ít nhất 10 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  summary: yup.string().max(1000, "Mô tả không được vượt quá 1000 ký tự"),
  subject_id: yup
    .number()
    .required("Vui lòng chọn môn học")
    .typeError("Vui lòng chọn môn học"),
  grade_level_id: yup
    .number()
    .required("Vui lòng chọn lớp")
    .typeError("Vui lòng chọn lớp"),
});

type CourseFormData = yup.InferType<typeof courseSchema>;

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chapter Modal
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Episode Modal
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: yupResolver(courseSchema),
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, [courseId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [courseRes, subjectsRes, gradeLevelsRes] = await Promise.all([
        coursesAPI.getCourseById(courseId),
        coursesAPI.getSubjects(),
        coursesAPI.getGradeLevels(),
      ]);

      const courseData = courseRes.result;
      
      setCourse(courseData);
      setChapters(courseData.chapters || []);
      setSubjects(subjectsRes.result || []);
      setGradeLevels(gradeLevelsRes.result || []);

      // Set thumbnail URL from course data
      const thumbnailFromData = courseData.thumbnailUrl || "";
      console.log("Setting thumbnail URL:", thumbnailFromData);
      setThumbnailPreview(thumbnailFromData || null);
      setThumbnailUrl(thumbnailFromData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert(error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  console.log("Course data:", course);

  // Reset form when course data is loaded
  useEffect(() => {
    if (course && subjects.length > 0 && gradeLevels.length > 0) {
      const subjectId = course.subject?.id;
      const gradeLevelId = course.gradeLevel?.id;

      reset({
        title: course.title,
        summary: course.summary || "",
        subject_id: subjectId ? Number(subjectId) : undefined,
        grade_level_id: gradeLevelId ? Number(gradeLevelId) : undefined,
      });
    }
  }, [course, subjects, gradeLevels, reset]);

  const fetchCourseData = async () => {
    try {
      const response = await coursesAPI.getCourseById(courseId);
      setCourse(response.result);
      setChapters(response.result.chapters || []);
    } catch (error: any) {
      console.error("Error fetching course:", error);
    }
  };

  const handleThumbnailUrlChange = (url: string) => {
    setThumbnailUrl(url);
    setThumbnailPreview(url);
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidImageFile(file)) {
      toast.error("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (!isValidFileSize(file, 5)) {
      toast.error(`Kích thước file không được vượt quá 5MB. File hiện tại: ${formatFileSize(file.size)}`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await uploadImageToCloudinary(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      setThumbnailUrl(response.secure_url);
      toast.success("Upload ảnh thành công!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload ảnh thất bại. Vui lòng thử lại!");
      setThumbnailPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;

    setIsSubmitting(true);

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }
      const user = JSON.parse(userStr);

      const courseData = {
        teacherId: user.id,
        title: data.title,
        summary: data.summary || "",
        thumbnailUrl: thumbnailUrl || undefined,
        subjectId: data.subject_id,
        gradeLevelId: data.grade_level_id,
      };

      await coursesAPI.updateCourse(courseId, courseData);
      alert("Cập nhật khóa học thành công!");
      router.push(`/teacher/dashboard/courses/${courseId}`);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chương này? Tất cả bài học trong chương cũng sẽ bị xóa.")) return;

    try {
      await coursesAPI.deleteChapter(courseId, chapterId);
      alert("Xóa chương thành công!");
      fetchCourseData(); // Refresh data
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xóa chương");
    }
  };

  const handleChapterSuccess = () => {
    fetchCourseData(); // Refresh data
  };

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
      fetchCourseData(); // Refresh data
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xóa bài học");
    }
  };

  const handleEpisodeSuccess = () => {
    fetchCourseData(); // Refresh data
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
                <p className="text-sm text-gray-600 mt-1">{course.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/teacher/dashboard/courses/${courseId}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Info Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin cơ bản</h2>

              <form className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề khóa học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Ví dụ: Toán hình học không gian - Lớp 11"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả khóa học
                  </label>
                  <textarea
                    {...register("summary")}
                    rows={5}
                    placeholder="Mô tả ngắn gọn về nội dung khóa học..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  {errors.summary && (
                    <p className="text-red-500 text-sm mt-1">{errors.summary.message}</p>
                  )}
                </div>

                {/* Subject and Grade */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("subject_id", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Chọn môn học</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {errors.subject_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.subject_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lớp <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("grade_level_id", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Chọn lớp</option>
                      {gradeLevels.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name}
                        </option>
                      ))}
                    </select>
                    {errors.grade_level_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.grade_level_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh bìa khóa học
                  </label>

                  {/* Upload Button */}
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {isUploading ? "Đang upload..." : "Upload ảnh"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Đang upload...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* URL Input (alternative) */}
                  <div className="text-sm text-gray-500 mb-2">Hoặc nhập URL trực tiếp:</div>
                  <input
                    type="url"
                    value={thumbnailUrl || ""}
                    onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                  />

                  {/* Preview */}
                  {thumbnailPreview && (
                    <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailPreview(null);
                          setThumbnailUrl("");
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nội dung khóa học</h2>
                <button
                  onClick={handleCreateChapter}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm chương
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
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
                  <p className="text-gray-500 mb-4">Chưa có chương học nào</p>
                  <button
                    onClick={handleCreateChapter}
                    className="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    + Thêm chương đầu tiên
                  </button>
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
                        <div className="flex items-center justify-between p-4 bg-gray-50">
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
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                              onClick={() => handleDeleteChapter(chapter.id)}
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

                        {/* Episodes List */}
                        {isExpanded && (
                          <div className="p-4 bg-white space-y-2">
                            {episodes.length === 0 ? (
                              <p className="text-center text-gray-500 py-4 text-sm">
                                Chưa có bài học nào
                              </p>
                            ) : (
                              episodes.map((episode, index) => (
                                <div
                                  key={episode.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                                      onClick={() => handleDeleteEpisode(episode)}
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
                              ))
                            )}
                            <button
                              onClick={() => handleCreateEpisode(chapter.id)}
                              className="w-full mt-3 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-500 hover:text-primary-500 font-medium transition-colors"
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
          </div>

          {/* Right: Preview & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Xem trước</h3>
                {thumbnailPreview && (
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                    <Image
                      src={thumbnailPreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {course.summary || "Chưa có mô tả"}
                </p>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Chương học</span>
                    <span className="font-semibold text-gray-900">{chapters.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bài học</span>
                    <span className="font-semibold text-gray-900">
                      {chapters.reduce((total, ch) => total + (ch.episodes?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Học sinh</span>
                    <span className="font-semibold text-gray-900">{course?.enrollmentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapter(null);
        }}
        chapter={editingChapter}
        courseId={courseId}
        onSuccess={handleChapterSuccess}
      />

      <EpisodeModal
        isOpen={isEpisodeModalOpen}
        onClose={() => {
          setIsEpisodeModalOpen(false);
          setEditingEpisode(null);
          setSelectedChapterId(null);
        }}
        episode={editingEpisode}
        chapterId={selectedChapterId || 0}
        courseId={courseId}
        onSuccess={handleEpisodeSuccess}
      />
    </div>
  );
}
