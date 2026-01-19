"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import enrollmentsAPI from "@/apis/enrollments";
import coursesAPI from "@/apis/courses";
import { Enrollment, Course, Episode } from "@/@types/Course.type";
import { User } from "@/@types/User.type";
import { getCurrentUserFromToken } from "@/apis/auth";
import { toast } from "react-hot-toast";

export default function MyCoursesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress" | "completed">("all");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedProgress, setCalculatedProgress] = useState<{ [enrollmentId: number]: number }>({});
  const [resettingCourseId, setResettingCourseId] = useState<number | null>(null);

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

  // Fetch enrollments when user is loaded
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Backend automatically gets studentId from authenticated token
        // Get all enrollments (both active and completed) by not passing subscribed filter
        const response = await enrollmentsAPI.getSubscribedCourses();

        if (response.result?.enrollments) {
          const enrollmentsData = response.result.enrollments;
          setEnrollments(enrollmentsData);

          // Calculate progress for each enrollment
          await calculateProgressForEnrollments(enrollmentsData);
        }
      } catch (err: any) {
        console.error("Error fetching enrollments:", err);
        setError(err.message || "Không thể tải danh sách khóa học");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // Calculate progress based on current episode index
  const calculateProgressForEnrollments = async (enrollmentsData: any[]) => {
    const progressMap: { [enrollmentId: number]: number } = {};

    for (const enrollment of enrollmentsData) {
      try {
        const courseId = enrollment.course?.id;
        if (!courseId) continue;

        // Fetch enrollment detail to get lastEpisode
        const enrollmentDetail = await enrollmentsAPI.getEnrollmentById(
          courseId,
          enrollment.id
        );

        // Fetch all chapters and episodes
        const chaptersResponse = await coursesAPI.getAllChapters(courseId);
        const chaptersData = chaptersResponse.result;

        // Sort chapters by order first
        chaptersData.sort((a, b) => a.order - b.order);

        // Fetch episodes for each chapter (in order)
        const allEpisodes: Episode[] = [];
        for (const chapter of chaptersData) {
          try {
            const episodesResponse = await coursesAPI.getAllEpisodes(courseId, chapter.id);
            // Sort episodes within chapter by order
            const sortedEpisodes = episodesResponse.result.sort((a, b) => a.order - b.order);
            allEpisodes.push(...sortedEpisodes);
          } catch (err) {
            console.error(`Error fetching episodes for chapter ${chapter.id}:`, err);
          }
        }

        const totalEpisodes = allEpisodes.length;
        const lastEpisodeId = enrollmentDetail.result?.lastEpisode?.id;

        if (lastEpisodeId && totalEpisodes > 0) {
          // Find current index
          const currentIndex = allEpisodes.findIndex((ep) => ep.id === lastEpisodeId);
          if (currentIndex >= 0) {
            // Calculate progress: (currentIndex / totalEpisodes) * 100
            const progress = Math.round((currentIndex / totalEpisodes) * 100);
            progressMap[enrollment.id] = progress;
          } else {
            progressMap[enrollment.id] = 0;
          }
        } else {
          progressMap[enrollment.id] = 0;
        }
      } catch (err) {
        console.error(`Error calculating progress for enrollment ${enrollment.id}:`, err);
        progressMap[enrollment.id] = 0;
      }
    }

    setCalculatedProgress(progressMap);
  };

  // Filter enrolled courses
  const filteredCourses = enrollments.filter(enrollment => {
    const progress = calculatedProgress[enrollment.id] ?? 0;
    const isCompleted = enrollment.isCompleted || progress === 100;

    if (filterStatus === "in-progress") return !isCompleted;
    if (filterStatus === "completed") return isCompleted;
    return true;
  });

  const getProgressColor = (progress: number, isCompleted: boolean) => {
    if (isCompleted || progress === 100) return "bg-green-500";
    if (progress >= 50) return "bg-primary-500";
    return "bg-yellow-500";
  };

  const getStatusBadge = (progress: number, isCompleted: boolean) => {
    if (isCompleted || progress === 100) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          Đã hoàn thành
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        Đang học
      </span>
    );
  };

  const handleResetCourse = async (courseId: number, enrollmentId: number) => {
    if (!confirm("Bạn có chắc muốn học lại khóa học này từ đầu? Mọi tiến trình sẽ bị xóa.")) {
      return;
    }

    setResettingCourseId(enrollmentId);

    try {
      await enrollmentsAPI.resetCourse(courseId, enrollmentId);

      // Update local state
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId
            ? { ...e, isCompleted: false, status: "ACTIVE", progressPercentage: 0 }
            : e
        )
      );

      // Reset calculated progress
      setCalculatedProgress((prev) => ({
        ...prev,
        [enrollmentId]: 0,
      }));

      toast.success("Đã reset khóa học! Bạn có thể bắt đầu học lại từ đầu.");
    } catch (err: any) {
      console.error("Error resetting course:", err);
      toast.error("Có lỗi xảy ra khi reset khóa học");
    } finally {
      setResettingCourseId(null);
    }
  };

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h1>
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Khóa học của tôi</h1>
          <p className="text-gray-600">Quản lý và tiếp tục học tập các khóa học đã đăng ký</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng số khóa học</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => !e.isCompleted && (calculatedProgress[e.id] ?? 0) < 100).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.isCompleted || (calculatedProgress[e.id] ?? 0) === 100).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterStatus === "all"
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({enrollments.length})
            </button>
            <button
              onClick={() => setFilterStatus("in-progress")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterStatus === "in-progress"
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đang học ({enrollments.filter(e => !e.isCompleted && (calculatedProgress[e.id] ?? 0) < 100).length})
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterStatus === "completed"
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã hoàn thành ({enrollments.filter(e => e.isCompleted || (calculatedProgress[e.id] ?? 0) === 100).length})
            </button>
          </div>
        </div>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Không tìm thấy khóa học nào</p>
            <Link
              href="/student/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;

              const progress = calculatedProgress[enrollment.id] ?? 0;
              const isCompleted = enrollment.isCompleted || false;

              return (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail */}
                    <div className="md:w-64 aspect-video md:aspect-auto bg-gray-200 relative flex-shrink-0">
                      {course.thumbnailUrl ? (
                        <Image
                          src={course.thumbnailUrl || "https://sf-static.upanhlaylink.com/view/image_20251225a9dcbf7f5797856bc744d79ac3569931.jpg"}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                            {getStatusBadge(progress, isCompleted)}
                          </div>
                          <p className="text-gray-600 line-clamp-2 mb-3">
                            {course.summary || "Chưa có mô tả"}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Tiến trình học tập</span>
                          <span className="text-sm font-semibold text-gray-900">{isCompleted ? 100 : progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getProgressColor(progress, isCompleted)} h-2 rounded-full transition-all`}
                            style={{ width: `${isCompleted ? 100 : progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Đăng ký: {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                          </span>
                          {enrollment.status && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {enrollment.status}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/student/courses/${course.id}`}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                          >
                            Xem khóa học
                          </Link>
                          {isCompleted ? (
                            <>
                              {/* <Link
                                href={`/student/courses/${course.id}/start`}
                                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors"
                              >
                                Xem lại
                              </Link> */}
                              <button
                                onClick={() => handleResetCourse(course.id, enrollment.id)}
                                disabled={resettingCourseId === enrollment.id}
                                className="px-4 py-2 border border-orange-500 hover:bg-orange-50 text-orange-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {resettingCourseId === enrollment.id ? "Đang reset..." : "Học lại từ đầu"}
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/student/courses/${course.id}/start`}
                              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors"
                            >
                              Tiếp tục học
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
