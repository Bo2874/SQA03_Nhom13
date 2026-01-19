"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import examsAPI from "@/apis/exams";
import { Exam, ExamStatus } from "@/@types/Exam.type";
import toast from "react-hot-toast";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ExamStatus | "all">("all");

  // Fetch exams from API
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = selectedStatus === "all" ? {} : { status: selectedStatus };
        const response = await examsAPI.getExams(params);
        
        // Backend returns { message: "success", result: [...] }
        const examsList = (response as any).result || (response as any).data || [];
        
        // Map backend camelCase to frontend snake_case
        const mappedExams = examsList.map((exam: any) => ({
          ...exam,
          teacher_id: exam.teacherId,
          duration_minutes: exam.durationMinutes,
          passing_score: exam.passingScore || 50,
          max_attempts: exam.maxAttempts,
          created_at: exam.createdAt,
          updated_at: exam.updatedAt,
        }));
        
        setExams(mappedExams);
      } catch (err: any) {
        console.error("Error fetching exams:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách bài kiểm tra");
        toast.error("Không thể tải danh sách bài kiểm tra");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedStatus]);

  // Filter exams (client-side search)
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: ExamStatus) => {
    const statusConfig = {
      [ExamStatus.DRAFT]: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Nháp",
      },
      [ExamStatus.PENDING_REVIEW]: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
      },
      [ExamStatus.APPROVED]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Đã duyệt",
      },
      [ExamStatus.LIVE]: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đang mở",
      },
      [ExamStatus.CLOSED]: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Đã đóng",
      },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Không giới hạn";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) {
      return;
    }

    try {
      await examsAPI.deleteExam(id);
      toast.success("Xóa bài kiểm tra thành công");
      // Refresh the exams list
      setExams((prev) => prev.filter((exam) => exam.id !== id));
    } catch (err: any) {
      console.error("Error deleting exam:", err);
      toast.error(err.response?.data?.message || "Không thể xóa bài kiểm tra");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý bài kiểm tra</h1>
          <p className="text-gray-600">
            Tạo và quản lý các bài kiểm tra, đề thi
          </p>
        </div>
        <Link
          href="/teacher/dashboard/exams/create"
          className="px-6 py-3 bg-primary-400 hover:bg-primary-300 text-gray-900 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo bài kiểm tra mới
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên bài kiểm tra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === "all"
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({exams.length})
            </button>
            <button
              onClick={() => setSelectedStatus(ExamStatus.DRAFT)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === ExamStatus.DRAFT
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Nháp ({exams.filter((e: Exam) => e.status === ExamStatus.DRAFT).length})
            </button>
            <button
              onClick={() => setSelectedStatus(ExamStatus.LIVE)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === ExamStatus.LIVE
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đang mở ({exams.filter((e: Exam) => e.status === ExamStatus.LIVE).length})
            </button>
            <button
              onClick={() => setSelectedStatus(ExamStatus.CLOSED)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === ExamStatus.CLOSED
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã đóng ({exams.filter((e: Exam) => e.status === ExamStatus.CLOSED).length})
            </button>
          </div>
        </div>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg">Không tìm thấy bài kiểm tra nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map((exam) => {
            // TODO: Add backend API endpoints for these features
            // const questions = getQuestionsByExamId(exam.id);
            // const totalPoints = getExamTotalPoints(exam.id);
            // const submissions = getSubmissionsByExamId(exam.id);
            const hasEnded = exam.end_time ? new Date(exam.end_time) < new Date() : false;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {exam.title}
                      </h3>
                      {getStatusBadge(exam.status)}
                    </div>
                    {exam.description && (
                      <p className="text-gray-600 mb-3">{exam.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">{exam.duration_minutes} phút</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {/* <span className="text-gray-600">{questions.length} câu hỏi</span> */}
                    <span className="text-gray-600">{ exam?.questionCount } câu hỏi</span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-gray-600">-- điểm</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">Điểm đạt: {exam.passing_score}%</span>
                  </div> */}
                </div>

                {(exam.start_time || exam.end_time) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {exam.start_time && (
                        <div>
                          <span className="font-medium text-blue-900">Bắt đầu: </span>
                          <span className="text-blue-700">{formatDateTime(exam.start_time)}</span>
                        </div>
                      )}
                      {exam.end_time && (
                        <div>
                          <span className="font-medium text-blue-900">Kết thúc: </span>
                          <span className="text-blue-700">{formatDateTime(exam.end_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">
                      Cập nhật: {new Date(exam.submittedAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* {hasEnded && submissions.length > 0 && ( */}
                    {hasEnded && false && (
                      <Link
                        href={`/teacher/dashboard/exams/${exam.id}/results`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Xem kết quả"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </Link>
                    )}
                    {/* <Link
                      href={`/teacher/dashboard/exams/${exam.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link> */}
                    <Link
                      href={`/teacher/dashboard/exams/${exam.id}/edit`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
