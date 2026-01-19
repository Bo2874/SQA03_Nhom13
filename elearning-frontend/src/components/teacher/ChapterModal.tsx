"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect } from "react";
import type { Chapter } from "@/@types/Chapter.type";
import coursesAPI from "@/apis/courses";

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter?: Chapter | null;
  courseId: number;
  onSuccess: () => void;
}

const chapterSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề chương không được để trống")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  order_index: yup
    .number()
    .required("Thứ tự không được để trống")
    .min(1, "Thứ tự phải lớn hơn 0")
    .typeError("Thứ tự phải là số"),
});

type ChapterFormData = yup.InferType<typeof chapterSchema>;

export default function ChapterModal({
  isOpen,
  onClose,
  chapter,
  courseId,
  onSuccess,
}: ChapterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChapterFormData>({
    resolver: yupResolver(chapterSchema),
    defaultValues: {
      title: chapter?.title || "",
      order_index: chapter?.order || 1,
    },
  });

  // Update form when chapter prop changes
  useEffect(() => {
    if (chapter) {
      reset({
        title: chapter.title,
        order_index: chapter.order,
      });
    } else {
      reset({
        title: "",
        order_index: 1,
      });
    }
  }, [chapter, reset]);

  const onSubmit = async (data: ChapterFormData) => {
    setIsSubmitting(true);

    try {
      const chapterData = {
        title: data.title,
        order: data.order_index,
      };

      if (chapter) {
        // Update existing chapter
        await coursesAPI.updateChapter(courseId, chapter.id, chapterData);
        alert("Cập nhật chương thành công!");
      } else {
        // Create new chapter
        await coursesAPI.addChapter(courseId, chapterData);
        alert("Tạo chương mới thành công!");
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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {chapter ? "Chỉnh sửa chương" : "Thêm chương mới"}
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
              Tiêu đề chương <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Ví dụ: Chương 1: Đường thẳng và mặt phẳng trong không gian"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Order Index */}
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
            <p className="text-xs text-gray-500 mt-1">
              Chương sẽ được sắp xếp theo thứ tự này
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
                chapter ? "Cập nhật" : "Tạo chương"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
