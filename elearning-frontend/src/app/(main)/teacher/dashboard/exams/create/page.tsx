"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import examsAPI from "@/apis/exams";
import coursesAPI from "@/apis/courses";
import authAPI from "@/apis/auth";
import { ExamStatus } from "@/@types/Exam.type";
import toast from "react-hot-toast";

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
  status: yup.string().oneOf(Object.values(ExamStatus)),
});

type ExamFormData = yup.InferType<typeof examSchema>;

export default function CreateExamPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  
  // Get user from localStorage and parse it
  const getUserFromLocalStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  };
  
  const currentUser = getUserFromLocalStorage();

  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch teacher's courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await coursesAPI.getCourses();
        // Handle different response structures
        let coursesData = [];
        if ((res as any).result?.courses) {
          coursesData = (res as any).result.courses;
        } else if ((res as any).result?.data) {
          coursesData = (res as any).result.data;
        } else if ((res as any).result) {
          coursesData = (res as any).result;
        }
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]);
        toast.error("Không thể tải danh sách khóa học");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ExamFormData>({
    resolver: yupResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      course_id: null,
      duration_minutes: 45,
      status: ExamStatus.DRAFT,
    },
  });

  const formData = watch();

  const onSubmit = async (data: ExamFormData) => {
    setCreating(true);
    try {
      // Validate user exists
      if (!currentUser || !currentUser.id) {
        toast.error("Vui lòng đăng nhập lại");
        setCreating(false);
        router.push("/signin");
        return;
      }

      const createData = {
        teacherId: currentUser.id,
        courseId: data.course_id || undefined,
        title: data.title,
        description: data.description || undefined,
        durationMinutes: data.duration_minutes,
        status: data.status,
      };
      
      const response = await examsAPI.createExam(createData);
      toast.success("Đã tạo bài kiểm tra thành công!");
      
      const examId = (response as any).result?.id || (response as any).id;
      if (examId) {
        router.push(`/teacher/dashboard/exams/${examId}/edit`);
      } else {
        router.push("/teacher/dashboard/exams");
      }
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc chắn muốn hủy? Thông tin đã nhập sẽ bị mất.")) {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tạo bài kiểm tra mới</h1>
                <p className="text-sm text-gray-500">Điền thông tin cơ bản, sau đó thêm câu hỏi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={creating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={creating}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  creating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary-500 hover:bg-primary-600 text-gray-900"
                }`}
              >
                {creating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo bài kiểm tra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Thông tin cơ bản</h2>

          <form className="space-y-6">
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

            {/* Course Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khóa học (tùy chọn)
              </label>
              <select
                {...register("course_id")}
                disabled={loadingCourses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Không gắn với khóa học nào</option>
                {Array.isArray(courses) && courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Chọn khóa học nếu bài kiểm tra này thuộc về một khóa học cụ thể. Bài kiểm tra sẽ hiển thị trong trang chi tiết khóa học.
              </p>
              {errors.course_id && (
                <p className="text-red-500 text-sm mt-1">{errors.course_id.message}</p>
              )}
            </div>

            {/* Duration */}
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={ExamStatus.DRAFT}>Nháp</option>
                <option value={ExamStatus.LIVE}>Đang mở</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Chọn "Nháp" để lưu tạm, "Đang mở" để học viên có thể làm bài
              </p>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Lưu ý</p>
              <p className="text-sm text-blue-700">
                Sau khi tạo bài kiểm tra, bạn sẽ được chuyển đến trang chỉnh sửa để thêm câu hỏi và đáp án.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
