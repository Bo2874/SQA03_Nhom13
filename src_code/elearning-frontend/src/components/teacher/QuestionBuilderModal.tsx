"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect } from "react";
import { QuestionType } from "@/@types/Quiz.type";
import type { ExamQuestion } from "@/@types/Exam.type";
import examsAPI from "@/apis/exams";
import toast from "react-hot-toast";

interface QuestionBuilderModalProps {
  examId: number; // Add examId prop
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: ExamQuestion | null;
}

const questionSchema = yup.object({
  question_text: yup
    .string()
    .required("Câu hỏi không được để trống")
    .min(3, "Câu hỏi phải có ít nhất 3 ký tự"),
  question_type: yup.string().optional(),
  points: yup.number().optional(),
  explanation: yup.string(),
  options: yup.array().of(
    yup.object({
      option_text: yup.string().required("Đáp án không được để trống"),
      is_correct: yup.boolean(),
    })
  ),
});

type QuestionFormData = yup.InferType<typeof questionSchema>;

export default function QuestionBuilderModal({
  examId,
  isOpen,
  onClose,
  onSuccess,
  question,
}: QuestionBuilderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm<QuestionFormData>({
    resolver: yupResolver(questionSchema),
    defaultValues: {
      question_text: "",
      question_type: QuestionType.SINGLE_CHOICE,
      points: 10,
      explanation: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    },
  });

  // Reset form when modal opens/closes or question changes
  useEffect(() => {
    if (!isOpen) {
      // Reset to default when modal closes
      reset({
        question_text: "",
        question_type: QuestionType.SINGLE_CHOICE,
        points: 10,
        explanation: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      });
    } else if (question) {
      // Load question data for editing
      // Backend doesn't store question_type, so we default to SINGLE_CHOICE
      reset({
        question_text: question.content,
        question_type: QuestionType.SINGLE_CHOICE, // Always default to SINGLE_CHOICE
        points: question.points,
        explanation: question.explanation || "",
        options: question.options?.map((opt) => {
          return {
            option_text: opt.option_text || opt.content, // Backend uses 'content', frontend uses 'option_text'
            is_correct: opt.isCorrect,
          };
        }) || [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      });
    } else {
      // Reset to default for new question
      reset({
        question_text: "",
        question_type: QuestionType.SINGLE_CHOICE,
        points: 10,
        explanation: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      });
    }
  }, [isOpen, question, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const questionType = watch("question_type");

  const onSubmit = async (data: QuestionFormData) => {
    const hasCorrectAnswer = data.options?.some((opt) => opt.is_correct);
    if (!hasCorrectAnswer) {
      toast.error("Vui lòng chọn ít nhất một đáp án đúng");
      return;
    }

    if (questionType === QuestionType.SINGLE_CHOICE) {
      const correctCount =
        data.options?.filter((opt) => opt.is_correct).length || 0;
      if (correctCount > 1) {
        toast.error("Câu hỏi một đáp án chỉ được có 1 đáp án đúng");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Bước 1: Tạo hoặc cập nhật câu hỏi
      const questionData = {
        examId,
        content: data.question_text,
        order: 1, // Default order
      };

      let createdQuestion: any;
      if (question) {
        // Cập nhật câu hỏi đã tồn tại
        createdQuestion = await examsAPI.updateExamQuestion(
          examId,
          question.id,
          questionData
        );
      } else {
        // Tạo câu hỏi mới
        createdQuestion = await examsAPI.createExamQuestion(questionData);
      }

      // Bước 2: Lấy questionId từ response
      // Backend trả về: { result: { id: ..., content: ... }, message: "success" }
      let questionId: number | undefined;

      if (createdQuestion?.result?.id) {
        questionId = createdQuestion.result.id;
      } else if (createdQuestion?.id) {
        questionId = createdQuestion.id;
      } else if (question?.id) {
        questionId = question.id; // Fallback cho update
      }

      if (!questionId) {
        toast.error("Lỗi: Không lấy được ID câu hỏi");
        return;
      }

      // Bước 3: Xử lý đáp án
      if (data.options && data.options.length > 0) {
        // Nếu đang update câu hỏi, xóa tất cả đáp án cũ trước
        if (question && question.options && question.options.length > 0) {
          for (const oldOption of question.options) {
            try {
              await examsAPI.deleteExamAnswer(
                examId,
                questionId,
                oldOption.id
              );
            } catch (deleteError: any) {
              console.error(`Không thể xóa đáp án cũ ID ${oldOption.id}:`, deleteError);
              // Continue deleting other answers even if one fails
            }
          }
        }

        // Tạo đáp án mới
        for (let i = 0; i < data.options.length; i++) {
          const option = data.options[i];
          if (option.option_text.trim()) {
            try {
              await examsAPI.createExamAnswer({
                examId,
                questionId,
                content: option.option_text,
                isCorrect: option.is_correct ?? false,
              });
            } catch (answerError: any) {
              throw new Error(
                `Không thể tạo đáp án "${option.option_text}": ${answerError.response?.data?.message || answerError.message}`
              );
            }
          }
        }
      }

      toast.success(question ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi");
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      toast.error(errorMessage);
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

  // Set default options based on question type
  const handleQuestionTypeChange = (type: QuestionType) => {
    if (type === QuestionType.TRUE_FALSE) {
      reset({
        ...watch(),
        question_type: type,
        options: [
          { option_text: "Đúng", is_correct: false },
          { option_text: "Sai", is_correct: false },
        ],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-dark/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {question ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("question_text")}
              rows={3}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {errors.question_text && (
              <p className="text-red-500 text-sm mt-1">
                {errors.question_text.message}
              </p>
            )}
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Các đáp án <span className="text-red-500">*</span>
              </label>
              {questionType !== QuestionType.TRUE_FALSE && (
                <button
                  type="button"
                  onClick={() => append({ option_text: "", is_correct: false })}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  + Thêm đáp án
                </button>
              )}
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {questionType === QuestionType.SINGLE_CHOICE ?
                      <input
                        type="radio"
                        checked={watch(`options.${index}.is_correct`)}
                        onChange={() => {
                          // Đặt tất cả đáp án về false, chỉ đáp án được chọn là true
                          const currentOptions = watch("options");
                          currentOptions.forEach((_, i) => {
                            setValue(`options.${i}.is_correct`, i === index);
                          });
                        }}
                        className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                      />
                    : <input
                        type="checkbox"
                        {...register(`options.${index}.is_correct`)}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                    }
                  </div>

                  <input
                    type="text"
                    {...register(`options.${index}.option_text`)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={questionType === QuestionType.TRUE_FALSE}
                  />

                  {questionType !== QuestionType.TRUE_FALSE &&
                    fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {questionType === QuestionType.SINGLE_CHOICE &&
                "Chọn 1 đáp án đúng"}
              {questionType === QuestionType.MULTIPLE_CHOICE &&
                "Chọn 1 hoặc nhiều đáp án đúng"}
              {questionType === QuestionType.TRUE_FALSE && "Chọn Đúng hoặc Sai"}
            </p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giải thích đáp án (tùy chọn)
            </label>
            <textarea
              {...register("explanation")}
              rows={2}
              placeholder="Giải thích tại sao đáp án này đúng..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Giải thích sẽ hiển thị cho học sinh sau khi hoàn thành bài kiểm
              tra
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ?
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang lưu...
                </>
              : question ?
                "Cập nhật câu hỏi"
              : "Thêm câu hỏi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
