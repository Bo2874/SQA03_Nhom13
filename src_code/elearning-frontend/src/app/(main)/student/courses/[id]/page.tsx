"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import coursesAPI from "@/apis/courses";
import enrollmentsAPI from "@/apis/enrollments";
import examsAPI from "@/apis/exams";
import { Course, Chapter, Episode, Enrollment, CourseMaterial } from "@/@types/Course.type";
import { User } from "@/@types/User.type";
import { getCurrentUserFromToken } from "@/apis/auth";
import { toast } from "react-hot-toast";
import { formatFileSize, getFileIcon } from "@/utils/cloudinary";

interface ChapterWithEpisodes extends Chapter {
  episodes: Episode[];
}

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const courseId = Number(params.id);

  // State quản lý dữ liệu khóa học
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<ChapterWithEpisodes[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examAttempts, setExamAttempts] = useState<Record<number, any>>({});
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);

  // Tải thông tin user từ localStorage hoặc API
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Ưu tiên lấy từ localStorage
        const storedData = localStorage.getItem("user");
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setUser(parsed);
          return;
        }

        // Nếu không có trong localStorage, lấy từ API (sử dụng cookie)
        const userResponse = await getCurrentUserFromToken();
        const userData = userResponse.result;

        // Lưu vào localStorage để sử dụng lần sau
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      }
    };

    loadUser();
  }, []);

  // Tải dữ liệu khóa học và trạng thái đăng ký
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // Tải thông tin khóa học
        const courseResponse = await coursesAPI.getCourseById(courseId);
        if (courseResponse.result) {
          setCourse(courseResponse.result);

          // Lọc chỉ hiển thị các bài kiểm tra đã LIVE hoặc APPROVED cho học sinh
          if ((courseResponse.result as any).exams) {
            const availableExams = ((courseResponse.result as any).exams || []).filter(
              (exam: any) => exam.status === 'LIVE' || exam.status === 'APPROVED'
            );
            setExams(availableExams);
          }

          // Lấy danh sách Zoom meetings
          if ((courseResponse.result as any).zoomMeetings) {
            setZoomMeetings((courseResponse.result as any).zoomMeetings);
          }

          // Lấy danh sách tài liệu
          if ((courseResponse.result as any).materials) {
            setMaterials((courseResponse.result as any).materials);
          }

          // Lấy thông tin đăng ký khóa học (nếu user đã đăng nhập)
          if ((courseResponse.result as any).enrollment) {
            setEnrollment((courseResponse.result as any).enrollment);
          } else if (user) {
            // Fallback: tải enrollment riêng nếu không có trong response
            try {
              const enrollmentsResponse = await enrollmentsAPI.getSubscribedCourses();
              if (enrollmentsResponse.result?.enrollments) {
                const userEnrollment = enrollmentsResponse.result.enrollments.find(
                  (e: any) => e.course?.id === courseId || e.courseId === courseId
                );
                if (userEnrollment) {
                  setEnrollment(userEnrollment);
                }
              }
            } catch (error) {
              console.error("Error fetching enrollment:", error);
            }
          }
        }

        // Tải danh sách chương
        const chaptersResponse = await coursesAPI.getAllChapters(courseId);
        if (chaptersResponse.result) {
          // Tải bài học cho từng chương
          const chaptersWithEpisodes = await Promise.all(
            chaptersResponse.result.map(async (chapter) => {
              try {
                const episodesResponse = await coursesAPI.getAllEpisodes(
                  courseId,
                  chapter.id
                );
                return {
                  ...chapter,
                  episodes: episodesResponse.result || [],
                };
              } catch (error) {
                console.error(
                  `Error fetching episodes for chapter ${chapter.id}:`,
                  error
                );
                return {
                  ...chapter,
                  episodes: [],
                };
              }
            })
          );
          setChapters(chaptersWithEpisodes);
          // Mở rộng chương đầu tiên mặc định
          if (chaptersWithEpisodes.length > 0) {
            setExpandedChapters([chaptersWithEpisodes[0].id]);
          }
        }
      } catch (error: any) {
        console.error("Error fetching course data:", error);
        toast.error(error.message || "Không thể tải thông tin khóa học");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  // Tải kết quả bài kiểm tra của học sinh (nếu đã đăng ký và có bài kiểm tra)
  useEffect(() => {
    const fetchExamAttempts = async () => {
      if (!enrollment || exams.length === 0) return;

      const attemptsMap: Record<number, any> = {};
      await Promise.all(
        exams.map(async (exam) => {
          try {
            const attemptResponse = await examsAPI.getMyExamAttempt(exam.id);
            if (attemptResponse.result) {
              attemptsMap[exam.id] = attemptResponse.result;
            }
          } catch (error) {
            // Chưa có attempt cho bài kiểm tra này
          }
        })
      );
      setExamAttempts(attemptsMap);
    };

    fetchExamAttempts();
  }, [enrollment, exams]);

  // Xử lý đăng ký khóa học
  const handleEnroll = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học");
      router.push("/login");
      return;
    }

    try {
      setIsEnrolling(true);
      const response = await enrollmentsAPI.createEnrollment(courseId, {
        studentId: user.id,
      });

      if (response.result) {
        setEnrollment(response.result);
        toast.success("Đăng ký khóa học thành công!");
      }
    } catch (error: any) {
      console.error(error.message);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Không thể đăng ký khóa học. Vui lòng thử lại!");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Mở/đóng chương trong danh sách
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId) ?
        prev.filter((id) => id !== chapterId)
      : [...prev, chapterId]
    );
  };

  // Format thời lượng từ giây sang giờ/phút
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  // Tính tổng số bài học
  const totalEpisodes = chapters.reduce(
    (total, chapter) => total + chapter.episodes.length,
    0
  );

  // Tính tổng thời lượng khóa học
  const totalDuration = chapters.reduce(
    (total, chapter) =>
      total +
      chapter.episodes.reduce((sum, ep) => sum + (ep.durationSeconds || 0), 0),
    0
  );

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy khóa học
          </h1>
          <button
            onClick={() => router.back()}
            className="text-primary-500 hover:text-primary-600">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Quay lại
              </button>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {course.summary ||
                  "Để có cái nhìn tổng quan về ngành IT - Lập trình web các bạn nên xem các videos tại khóa này trước nhé."}
              </p>

              {/* Enrollment Status */}
              {enrollment && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">
                      Bạn đã đăng ký khóa học này
                    </span>
                  </div>
                  {/* <p className="text-sm text-green-600 mt-1">
                    Tiến trình: {enrollment.progress_percentage}%
                  </p> */}
                </div>
              )}
            </div>

            {/* Course Curriculum */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Nội dung khóa học
                </h2>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span>
                  <strong>{chapters.length}</strong> chương
                </span>
                <span>•</span>
                <span>
                  <strong>{totalEpisodes}</strong> bài học
                </span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Thời lượng{" "}
                      <strong>{formatDuration(totalDuration)}</strong>
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {chapters.map((chapter, index) => {
                  const isExpanded = expandedChapters.includes(chapter.id);
                  const chapterDuration = chapter.episodes.reduce(
                    (sum, ep) => sum + (ep.durationSeconds || 0),
                    0
                  );

                  return (
                    <div
                      key={chapter.id}
                      className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <svg
                            className={`w-5 h-5 text-red-500 transition-transform ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">
                              {index + 1}. {chapter.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {chapter.episodes.length} bài học
                            </p>
                          </div>
                        </div>
                        {chapterDuration > 0 && (
                          <div className="text-sm text-gray-600">
                            {formatDuration(chapterDuration)}
                          </div>
                        )}
                      </button>

                      {/* Episodes List */}
                      {isExpanded && (
                        <div className="bg-white">
                          {chapter.episodes.map((episode, epIndex) => (
                            <div
                              key={episode.id}
                              className="flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                if (enrollment) {
                                  router.push(
                                    `/student/courses/${courseId}/lessons/${episode.id}`
                                  );
                                } else {
                                  toast.error(
                                    "Vui lòng đăng ký khóa học trước"
                                  );
                                }
                              }}>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  {episode.type === "VIDEO" ?
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  : <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  }
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-900">
                                    {epIndex + 1}. {episode.title}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {episode.durationSeconds && (
                                  <span className="text-sm text-gray-600">
                                    {formatDuration(episode.durationSeconds)}
                                  </span>
                                )}
                                {!enrollment && (
                                  <svg
                                    className="w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exams Section - Only show if enrolled */}
            {exams.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Bài kiểm tra
                </h2>

                <div className="space-y-4">
                  {exams.map((exam, index) => (
                    <div
                      key={exam.id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-orange-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {index + 1}. {exam.title}
                            </h3>
                            {examAttempts[exam.id]?.submittedAt && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Đã hoàn thành
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Thời lượng: {exam.durationMinutes} phút</span>
                            </div>
                            {examAttempts[exam.id]?.submittedAt &&
                              examAttempts[exam.id]?.score !== undefined &&
                              examAttempts[exam.id]?.score !== null && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span
                                      className={`font-semibold ${Number(examAttempts[exam.id].score) >= 50 ? "text-green-600" : "text-red-600"}`}>
                                      Điểm:{" "}
                                      {Number(examAttempts[exam.id].score).toFixed(1)}
                                    </span>
                                  </div>
                                </>
                              )}
                            {!examAttempts[exam.id]?.submittedAt && enrollment && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className={enrollment.isCompleted ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                                    {enrollment.isCompleted ? "Có thể làm bài" : "Hoàn thành khóa học để làm bài"}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {examAttempts[exam.id]?.submittedAt ?
                          <button
                            onClick={() =>
                              router.push(
                                `/student/courses/${courseId}/exams/${exam.id}/results`
                              )
                            }
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Xem kết quả
                          </button>
                        : enrollment?.isCompleted ?
                          <button
                            onClick={() =>
                              router.push(
                                `/student/courses/${courseId}/exams/${exam.id}/take`
                              )
                            }
                            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            Làm bài
                          </button>
                        : <button
                            disabled
                            className="px-6 py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
                            title="Hoàn thành khóa học để làm bài">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            Chưa thể làm bài
                          </button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zoom Meetings Section - Only show if enrolled */}
            {zoomMeetings.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Zoom Meetings
                  </h2>
                </div>

                <div className="space-y-4">
                  {zoomMeetings.map((meeting, index) => {
                    const now = new Date();
                    const meetingDate =
                      meeting.scheduledTime ?
                        new Date(meeting.scheduledTime)
                      : null;
                    const isUpcoming = meetingDate && meetingDate > now;

                    // Calculate if meeting can be joined (15 minutes before to meeting end time)
                    const canJoin =
                      meetingDate ?
                        meetingDate.getTime() - 15 * 60 * 1000 <=
                          now.getTime() &&
                        now.getTime() <=
                          meetingDate.getTime() +
                            meeting.durationMinutes * 60 * 1000
                      : true; // If no scheduled time, allow joining anytime

                    // Calculate time remaining until meeting starts
                    const getTimeUntilMeeting = () => {
                      if (!meetingDate) return "";
                      const diff = meetingDate.getTime() - now.getTime();
                      if (diff <= 0) return "";

                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor(
                        (diff % (1000 * 60 * 60)) / (1000 * 60)
                      );

                      if (hours > 24) {
                        const days = Math.floor(hours / 24);
                        return `Còn ${days} ngày ${hours % 24} giờ`;
                      }
                      if (hours > 0) {
                        return `Còn ${hours} giờ ${minutes} phút`;
                      }
                      return `Còn ${minutes} phút`;
                    };

                    return (
                      <div
                        key={meeting.id}
                        className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {index + 1}. {meeting.title}
                              </h3>
                              {isUpcoming && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sắp diễn ra
                                </span>
                              )}
                            </div>
                            {meeting.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {meeting.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              {meetingDate && (
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>
                                    {meetingDate.toLocaleString("vi-VN", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>{meeting.durationMinutes} phút</span>
                              </div>
                              {meeting.zoomMeetingId && (
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                                    />
                                  </svg>
                                  <span>ID: {meeting.zoomMeetingId}</span>
                                </div>
                              )}
                              {meeting.meetingPassword && (
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                  <span>
                                    Mật khẩu: {meeting.meetingPassword}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {meeting.joinUrl && (
                            <div className="ml-4 flex flex-col items-end gap-2">
                              {meetingDate && getTimeUntilMeeting() && (
                                <span className="text-xs font-medium text-orange-600">
                                  {getTimeUntilMeeting()}
                                </span>
                              )}
                              {canJoin ?
                                <a
                                  href={meeting.joinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Tham gia
                                </a>
                              : <button
                                  disabled
                                  className="px-6 py-2.5 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
                                  title={`Meeting mở ${getTimeUntilMeeting()}`}>
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                  Chưa thể tham gia
                                </button>
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Materials Section - Show if materials available */}
            {materials && materials.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tài liệu khóa học
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials.map((material, index) => (
                    <div
                      key={material.id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-3xl">{getFileIcon(material.fileUrl)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {index + 1}. {material.title}
                            </h3>
                            {material.fileSizeKb && (
                              <p className="text-sm text-gray-500">
                                {formatFileSize(material.fileSizeKb * 1024)}
                              </p>
                            )}
                          </div>
                        </div>

                        <a
                          href={material.fileUrl}
                          download={material.title}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Tải xuống
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Course Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-red-500 via-purple-500 to-purple-700 rounded-2xl overflow-hidden text-white">
                {/* Video Preview */}
                <div className="relative aspect-video bg-dark/55 flex items-center justify-center">
                  {course.thumbnailUrl ?
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  : <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <svg
                          className="w-10 h-10 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                    </div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <div className="mb-6">
                    <div
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#FF6B9D" }}>
                      Miễn phí
                    </div>
                  </div>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Trình độ cơ bản</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <span>
                        Tổng số <strong>{totalEpisodes} bài học</strong>
                      </span>
                    </li>
                    {totalDuration > 0 && (
                      <li className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Thời lượng{" "}
                          <strong>{formatDuration(totalDuration)}</strong>
                        </span>
                      </li>
                    )}
                    <li className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span>Học mọi lúc, mọi nơi</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
