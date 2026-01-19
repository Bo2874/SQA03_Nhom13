"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import coursesAPI from "@/apis/courses";
import enrollmentsAPI from "@/apis/enrollments";
import { Course, Chapter, Episode, Enrollment } from "@/@types/Course.type";
import { User } from "@/@types/User.type";
import { getCurrentUserFromToken } from "@/apis/auth";
import { toast } from "react-hot-toast";

interface ChapterWithEpisodes extends Chapter {
  episodes: Episode[];
}

export default function StudentCourseDetailPage1() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<ChapterWithEpisodes[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);

  // Get user from localStorage or API
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to get from localStorage first
        const storedData = localStorage.getItem("user");
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setUser(parsed);
          return;
        }

        // If not in localStorage, try to get from API (using cookie)
        const userResponse = await getCurrentUserFromToken();
        const userData = userResponse.result;

        // Save to localStorage for next time
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      }
    };

    loadUser();
  }, []);

  // Fetch course data and enrollment status
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // Fetch course details
        const courseResponse = await coursesAPI.getCourseById(courseId);
        if (courseResponse.result) {
          setCourse(courseResponse.result);
        }

        // Fetch chapters
        const chaptersResponse = await coursesAPI.getAllChapters(courseId);
        if (chaptersResponse.result) {
          // Fetch episodes for each chapter
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
                console.error(`Error fetching episodes for chapter ${chapter.id}:`, error);
                return {
                  ...chapter,
                  episodes: [],
                };
              }
            })
          );
          setChapters(chaptersWithEpisodes);
          // Expand first chapter by default
          if (chaptersWithEpisodes.length > 0) {
            setExpandedChapters([chaptersWithEpisodes[0].id]);
          }
        }

        // Check if user is enrolled
        if (user) {
          try {
            // Backend automatically gets studentId from authenticated token
            const enrollmentsResponse = await enrollmentsAPI.getSubscribedCourses({
              subscribed: true,
            });

            if (enrollmentsResponse.result?.enrollments) {
              const userEnrollment = enrollmentsResponse.result.enrollments.find(
                (e: Enrollment) => e.course_id === courseId
              );
              if (userEnrollment) {
                setEnrollment(userEnrollment);
              }
            }
          } catch (error) {
            console.error("Error checking enrollment:", error);
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

        // Redirect to first lesson if available
        if (chapters.length > 0 && chapters[0].episodes.length > 0) {
          router.push(`/student/courses/${courseId}/lessons/${chapters[0].episodes[0].id}`);
        }
      }
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Không thể đăng ký khóa học. Vui lòng thử lại!");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  const totalEpisodes = chapters.reduce(
    (total, chapter) => total + chapter.episodes.length,
    0
  );

  const totalDuration = chapters.reduce(
    (total, chapter) =>
      total +
      chapter.episodes.reduce(
        (sum, ep) => sum + (ep.durationSeconds || 0),
        0
      ),
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
            className="text-primary-500 hover:text-primary-600"
          >
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
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                      viewBox="0 0 20 20"
                    >
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
                      Thời lượng <strong>{formatDuration(totalDuration)}</strong>
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
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <svg
                            className={`w-5 h-5 text-red-500 transition-transform ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                                  toast.error("Vui lòng đăng ký khóa học trước");
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  {episode.type === "VIDEO" ? (
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-5 h-5 text-gray-400"
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
                                  )}
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
                                    viewBox="0 0 24 24"
                                  >
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
          </div>

          {/* Right Column - Course Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-red-500 via-purple-500 to-purple-700 rounded-2xl overflow-hidden text-white">
                {/* Video Preview */}
                <div className="relative aspect-video bg-dark/20 flex items-center justify-center">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <svg
                          className="w-10 h-10 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <div className="mb-6">
                    <div
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#FF6B9D" }}
                    >
                      Miễn phí
                    </div>
                  </div>

                  {enrollment ? (
                    <button
                      onClick={() => {
                        if (chapters.length > 0 && chapters[0].episodes.length > 0) {
                          router.push(
                            `/student/courses/${courseId}/lessons/${chapters[0].episodes[0].id}`
                          );
                        }
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors mb-4"
                    >
                      TIẾP TỤC HỌC
                    </button>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors mb-4"
                    >
                      {isEnrolling ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ HỌC"}
                    </button>
                  )}

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
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
                        viewBox="0 0 20 20"
                      >
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
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Thời lượng <strong>{formatDuration(totalDuration)}</strong>
                        </span>
                      </li>
                    )}
                    <li className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
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
