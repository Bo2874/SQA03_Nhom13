"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect, useRef } from "react";
import type { Episode } from "@/@types/Episode.type";
import { EpisodeType } from "@/@types/Episode.type";
import coursesAPI from "@/apis/courses";
import {
  uploadVideoToCloudinary,
  isYouTubeUrl,
  isValidVideoFile,
  isValidFileSize,
  formatFileSize,
} from "@/utils/cloudinary";
import toast from "react-hot-toast";

interface EpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode?: Episode | null;
  chapterId: number;
  courseId: number;
  onSuccess: () => void;
}

const episodeSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề bài học không được để trống")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  order_index: yup
    .number()
    .required("Thứ tự không được để trống")
    .min(1, "Thứ tự phải lớn hơn 0")
    .typeError("Thứ tự phải là số"),
  video_url: yup
    .string()
    .url("URL không hợp lệ"),
  video_duration_seconds: yup
    .number()
    .required("Thời lượng video không được để trống")
    .min(1, "Thời lượng phải lớn hơn 0")
    .typeError("Thời lượng phải là số"),
});

type EpisodeFormData = yup.InferType<typeof episodeSchema>;

type UploadMode = "youtube" | "file";

export default function EpisodeModal({
  isOpen,
  onClose,
  episode,
  chapterId,
  courseId,
  onSuccess,
}: EpisodeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("youtube");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EpisodeFormData>({
    resolver: yupResolver(episodeSchema),
    defaultValues: {
      title: episode?.title || "",
      order_index: episode?.order || 1,
      video_url: episode?.video_url || "",
      video_duration_seconds: episode?.video_duration_seconds || undefined,
    },
  });

  // Update form when episode prop changes
  useEffect(() => {
    if (episode) {
      const episodeVideoUrl = episode.videoUrl || "";
      setVideoUrl(episodeVideoUrl);

      // Auto-detect upload mode based on existing URL
      if (episodeVideoUrl) {
        setUploadMode(isYouTubeUrl(episodeVideoUrl) ? "youtube" : "file");
      }

      reset({
        title: episode.title,
        order_index: episode.order,
        video_url: episodeVideoUrl,
        video_duration_seconds: episode.durationSeconds || undefined,
      });
    } else {
      setVideoUrl("");
      setUploadMode("youtube");
      reset({
        title: "",
        order_index: 1,
        video_url: "",
        video_duration_seconds: undefined,
      });
    }
  }, [episode, reset]);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidVideoFile(file)) {
      toast.error("Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, QuickTime)");
      return;
    }

    // Validate file size (max 100MB)
    if (!isValidFileSize(file, 100)) {
      toast.error(`Kích thước file không được vượt quá 100MB. File hiện tại: ${formatFileSize(file.size)}`);
      return;
    }

    // Upload to Cloudinary
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await uploadVideoToCloudinary(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      setVideoUrl(response.secure_url);
      toast.success("Upload video thành công!");

      // If video has duration metadata from Cloudinary, auto-fill it
      if (response.duration) {
        // Get current form values to preserve them
        const currentValues = {
          title: episode?.title || "",
          order_index: episode?.order || 1,
          video_url: response.secure_url,
          video_duration_seconds: Math.round(response.duration),
        };
        reset(currentValues);
      }
    } catch (error: any) {
      toast.error(error.message || "Upload video thất bại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadModeChange = (mode: UploadMode) => {
    setUploadMode(mode);
    setVideoUrl("");
  };

  const onSubmit = async (data: EpisodeFormData) => {
    setIsSubmitting(true);

    try {
      // Use videoUrl state if in file mode and a file was uploaded, otherwise use form input
      const finalVideoUrl = uploadMode === "file" && videoUrl ? videoUrl : data.video_url;

      if (!finalVideoUrl) {
        toast.error("Vui lòng cung cấp URL video hoặc upload file video");
        setIsSubmitting(false);
        return;
      }

      const episodeData = {
        title: data.title,
        type: EpisodeType.VIDEO, // Mặc định luôn là VIDEO
        order: data.order_index,
        videoUrl: finalVideoUrl,
        durationSeconds: data.video_duration_seconds,
      };

      if (episode) {
        // Update existing episode
        await coursesAPI.updateEpisode(courseId, chapterId, episode.id, episodeData);
        alert("Cập nhật bài học thành công!");
      } else {
        // Create new episode
        await coursesAPI.addEpisode(courseId, chapterId, episodeData);
        alert("Tạo bài học mới thành công!");
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setVideoUrl("");
      setUploadMode("youtube");
      setUploadProgress(0);
      setIsUploading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {episode ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề bài học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Ví dụ: Giới thiệu về đường thẳng và mặt phẳng"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thứ tự <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("order_index")}
              min="1"
              placeholder="1, 2, 3, ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.order_index && (
              <p className="text-red-500 text-sm mt-1">{errors.order_index.message}</p>
            )}
          </div>

          {/* Video Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Video <span className="text-red-500">*</span>
            </label>

            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleUploadModeChange("youtube")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === "youtube"
                    ? "bg-primary-500 text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube URL
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleUploadModeChange("file")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === "file"
                    ? "bg-primary-500 text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload File
                </div>
              </button>
            </div>

            {/* YouTube URL Input */}
            {uploadMode === "youtube" && (
              <div>
                <input
                  type="url"
                  {...register("video_url")}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.video_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.video_url.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Nhập link YouTube của video bài học
                </p>
              </div>
            )}

            {/* File Upload */}
            {uploadMode === "file" && (
              <div>
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
                    {isUploading ? "Đang upload..." : "Chọn video"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Đang upload video...</span>
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

                {/* Video URL Display */}
                {videoUrl && !isUploading && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">Video đã upload thành công</p>
                        <p className="text-xs text-green-700 mt-1 break-all">{videoUrl}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Hỗ trợ: MP4, WebM, OGG, QuickTime (Tối đa 100MB)
                </p>
              </div>
            )}
          </div>

          {/* Video Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời lượng video (giây) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("video_duration_seconds")}
              min="1"
              placeholder="Ví dụ: 600 (10 phút)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.video_duration_seconds && (
              <p className="text-red-500 text-sm mt-1">{errors.video_duration_seconds.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              1 phút = 60 giây, 10 phút = 600 giây
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
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
                episode ? "Cập nhật" : "Tạo bài học"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
