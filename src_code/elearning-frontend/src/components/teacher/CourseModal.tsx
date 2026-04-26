"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Image from "next/image";
import coursesAPI from "@/apis/courses";
import type { Course, Subject, GradeLevel } from "@/@types/Course.type";
import type { User } from "@/@types/User.type";
import {
  uploadImageToCloudinary,
  isValidImageFile,
  isValidFileSize,
  formatFileSize
} from "@/utils/cloudinary";
import toast from "react-hot-toast";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSuccess: () => void;
}

const courseSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề không được để trống")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  summary: yup
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự"),
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

export default function CourseModal({ isOpen, onClose, course, onSuccess }: CourseModalProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    course?.thumbnailUrl || null
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(course?.thumbnailUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          setProfile(JSON.parse(userStr));
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }
  }, []);

  // Fetch subjects and grade levels on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, gradeLevelsRes] = await Promise.all([
          coursesAPI.getSubjects(),
          coursesAPI.getGradeLevels(),
        ]);
        setSubjects(subjectsRes.result || []);
        setGradeLevels(gradeLevelsRes.result || []);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      title: course?.title || "",
      summary: course?.summary || "",
      subject_id: course?.subject?.id ? Number(course.subject.id) : undefined,
      grade_level_id: course?.gradeLevel?.id ? Number(course.gradeLevel.id) : undefined,
    },
  });

  // Update form when course prop changes
  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        summary: course.summary || "",
        subject_id: course.subject?.id ? Number(course.subject.id) : undefined,
        grade_level_id: course.gradeLevel?.id ? Number(course.gradeLevel.id) : undefined,
      });

      // Update thumbnail URL from course data
      const thumbnailFromData = course.thumbnailUrl || course.thumbnailUrl || "";

      setThumbnailUrl(thumbnailFromData);
      setThumbnailPreview(thumbnailFromData || null);
    } else {
      reset({
        title: "",
        summary: "",
        subject_id: undefined,
        grade_level_id: undefined,
      });
      setThumbnailUrl("");
      setThumbnailPreview(null);
    }
  }, [course, reset]);

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
      toast.error(error.message || "Upload ảnh thất bại. Vui lòng thử lại!");
      setThumbnailPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!profile?.id) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (course) {
        // Update existing course - don't send status
        const updateData = {
          teacherId: profile.id,
          title: data.title,
          summary: data.summary || "",
          thumbnailUrl: thumbnailUrl || undefined,
          subjectId: data.subject_id,
          gradeLevelId: data.grade_level_id,
        };
        await coursesAPI.updateCourse(course.id, updateData);
        alert("Cập nhật khóa học thành công!");
      } else {
        // Create new course - set status to DRAFT
        const createData = {
          teacherId: profile.id,
          title: data.title,
          summary: data.summary || "",
          thumbnailUrl: thumbnailUrl || undefined,
          subjectId: data.subject_id,
          gradeLevelId: data.grade_level_id,
          status: "DRAFT" as const,
        };
        await coursesAPI.createCourse(createData);
        alert("Tạo khóa học thành công!");
      }

      // Reset form
      reset();
      setThumbnailPreview(null);
      setThumbnailUrl("");

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Có lỗi xảy ra, vui lòng thử lại";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setThumbnailPreview(null);
      setThumbnailUrl("");
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
              {course ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
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
              Tiêu đề khóa học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Ví dụ: Toán hình học không gian - Lớp 11"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              rows={4}
              placeholder="Mô tả ngắn gọn về nội dung khóa học..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              onChange={(e) => {
                setThumbnailUrl(e.target.value);
                setThumbnailPreview(e.target.value);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
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
                course ? "Cập nhật" : "Tạo khóa học"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
