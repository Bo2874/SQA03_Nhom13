"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import examsAPI from "@/apis/exams";
import coursesAPI from "@/apis/courses";
import type { Exam, ExamQuestion } from "@/@types/Exam.type";
import { ExamStatus } from "@/@types/Exam.type";
import QuestionBuilderModal from "@/components/teacher/QuestionBuilderModal";
import toast from "react-hot-toast";

const examSchema = yup.object({
  title: yup
    .string()
    .required("Tiêu đề bài kiểm tra không được để trống")
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  courseId: yup.number().nullable(),
  durationMinutes: yup
    .number()
    .required("Thời gian làm bài không được để trống")
    .min(1, "Thời gian phải lớn hơn 0")
    .typeError("Thời gian phải là số"),
  status: yup.string().oneOf(Object.values(ExamStatus)),
});

type ExamFormData = yup.InferType<typeof examSchema>;

export default function ExamEditPage() {
  const router = useRouter();
  const params = useParams();
  const examId = Number(params.id);

  // State management
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load courses first (needed for the dropdown)
        const coursesRes = await coursesAPI.getCourses();
        // Handle different response structures
        let coursesData = [];
        if ((coursesRes as any).result?.courses) {
          coursesData = (coursesRes as any).result.courses;
        } else if ((coursesRes as any).result?.data) {
          coursesData = (coursesRes as any).result.data;
        } else if ((coursesRes as any).result) {
          coursesData = (coursesRes as any).result;
        }
        setCourses(Array.isArray(coursesData) ? coursesData : []);

        // Then load exam data
        const examRes = await examsAPI.getExamById(examId);
        const examData = (examRes as any).result || examRes;
        setExam(examData);

        // Map backend data to frontend format
        const mappedQuestions = (examData.questions || []).map((q: any) => ({
          ...q,
          question_text: q.content || q.question_text, // Backend uses 'content'
          options: (q.answers || q.options || []).map((a: any) => ({
            ...a,
            option_text: a.content || a.option_text, // Backend uses 'content'
          })),
        }));
        setQuestions(mappedQuestions);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin bài kiểm tra");
        toast.error("Không thể tải thông tin bài kiểm tra");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ExamFormData>({
    resolver: yupResolver(examSchema),
    defaultValues: {
      title: "",
      courseId: null,
      durationMinutes: 45,
      status: ExamStatus.DRAFT,
    },
  });

  // Update form when exam AND courses both load
  useEffect(() => {
    if (exam && courses.length > 0) {
      // Extract courseId from exam (handle both direct courseId and course.id)
      let courseIdValue = null;
      if ((exam as any).courseId) {
        courseIdValue = Number((exam as any).courseId);
      } else if ((exam as any).course?.id) {
        courseIdValue = Number((exam as any).course.id);
      }

      reset({
        title: exam.title || "",
        courseId: courseIdValue,
        durationMinutes: exam.durationMinutes || 45,
        status: exam.status || ExamStatus.DRAFT,
      });
    } else if (exam && courses.length === 0) {
      // Reset form even if no courses (for exams without courseId)
      reset({
        title: exam.title || "",
        courseId: null,
        durationMinutes: exam.durationMinutes || 45,
        status: exam.status || ExamStatus.DRAFT,
      });
    }
  }, [exam, courses, reset]);

  const formData = watch();

   const onSubmit = async (data: ExamFormData) => {
    setSaving(true);
    try {
      await examsAPI.updateExam(examId, data);
      toast.success("Đã lưu thay đổi thành công!");
      // router.push("/teacher/dashboard/exams");
    } catch (error: any) {
      console.error("Error updating exam:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    
    try {
      await examsAPI.deleteExamQuestion(examId, questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
      toast.success("Đã xóa câu hỏi");
    } catch (err: any) {
      console.error("Error deleting question:", err);
      toast.error(err.response?.data?.message || "Không thể xóa câu hỏi");
    }
  };

  const handleQuestionSuccess = async () => {
    try {
      const examRes = await examsAPI.getExamById(examId);
      const examData = (examRes as any).result || examRes;
      
      // Map backend data to frontend format
      const mappedQuestions = (examData.questions || []).map((q: any) => ({
        ...q,
        question_text: q.content || q.question_text,
        options: (q.answers || q.options || []).map((a: any) => ({
          ...a,
          option_text: a.content || a.option_text,
        })),
      }));
      setQuestions(mappedQuestions);
      
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      toast.success("Đã lưu câu hỏi");
    } catch (err: any) {
      console.error("Error refreshing questions:", err);
      toast.error("Không thể tải lại danh sách câu hỏi");
    }
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất.")) {
      router.back();
    }
  };

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy bài kiểm tra
          </h1>
          <button
            onClick={() => router.push("/teacher/dashboard/exams")}
            className="text-primary-500 hover:text-primary-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Sticky Header */}
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
                <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa bài kiểm tra</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/teacher/dashboard/exams/${examId}/results`)}
                className="px-6 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Xem kết quả
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
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

                {/* Course Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khóa học (tùy chọn)
                  </label>
                  <select
                    {...register("courseId", {
                      setValueAs: (value) => value === "" ? null : Number(value)
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Không gắn với khóa học nào</option>
                    {Array.isArray(courses) && courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn khóa học nếu bài kiểm tra này thuộc về một khóa học cụ thể. Bài kiểm tra sẽ hiển thị trong trang chi tiết khóa học.
                  </p>
                  {errors.courseId && (
                    <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian làm bài (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("durationMinutes")}
                    min="1"
                    placeholder="45"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.durationMinutes && (
                    <p className="text-red-500 text-sm mt-1">{errors.durationMinutes.message}</p>
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
                    <option value={ExamStatus.CLOSED}>Đã đóng</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Teacher chỉ có thể chọn: Nháp, Đang mở, hoặc Đã đóng
                  </p>
                </div>
              </form>
            </div>

            {/* Questions Management */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Câu hỏi</h2>
                <button
                  onClick={handleCreateQuestion}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm câu hỏi
                </button>
              </div>

              {questions.length === 0 ? (
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500 mb-2">Chưa có câu hỏi nào</p>
                  <p className="text-sm text-gray-400">
                    Nhấn "Thêm câu hỏi" để bắt đầu tạo đề thi
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <p className="text-gray-900 font-medium flex-1">
                              {question.question_text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-11">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Một đáp án
                          {/* {question.question_type === "SINGLE_CHOICE" && "Một đáp án"}
                          {question.question_type === "MULTIPLE_CHOICE" && "Nhiều đáp án"}
                          {question.question_type === "TRUE_FALSE" && "Đúng/Sai"}
                          {question.question_type === "ESSAY" && "Tự luận"} */}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          1 điểm
                        </span>
                        {question.options && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            {question.options.length} đáp án
                          </span>
                        )}
                      </div>

                      {/* Show options */}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 ml-11 space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 text-sm p-2 rounded ${
                                option.is_correct
                                  ? "bg-green-50 text-green-900"
                                  : "bg-gray-50 text-gray-700"
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="flex-1">{option.option_text}</span>
                              {option.is_correct && (
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show explanation if exists */}
                      {question.explanation && (
                        <div className="mt-3 ml-11 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-xs font-medium text-blue-900 mb-1">Giải thích:</p>
                              <p className="text-sm text-blue-700">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview & Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">XEM TRƯỚC</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{formData.title || "Tiêu đề bài kiểm tra"}</h4>
                    {formData.description && (
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">
                        {formData.durationMinutes} phút
                      </span>
                    </div>

                    {/* <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">
                        Điểm đạt: {formData.passing_score}%
                      </span>
                    </div> */}

                    {formData.max_attempts && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-gray-600">
                          Tối đa {formData.max_attempts} lần làm
                        </span>
                      </div>
                    )}
                  </div>

                  {(formData.startTime || formData.endTime) && (
                    <div className="pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-600">
                      {formData.startTime && (
                        <div>
                          <span className="font-medium">Bắt đầu: </span>
                          {new Date(formData.startTime).toLocaleString("vi-VN")}
                        </div>
                      )}
                      {formData.endTime && (
                        <div>
                          <span className="font-medium">Kết thúc: </span>
                          {new Date(formData.endTime).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">THỐNG KÊ</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Số câu hỏi</span>
                      <span className="text-lg font-bold text-gray-900">
                        {questions.length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Trạng thái</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          formData.status === ExamStatus.LIVE
                            ? "bg-green-100 text-green-700"
                            : formData.status === ExamStatus.DRAFT
                            ? "bg-gray-100 text-gray-700"
                            : formData.status === ExamStatus.PENDING_REVIEW
                            ? "bg-yellow-100 text-yellow-700"
                            : formData.status === ExamStatus.APPROVED
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {formData.status === ExamStatus.DRAFT && "Nháp"}
                        {formData.status === ExamStatus.PENDING_REVIEW && "Chờ duyệt"}
                        {formData.status === ExamStatus.APPROVED && "Đã duyệt"}
                        {formData.status === ExamStatus.LIVE && "Đang mở"}
                        {formData.status === ExamStatus.CLOSED && "Đã đóng"}
                      </span>
                    </div>
                  </div>

                  {questions.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-yellow-800">
                          Cần ít nhất 1 câu hỏi để xuất bản bài kiểm tra
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Builder Modal */}
      <QuestionBuilderModal
        examId={examId}
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSuccess={handleQuestionSuccess}
        question={editingQuestion}
      />
    </div>
  );
}
