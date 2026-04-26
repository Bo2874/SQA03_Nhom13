"use client";

import { useEffect, useState } from "react";
import coursesAPI from "@/apis/courses";
import { Course } from "@/@types/Course.type";
import Link from "next/link";
import {SVGCourse} from "@/components/layouts/Sidebar";

interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  totalChapters: number;
  totalEpisodes: number;
  publishedCourses: number;
  draftCourses: number;
  pendingCourses: number;
}

export default function TeacherDashboardPage() {
  // State quản lý danh sách khóa học và thống kê
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalChapters: 0,
    totalEpisodes: 0,
    publishedCourses: 0,
    draftCourses: 0,
    pendingCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Giáo viên");

  // Tải dữ liệu dashboard khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy tên giáo viên từ localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.fullName || "Giáo viên");
        }

        // Tải danh sách khóa học của giáo viên
        const response = await coursesAPI.getCourses();
        const coursesData = response.result?.courses || [];
        setCourses(coursesData);

        // Tính toán thống kê từ dữ liệu khóa học
        const totalStudents = coursesData.reduce(
          (sum, course) => sum + ((course as any).enrollmentCount || 0),
          0
        );
        const totalChapters = coursesData.reduce(
          (sum, course) => sum + ((course as any).chapterCount || 0),
          0
        );
        const totalEpisodes = coursesData.reduce(
          (sum, course) => sum + ((course as any).totalEpisodes || 0),
          0
        );

        // Đếm số khóa học theo trạng thái
        const publishedCourses = coursesData.filter(
          (c) => c.status === "PUBLISHED" || c.status === "APPROVED"
        ).length;
        const draftCourses = coursesData.filter((c) => c.status === "DRAFT").length;
        const pendingCourses = coursesData.filter(
          (c) => c.status === "PENDING_REVIEW"
        ).length;

        setStats({
          totalCourses: coursesData.length,
          totalStudents,
          totalChapters,
          totalEpisodes,
          publishedCourses,
          draftCourses,
          pendingCourses,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Lấy 5 khóa học gần nhất để hiển thị
  const recentCourses = courses.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại, {userName}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Đây là tổng quan về hoạt động giảng dạy của bạn
        </p>
      </div>

      {/* Stats Grid - Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-2">{stats.totalCourses}</h3>
          <p className="text-blue-100 text-sm">Tổng Khóa Học</p>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs">
            <SVGCourse/> Đã tạo và quản lý
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-2">{stats.totalStudents}</h3>
          <p className="text-green-100 text-sm">Tổng Học Viên</p>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs">
            👨‍🎓 Đang theo học
          </div>
        </div>

        {/* Total Chapters */}
        <div className="bg-gradient-to-br from-red-500 tm-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-2">{stats.totalChapters}</h3>
          <p className="texm-red-100 text-sm">Tổng Chương</p>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs">
            📖 Nội dung giảng dạy
          </div>
        </div>

        {/* Total Episodes */}
        <div className="bg-gradient-to-br from-blue-500 tobfrom-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-2">{stats.totalEpisodes}</h3>
          <p className="textbfrom-blue-100 text-sm">Tổng Bài Giảng</p>
          <div className="mt-4 pt-4 border-t border-white/20 text-xs">
            🎬 Video & tài liệu
          </div>
        </div>
      </div>

      {/* Course Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Trạng Thái Khóa Học</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Đã xuất bản</span>
                <span className="font-bold text-green-600">{stats.publishedCourses}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                  style={{
                    width: `${stats.totalCourses > 0 ? (stats.publishedCourses / stats.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Đang chờ duyệt</span>
                <span className="font-bold text-yellow-600">{stats.pendingCourses}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                  style={{
                    width: `${stats.totalCourses > 0 ? (stats.pendingCourses / stats.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Bản nháp</span>
                <span className="font-bold text-gray-600">{stats.draftCourses}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-600 transition-all"
                  style={{
                    width: `${stats.totalCourses > 0 ? (stats.draftCourses / stats.totalCourses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Hiệu Suất</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Học viên/Khóa học</span>
                <span className="font-bold text-blue-600">
                  {stats.totalCourses > 0 ? (stats.totalStudents / stats.totalCourses).toFixed(1) : 0}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                  style={{ width: `${Math.min((stats.totalStudents / stats.totalCourses) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Chương/Khóa học</span>
                <span className="font-bold text-purple-600">
                  {stats.totalCourses > 0 ? (stats.totalChapters / stats.totalCourses).toFixed(1) : 0}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                  style={{ width: `${Math.min((stats.totalChapters / stats.totalCourses) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Bài giảng/Chương</span>
                <span className="font-bold text-orange-600">
                  {stats.totalChapters > 0 ? (stats.totalEpisodes / stats.totalChapters).toFixed(1) : 0}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                  style={{ width: `${Math.min((stats.totalEpisodes / stats.totalChapters) * 20, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-gray-700 mb-4">⚡ Hành Động Nhanh</h3>
          <div className="space-y-3">
            <Link
              href="/teacher/dashboard/courses"
              className="block w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl px-4 py-3 font-medium text-center transition-all transform hover:scale-105 shadow-md"
            >
              ➕ Tạo Khóa Học Mới
            </Link>
            <Link
              href="/teacher/dashboard/courses"
              className="block w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-3 font-medium text-center transition-all"
            >
              <SVGCourse/> Quản Lý Khóa Học
            </Link>
            <Link
              href="/teacher/dashboard/exams"
              className="block w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-4 py-3 font-medium text-center transition-all"
            >
              📝 Quản Lý Bài Thi
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SVGCourse/> Khóa học gần đây
          </h2>
          <Link
            href="/teacher/dashboard/courses"
            className="text-primary-500 hover:text-primary-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            Xem tất cả
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500">Bạn chưa có khóa học nào</p>
            <Link
              href="/teacher/dashboard/courses/create"
              className="inline-block mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Tạo khóa học đầu tiên
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCourses.map((course) => {
              const enrollmentCount = (course as any).enrollmentCount || 0;
              const chapterCount = (course as any).chapterCount || 0;
              const totalEpisodes = (course as any).totalEpisodes || 0;

              const getStatusInfo = (status: string) => {
                switch (status) {
                  case "PUBLISHED":
                  case "APPROVED":
                    return { bg: "bg-green-100", text: "text-green-700", label: "Đã xuất bản" };
                  case "PENDING_REVIEW":
                    return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ duyệt" };
                  case "DRAFT":
                    return { bg: "bg-gray-100", text: "text-gray-700", label: "Bản nháp" };
                  case "REJECTED":
                    return { bg: "bg-red-100", text: "text-red-700", label: "Bị từ chối" };
                  default:
                    return { bg: "bg-gray-100", text: "text-gray-700", label: status };
                }
              };

              const statusInfo = getStatusInfo(course.status || "DRAFT");

              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  {/* Course Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {course.subject && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {course.subject.name}
                        </span>
                      )}
                      {course.gradeLevel && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          {course.gradeLevel.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-medium">{enrollmentCount}</span> học viên
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium">{chapterCount}</span> chương
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{totalEpisodes}</span> bài giảng
                      </span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </span>
                    <Link
                      href={`/teacher/dashboard/courses/${course.id}`}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-600 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
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
