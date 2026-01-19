"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import examsAPI from "@/apis/exams";
import { toast } from "react-hot-toast";

// Interface kết quả bài thi
interface ExamResult {
  id: number;
  score: number | string;
  timeSpentSeconds: number;
  submittedAt: string;
  responsesJson: Record<number, number>;  // Câu trả lời của học sinh: {questionId: answerId}
  exam: {
    id: number;
    title: string;
    description?: string;
    durationMinutes: number;
    questions: ExamQuestion[];
  };
}

// Interface câu hỏi thi
interface ExamQuestion {
  id: number;
  content: string;
  imageUrl?: string;
  order: number;
  answers: ExamAnswer[];
}

// Interface đáp án
interface ExamAnswer {
  id: number;
  content: string;
  isCorrect: boolean;  // Đáp án đúng hay sai
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const examId = Number(params.examId);

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Tải kết quả bài thi từ API
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const response = await examsAPI.getMyExamAttempt(examId);
        const attemptData = response.result || response;

        // Kiểm tra xem đã nộp bài chưa
        if (!attemptData || !attemptData.submittedAt) {
          toast.error("Chưa hoàn thành bài kiểm tra");
          router.push(`/student/courses/${courseId}`);
          return;
        }

        setResult(attemptData);
      } catch (error: any) {
        console.error("Error loading results:", error);
        toast.error("Không thể tải kết quả");
        router.push(`/student/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [examId, courseId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Tính toán số câu đúng
  const totalQuestions = result.exam.questions.length;
  const correctAnswers = result.exam.questions.filter((q) => {
    const studentAnswerId = result.responsesJson[q.id];  // Lấy ID đáp án học sinh đã chọn
    const correctAnswer = q.answers.find((a) => a.isCorrect);  // Tìm đáp án đúng
    return correctAnswer && studentAnswerId === correctAnswer.id;  // So sánh
  }).length;

  // Format thời gian làm bài
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const scoreValue = Number(result.score);
  const isPassed = scoreValue >= 50; // Điểm đạt: >= 50%

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 pb-12">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            isPassed ? "bg-green-100" : "bg-red-100"
          }`}>
            {isPassed ? (
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPassed ? "Chúc mừng!" : "Tiếc quá!"}
          </h1>
          <p className="text-gray-600">
            {isPassed
              ? "Bạn đã hoàn thành bài kiểm tra"
              : "Bạn cần cố gắng thêm"}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{result.exam.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Điểm số</div>
              <div className={`text-4xl font-bold ${
                isPassed ? "text-green-600" : "text-red-600"
              }`}>
                {scoreValue.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">/ 100</div>
            </div>

            {/* Correct Answers */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Câu đúng</div>
              <div className="text-4xl font-bold text-green-600">
                {correctAnswers}
              </div>
              <div className="text-xs text-gray-500 mt-1">/ {totalQuestions} câu</div>
            </div>

            {/* Time Spent */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Thời gian</div>
              <div className="text-xl font-bold text-orange-600">
                {formatTime(result.timeSpentSeconds)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                / {result.exam.durationMinutes} phút
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Chi tiết bài làm</h3>

          <div className="space-y-6">
            {result.exam.questions.map((question, index) => {
              const studentAnswerId = result.responsesJson[question.id];
              const correctAnswer = question.answers.find((a) => a.isCorrect);
              const studentAnswer = question.answers.find((a) => a.id === studentAnswerId);
              const isCorrect = correctAnswer?.id === studentAnswerId;

              return (
                <div
                  key={question.id}
                  className={`p-6 rounded-lg border-2 ${
                    isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {/* Question */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{question.content}</p>
                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="mt-2 rounded-lg max-h-48 object-contain"
                        />
                      )}
                    </div>
                    <div>
                      {isCorrect ? (
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="ml-11 space-y-2">
                    {!isCorrect && studentAnswer && (
                      <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg border border-red-300">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-xs text-red-600 font-medium">Bạn đã chọn:</div>
                          <div className="text-sm text-red-900">{studentAnswer.content}</div>
                        </div>
                      </div>
                    )}

                    {correctAnswer && (
                      <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border border-green-300">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-xs text-green-600 font-medium">
                            {isCorrect ? "Bạn đã chọn đúng:" : "Đáp án đúng:"}
                          </div>
                          <div className="text-sm text-green-900">{correctAnswer.content}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Quay lại khóa học
          </button>
        </div>
      </div>
    </div>
  );
}
