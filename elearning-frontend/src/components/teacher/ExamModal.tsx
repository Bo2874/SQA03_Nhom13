"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect } from "react";
import type { Exam } from "@/@types/Exam.type";
import { mockCourses } from "@/data/courses-teacher";

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: Exam | null;
  onSuccess: () => void;
}

const examSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề bài kiểm tra không được để trống")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  description: yup.string().max(1000, "Mô tả không được vượt quá 1000 ký tự"),
  course_id: yup.number().nullable(),
  duration_minutes: yup
    .number()
    .required("Thời gian làm bài không được để trống")
    .min(1, "Thời gian phải lớn hơn 0")
    .typeError("Thời gian phải là số"),
  passing_score: yup
    .number()
    .required("Điểm đạt không được để trống")
    .min(0, "Điểm đạt phải từ 0-100")
    .max(100, "Điểm đạt phải từ 0-100")
    .typeError("Điểm đạt phải là số"),
  max_attempts: yup.number().nullable().min(1, "Số lần làm bài phải lớn hơn 0"),
});

type ExamFormData = yup.InferType<typeof examSchema>;

export default function ExamModal({ isOpen, onClose, exam, onSuccess }: ExamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamFormData>({
    resolver: yupResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      course_id: null,
      duration_minutes: 45,
      passing_score: 50,
      max_attempts: null,
    },
  });

  // Reset form when modal opens/closes or exam changes
  useEffect(() => {
    if (!isOpen) {
      // Reset to default when modal closes
      reset({
        title: "",
        description: "",
        course_id: null,
        duration_minutes: 45,
        passing_score: 50,
        max_attempts: null,
      });
    } else if (exam) {
      // Load exam data for editing
      reset({
        title: exam.title || "",
        description: exam.description || "",
        course_id: exam.course_id || exam.courseId || null,
        duration_minutes: exam.duration_minutes || exam.durationMinutes || 45,
        passing_score: exam.passing_score || exam.passingScore || 50,
        max_attempts: exam.max_attempts || exam.maxAttempts || null,
      });
    } else {
      // Reset to default for new exam
      reset({
        title: "",
        description: "",
        course_id: null,
        duration_minutes: 45,
        passing_score: 50,
        max_attempts: null,
      });
    }
  }, [isOpen, exam, reset]);

  const onSubmit = async (data: ExamFormData) => {
    setIsSubmitting(true);

    try {
      // TODO: Call API to create/update exam
      await new Promise((resolve) => setTimeout(resolve, 1000));

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
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
              {exam ? "Chỉnh sửa bài kiểm tra" : "Tạo bài kiểm tra mới"}
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
              Tiêu đề bài kiểm tra <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Ví dụ: Kiểm tra giữa kỳ - Toán hình học không gian"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Mô tả ngắn gọn về bài kiểm tra..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khóa học (tùy chọn)
            </label>
            <select
              {...register("course_id", {
                setValueAs: (value) => value === "" ? null : Number(value)
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Không gắn với khóa học nào</option>
              {mockCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Chọn khóa học nếu bài kiểm tra này thuộc về một khóa học cụ thể
            </p>
          </div>

          {/* Duration and Passing Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian làm bài (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("duration_minutes")}
                min="1"
                placeholder="45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.duration_minutes && (
                <p className="text-red-500 text-sm mt-1">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm đạt (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("passing_score")}
                min="0"
                max="100"
                placeholder="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.passing_score && (
                <p className="text-red-500 text-sm mt-1">{errors.passing_score.message}</p>
              )}
            </div>
          </div>

          {/* Max Attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần làm bài tối đa (tùy chọn)
            </label>
            <input
              type="number"
              {...register("max_attempts")}
              min="1"
              placeholder="Không giới hạn"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.max_attempts && (
              <p className="text-red-500 text-sm mt-1">{errors.max_attempts.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Để trống nếu cho phép làm bài không giới hạn
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Lưu ý về câu hỏi
                </p>
                <p className="text-xs text-blue-700">
                  Sau khi tạo bài kiểm tra, bạn cần thêm câu hỏi vào đề thi.
                  Bài kiểm tra cần ít nhất 1 câu hỏi để có thể xuất bản.
                </p>
              </div>
            </div>
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
                exam ? "Cập nhật" : "Tạo bài kiểm tra"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
