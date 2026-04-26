"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import examsAPI from "@/apis/exams";
import { getCurrentUserFromToken } from "@/apis/auth";
import { toast } from "react-hot-toast";

// Interface định nghĩa cấu trúc câu hỏi thi
interface ExamQuestion {
  id: number;
  content: string;
  imageUrl?: string;
  order: number;
  answers: ExamAnswer[];
}

// Interface định nghĩa cấu trúc đáp án
interface ExamAnswer {
  id: number;
  content: string;
  isCorrect?: boolean;
}

export default function ExamTakePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const examId = Number(params.examId);

  // State quản lý dữ liệu bài thi
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});  // Lưu câu trả lời: {questionId: answerId}
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);  // Thời gian còn lại (giây)
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const STORAGE_KEY = `exam_${examId}_attempt`;

  // === EFFECT 1: Tải dữ liệu bài thi và khởi tạo/phục hồi attempt ===
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);

        // Bước 1: Kiểm tra localStorage xem có attempt đang làm dở không
        const savedData = localStorage.getItem(STORAGE_KEY);
        let savedAttemptId: number | null = null;

        if (savedData) {
          const parsed = JSON.parse(savedData);
          const now = Date.now();

          if (parsed.attemptId && parsed.expiresAt > now) {
            // Phục hồi attempt cũ (chưa hết giờ)
            savedAttemptId = parsed.attemptId;
            setAttemptId(parsed.attemptId);
            setAnswers(parsed.answers || {});
            setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
            setTimeRemaining(Math.floor((parsed.expiresAt - now) / 1000));
          } else {
            // Attempt đã hết giờ, xóa dữ liệu cũ
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        // Bước 2: Tải dữ liệu bài thi từ API
        const examResponse = await examsAPI.getExamById(examId);
        const examData = examResponse.result || examResponse;
        setExam(examData);

        // Sắp xếp câu hỏi theo thứ tự
        const sortedQuestions = (examData.questions || []).sort(
          (a: ExamQuestion, b: ExamQuestion) => a.order - b.order
        );
        setQuestions(sortedQuestions);

        // Bước 3: Chỉ tạo attempt mới nếu chưa có attempt đang làm
        if (!savedAttemptId) {
          const currentUser = await getCurrentUserFromToken();
          const userId = currentUser?.result?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id;

          // Gọi API tạo attempt mới
          const attemptResponse = await examsAPI.startExamAttempt(examId, userId);
          const newAttemptId = (attemptResponse.result?.id || attemptResponse.id) as number;
          setAttemptId(newAttemptId);

          // Tính thời gian hết hạn
          const durationMs = examData.durationMinutes * 60 * 1000;
          const expiresAt = Date.now() + durationMs;
          setTimeRemaining(examData.durationMinutes * 60);

          // Lưu vào localStorage để có thể phục hồi nếu refresh
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              attemptId: newAttemptId,
              expiresAt,
              answers: {},
              currentQuestionIndex: 0,
            })
          );
        }
      } catch (error: any) {
        console.error("Error loading exam:", error);
        const errorMessage = error.response?.data?.message || error.message || "Không thể tải bài kiểm tra";
        toast.error(errorMessage);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // === EFFECT 2: Đếm ngược thời gian ===
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Hết giờ -> tự động nộp bài
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // === EFFECT 3: Lưu tiến trình làm bài vào localStorage ===
  useEffect(() => {
    if (!attemptId || !exam) return;

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          answers,  // Cập nhật câu trả lời mới nhất
          currentQuestionIndex,  // Cập nhật câu hỏi hiện tại
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentQuestionIndex, attemptId, exam]);

  // Format thời gian từ giây sang MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Xử lý khi chọn đáp án
  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,  // Lưu: questionId -> answerId
    }));
  };

  // Chuyển sang câu tiếp theo
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Quay lại câu trước
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Nộp bài thi
  const handleSubmit = useCallback(async () => {
    // Kiểm tra còn câu nào chưa trả lời
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Bạn còn ${unanswered.length} câu chưa trả lời!`);
      return;
    }

    if (!attemptId) {
      toast.error("Không tìm thấy phiên làm bài");
      return;
    }

    // Ngăn submit trùng lặp
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      // Gọi API nộp bài
      await examsAPI.submitExamAttempt(examId, attemptId, answers);

      // Xóa dữ liệu localStorage ngay sau khi nộp thành công
      localStorage.removeItem(STORAGE_KEY);

      // Xóa attemptId để ngăn submit lại
      setAttemptId(null);

      toast.success("Đã nộp bài thành công!");
      router.push(`/student/courses/${courseId}/exams/${examId}/results`);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      const errorMessage = error.response?.data?.message || error.message || "Không thể nộp bài";
      toast.error(errorMessage);

      // Không xóa attemptId khi lỗi, cho phép thử lại
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, examId, answers, questions, STORAGE_KEY, router, courseId, submitting]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy bài kiểm tra
          </h1>
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerId = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{exam.title}</h1>
              <p className="text-gray-600 text-sm">
                Câu {currentQuestionIndex + 1} / {questions.length} • {answeredCount} đã trả lời
              </p>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Thời gian còn lại</div>
              <div
                className={`text-3xl font-bold ${
                  timeRemaining < 60 ? "text-red-500" : "text-gray-900"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`flex-1 h-2 rounded-full ${
                    idx === currentQuestionIndex
                      ? "bg-blue-500"
                      : answers[q.id]
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Question */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                {currentQuestionIndex + 1}
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-900 leading-relaxed">
                  {currentQuestion.content}
                </p>
                {currentQuestion.imageUrl && (
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="mt-4 rounded-lg max-h-64 object-contain border border-gray-200"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Answers */}
          <div className="p-6">
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswerId === answer.id;
                const letters = ['A', 'B', 'C', 'D'];
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {letters[index]}
                      </div>
                      <span className="text-gray-900">{answer.content}</span>
                      {isSelected && (
                        <svg
                          className="ml-auto w-6 h-6 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            {/* Question Navigator */}
            <div className="flex items-center gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    idx === currentQuestionIndex
                      ? "bg-blue-500 text-white"
                      : answers[questions[idx].id]
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Nộp bài
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                Câu tiếp
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
