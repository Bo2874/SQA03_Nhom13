"use client";

import { useEffect, useState } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import CourseCard from "@/components/home/CourseCard";
import ParentExpectations from "@/components/home/ParentExpectations";
import FeaturedTeachers from "@/components/home/FeaturedTeachers";
import { heroSlides } from "@/data/courses";
import coursesAPI from "@/apis/courses";
import { Course as ApiCourse, Subject } from "@/@types/Course.type";
import Link from "next/link";
import { SVGCourse } from "@/components/layouts/Sidebar";

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<ApiCourse[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coursesBySubject, setCoursesBySubject] = useState<
    Record<number, ApiCourse[]>
  >({});
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalEpisodes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [featuredRes, subjectsRes, statsRes] = await Promise.all([
          coursesAPI.getFeaturedCourses(8),
          coursesAPI.getSubjects(),
          coursesAPI.getPlatformStats(),
        ]);

        // Set featured courses
        if (featuredRes.result?.courses) {
          setFeaturedCourses(featuredRes.result.courses);
        }

        // Set subjects
        if (subjectsRes.result) {
          setSubjects(subjectsRes.result);

          // Fetch courses for first 3 subjects
          const topSubjects = subjectsRes.result.slice(0, 3);
          const subjectCoursesPromises = topSubjects.map((subject) =>
            coursesAPI.getCoursesBySubject(subject.id, 4)
          );

          const subjectCoursesResults = await Promise.all(
            subjectCoursesPromises
          );
          const subjectCoursesMap: Record<number, ApiCourse[]> = {};

          subjectCoursesResults.forEach((result, index) => {
            const subjectId = topSubjects[index].id;
            if (result.result?.courses) {
              subjectCoursesMap[subjectId] = result.result.courses;
            }
          });

          setCoursesBySubject(subjectCoursesMap);
        }

        // Set stats
        if (statsRes.result) {
          setStats(statsRes.result);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const subjectIcons: Record<string, string> = {
    "Toán học": "📐",
    "Vật lý": "⚛️",
    "Hóa học": "🧪",
    "Ngữ văn": "📖",
    "Tiếng Anh": "🌍",
    "Sinh học": "🧬",
    "Lịch sử": "📜",
    "Địa lý": "🌏",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Slider - Full width */}
      <section className="mb-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <HeroSlider slides={heroSlides} />
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải khóa học...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
      {/* Featured Teachers Section - Outside main container for full-width background */}
      <FeaturedTeachers />
        {/* Courses Content */}
        {!loading && !error && (
          <>
            {/* Platform Stats */}
            <section className="mb-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Khóa học */}
                <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600 text-3xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
                        viewBox="0 0 2048 2048">
                        <path
                          fill="#1f932d"
                          d="M384 1536h128v128H256V384H128v1408h384v128H0V256h256V128h384q88 0 169 27t151 81q69-54 150-81t170-27h384v128h256v819l-128-58V384h-128v575l-128-59V256h-256q-71 0-136 24t-120 71v608l-128 58V351q-54-46-119-70t-137-25H384v1280zm1408 255l-448 225l-448-225q0-36 1-76t8-81t20-77t36-67l-193-88v582H640v-640l704-320l704 320l-321 146l8 11q21 31 32 67t17 73t7 76t1 74zm-448-627l-395 180l395 180l395-180l-395-180zm0 709l320-161q-1-26-4-47t-11-41t-16-39t-23-42l-266 121l-266-121q-15 24-24 43t-16 38t-9 40t-4 49l319 160z"
                        />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.totalCourses}
                      </div>
                      <div className="text-sm text-gray-500">Khóa học</div>
                    </div>
                  </div>
                </div>

                {/* Học viên */}
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
                        viewBox="0 0 24 24">
                        <path
                          fill="none"
                          stroke="#1f932d"
                          strokeLinecap="round"
                          strokeWidth="2"
                          d="M4.5 17H4a1 1 0 0 1-1-1a3 3 0 0 1 3-3h1m0-3a2.5 2.5 0 1 1 2-4.5M19.5 17h.5c.6 0 1-.4 1-1a3 3 0 0 0-3-3h-1m0-3a2.5 2.5 0 1 0-2-4.5m.5 13.5h-7a1 1 0 0 1-1-1a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3c0 .6-.4 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z"
                        />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {stats.totalStudents}
                      </div>
                      <div className="text-sm text-gray-500">Học viên</div>
                    </div>
                  </div>
                </div>

                {/* Giáo viên */}
                <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-pink-100 text-pink-600 text-3xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
                        viewBox="0 0 24 24"
                        fill="#1f932d">
                        <g
                          fill="none"
                          stroke="#1f932d"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          color="currentColor">
                          <path d="M2 2h14c1.886 0 2.828 0 3.414.586S20 4.114 20 6v6c0 1.886 0 2.828-.586 3.414S17.886 16 16 16H9m1-9.5h6M2 17v-4c0-.943 0-1.414.293-1.707S3.057 11 4 11h2m-4 6h4m-4 0v5m4-5v-6m0 6v5m0-11h6" />
                          <path d="M6 6.5a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
                        </g>
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-pink-600">
                        {stats.totalTeachers}
                      </div>
                      <div className="text-sm text-gray-500">Giáo viên</div>
                    </div>
                  </div>
                </div>

                {/* Bài giảng */}
                <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl text-3xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
                        viewBox="0 0 24 24">
                        <path
                          fill="#1f932d"
                          d="M19.502 20.5q-.415 0-.709-.291q-.293-.291-.293-.707q0-.415.291-.709q.291-.293.707-.293q.415 0 .709.291q.293.291.293.707q0 .415-.291.709q-.291.293-.707.293Zm-9.5 1q-2.29 0-3.896-.434Q4.5 20.633 4.5 20q0-.485 1.094-.865t2.368-.5v1.48H9.5V2.808L15.885 5.9L10.5 8.692v9.82q2.15.125 3.575.526T15.5 20q0 .633-1.604 1.066q-1.603.434-3.894.434Z"
                        />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">
                        {stats.totalEpisodes}
                      </div>
                      <div className="text-sm text-gray-500">Bài giảng</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!loading && !error && (
          <>
            {/* Featured Courses Section */}
            {featuredCourses.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Khóa học nổi bật 🔥
                    </h2>
                    <p className="text-gray-600">
                      Các khóa học được nhiều học viên quan tâm nhất
                    </p>
                  </div>
                  <Link
                    href="/courses"
                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105">
                    Xem tất cả
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCourses.slice(0, 8).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* Courses by Subject Sections */}
            {subjects.slice(0, 3).map((subject) => {
              const subjectCourses = coursesBySubject[subject.id] || [];
              const icon = subjectIcons[subject.name] || "📖";

              if (subjectCourses.length === 0) return null;

              return (
                <section key={subject.id} className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <span className="text-4xl">{icon}</span>
                        {subject.name}
                      </h2>
                      <p className="text-gray-600">
                        Khám phá các khóa học {subject.name.toLowerCase()} chất
                        lượng
                      </p>
                    </div>
                    <Link
                      href={`/courses?subject=${subject.id}`}
                      className="hidden md:flex items-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-600 rounded-full font-semibold transition-all hover:scale-105">
                      Xem thêm
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {subjectCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Empty State */}
            {featuredCourses.length === 0 && (
              <div className="text-center py-20">
                <div className="text-8xl mb-6"><SVGCourse/></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Chưa có khóa học nào
                </h3>
                <p className="text-gray-600 mb-8">
                  Các khóa học sẽ được hiển thị ở đây khi có sẵn.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <ParentExpectations />
    </main>
  );
}
