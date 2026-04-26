"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppStore } from "@/store/useAppStore";
import coursesAPI from "@/apis/courses";
import { CourseStatus } from "@/@types/Course.type";
import type { Course, Subject, GradeLevel } from "@/@types/Course.type";
import CourseModal from "@/components/teacher/CourseModal";

export default function CoursesPage() {
  const profile = useAppStore((state) => state.profile);

  // State quản lý danh sách khóa học và metadata
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // State quản lý bộ lọc tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");
  const [selectedGrade, setSelectedGrade] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | "all">("all");

  // State quản lý modal tạo/sửa khóa học
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Tải danh sách khóa học và metadata khi component mount
  useEffect(() => {
    fetchCourses();
    fetchMetadata();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getCourses({});
      setCourses(response.result?.courses || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      alert(error.message || "Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách môn học và khối lớp cho bộ lọc
  const fetchMetadata = async () => {
    try {
      const [subjectsRes, gradeLevelsRes] = await Promise.all([
        coursesAPI.getSubjects(),
        coursesAPI.getGradeLevels(),
      ]);
      setSubjects(subjectsRes.result || []);
      setGradeLevels(gradeLevelsRes.result || []);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  // Lọc khóa học theo các điều kiện tìm kiếm
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || course.subject?.id === selectedSubject;
    const matchesGrade = selectedGrade === "all" || course.gradeLevel?.id === selectedGrade;
    const matchesStatus = selectedStatus === "all" || course.status === selectedStatus;

    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  // Hiển thị badge trạng thái với màu sắc tương ứng
  const getStatusBadge = (status: CourseStatus) => {
    const statusConfig = {
      [CourseStatus.DRAFT]: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Nháp",
      },
      [CourseStatus.PENDING_REVIEW]: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Chờ duyệt",
      },
      [CourseStatus.APPROVED]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Đã duyệt",
      },
      [CourseStatus.PUBLISHED]: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Đã xuất bản",
      },
      [CourseStatus.REJECTED]: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Bị từ chối",
      },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    try {
      await coursesAPI.deleteCourse(id);
      alert("Xóa khóa học thành công!");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      alert(error.message || "Có lỗi xảy ra khi xóa khóa học");
    }
  };

  // Mở modal để chỉnh sửa khóa học
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  // Mở modal để tạo khóa học mới
  const handleCreateNew = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  // Callback khi modal lưu thành công - tải lại danh sách
  const handleModalSuccess = () => {
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý khóa học</h1>
          <p className="text-gray-600">
            Tạo và quản lý các khóa học của bạn
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo khóa học mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên khóa học..."
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

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Môn học
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              {gradeLevels.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mt-4">
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
              Tất cả ({courses.length})
            </button>
            <button
              onClick={() => setSelectedStatus(CourseStatus.DRAFT)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === CourseStatus.DRAFT
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Nháp ({courses.filter(c => c.status === CourseStatus.DRAFT).length})
            </button>
            <button
              onClick={() => setSelectedStatus(CourseStatus.PENDING_REVIEW)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === CourseStatus.PENDING_REVIEW
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Chờ duyệt ({courses.filter(c => c.status === CourseStatus.PENDING_REVIEW).length})
            </button>
            <button
              onClick={() => setSelectedStatus(CourseStatus.PUBLISHED)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === CourseStatus.PUBLISHED
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã xuất bản ({courses.filter(c => c.status === CourseStatus.PUBLISHED).length})
            </button>
            <button
              onClick={() => setSelectedStatus(CourseStatus.REJECTED)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === CourseStatus.REJECTED
                  ? "bg-primary-500 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bị từ chối ({courses.filter(c => c.status === CourseStatus.REJECTED).length})
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
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
          <p className="text-gray-500 text-lg">Không tìm thấy khóa học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Thumbnail */}
                <div className="w-48 h-36 bg-gray-200 flex-shrink-0 relative">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg flex-1 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                    {course.summary || "Chưa có mô tả"}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {course.subject?.name || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {course.gradeLevel?.name || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>{getStatusBadge(course.status)}</div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/dashboard/courses/${course.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {course.status === CourseStatus.REJECTED && course.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-800 mb-1">Lý do từ chối:</p>
                      <p className="text-xs text-red-700">{course.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        course={editingCourse}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
