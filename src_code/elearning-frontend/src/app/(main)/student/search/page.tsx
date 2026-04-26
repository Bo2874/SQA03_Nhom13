"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { searchCourses, searchTeachers, CourseSearchResult, TeacherSearchResult } from "@/apis/search";
import { getSubjects, getGradeLevels } from "@/apis/courses";
import { Subject, GradeLevel } from "@/@types/Course.type";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"courses" | "teachers">("courses");
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");
  const [selectedGrade, setSelectedGrade] = useState<number | "all">("all");

  // State for courses
  const [courses, setCourses] = useState<CourseSearchResult[]>([]);
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // State for teachers
  const [teachers, setTeachers] = useState<TeacherSearchResult[]>([]);
  const [teachersTotal, setTeachersTotal] = useState(0);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // State for filters
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await searchCourses({
        keyword: searchQuery || undefined,
        subjectId: selectedSubject !== "all" ? selectedSubject : undefined,
        gradeLevelId: selectedGrade !== "all" ? selectedGrade : undefined,
        limit: 12,
      });

      if (response.message === "success" && response.result) {
        setCourses(response.result.courses);
        setCoursesTotal(response.result.total);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      setCoursesTotal(0);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const response = await searchTeachers({
        keyword: searchQuery || undefined,
        limit: 12,
      });

      if (response.message === "success" && response.result) {
        setTeachers(response.result.teachers);
        setTeachersTotal(response.result.total);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
      setTeachersTotal(0);
    } finally {
      setTeachersLoading(false);
    }
  };

  // Fetch subjects and grade levels on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);
        const [subjectsRes, gradeLevelsRes] = await Promise.all([
          getSubjects(),
          getGradeLevels()
        ]);

        if (subjectsRes.result) {
          setSubjects(subjectsRes.result);
        }
        if (gradeLevelsRes.result) {
          setGradeLevels(gradeLevelsRes.result);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // Fetch on mount and when search type changes
  useEffect(() => {
    if (searchType === "courses") {
      fetchCourses();
    } else {
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType]);

  // Handle search button click
  const handleSearch = () => {
    if (searchType === "courses") {
      fetchCourses();
    } else {
      fetchTeachers();
    }
  };

  const isLoading = searchType === "courses" ? coursesLoading : teachersLoading;
  const filteredCourses = courses;
  const filteredTeachers = teachers;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tìm kiếm</h1>
          <p className="text-gray-600">Khám phá khóa học và giảng viên</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={searchType === "courses" ? "Tìm kiếm khóa học..." : "Tìm kiếm giảng viên..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
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

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Tìm kiếm
            </button>

            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType("courses")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  searchType === "courses"
                    ? "bg-primary-500 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Khóa học
              </button>
              <button
                onClick={() => setSearchType("teachers")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  searchType === "teachers"
                    ? "bg-primary-500 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Giảng viên
              </button>
            </div>
          </div>

          {/* Filters (for courses only) */}
          {searchType === "courses" && (
            <div className="mt-4">
              {filtersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => {
                          setSelectedSubject(e.target.value === "all" ? "all" : Number(e.target.value));
                        }}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lớp</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => {
                          setSelectedGrade(e.target.value === "all" ? "all" : Number(e.target.value));
                        }}
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
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Chọn bộ lọc và nhấn nút "Tìm kiếm" để xem kết quả
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : searchType === "courses" ? (
          /* Courses Results */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Tìm thấy {coursesTotal} khóa học
              </h2>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/student/courses/${course.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-200 relative">
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
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {course.summary || "Chưa có mô tả"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {course.subject?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {course.gradeLevel?.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Teachers Results */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Tìm thấy {teachersTotal} giảng viên
              </h2>
            </div>

            {filteredTeachers.length === 0 ? (
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
                <p className="text-gray-500 text-lg">Không tìm thấy giảng viên nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                  <Link
                    key={teacher.id}
                    href={`/student/teachers/${teacher.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={teacher.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.fullName)}&background=random`}
                        alt={teacher.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{teacher.fullName}</h3>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{teacher.totalCourses || 0} khóa học</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{teacher.totalStudents || 0} học sinh</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
