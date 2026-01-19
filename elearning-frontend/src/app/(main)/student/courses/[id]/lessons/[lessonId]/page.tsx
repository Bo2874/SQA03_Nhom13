"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import coursesAPI from "@/apis/courses";
import enrollmentsAPI from "@/apis/enrollments";
import { Course, Chapter, Episode } from "@/@types/Course.type";
import { toast } from "react-hot-toast";
import { SVGCourse } from "@/components/layouts/Sidebar";

// Interface chương học kèm danh sách bài học
interface ChapterWithEpisodes extends Chapter {
  episodes: Episode[];
}

// Interface trạng thái hoàn thành bài học
interface EpisodeCompletion {
  episodeId: number;
  completedAt: string;
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const episodeId = Number(params.lessonId);

  // State quản lý dữ liệu
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<ChapterWithEpisodes[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);  // Các chương đang mở
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [completedEpisodes, setCompletedEpisodes] = useState<Set<number>>(new Set());  // Set các episodeId đã hoàn thành
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>("");
  const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(false);

  // === EFFECT: Tải dữ liệu khóa học và tiến độ học ===
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Bước 1: Tải thông tin khóa học
        const courseResponse = await coursesAPI.getCourseById(courseId);
        setCourse(courseResponse.result);

        // Bước 2: Tải tất cả các chương
        const chaptersResponse = await coursesAPI.getAllChapters(courseId);
        const chaptersData = chaptersResponse.result;

        // Bước 3: Tải danh sách bài học cho từng chương
        const chaptersWithEpisodes = await Promise.all(
          chaptersData.map(async (chapter) => {
            try {
              const episodesResponse = await coursesAPI.getAllEpisodes(courseId, chapter.id);
              return {
                ...chapter,
                episodes: episodesResponse.result.sort((a, b) => a.order - b.order),  // Sắp xếp theo thứ tự
              };
            } catch (err) {
              console.error(`Error fetching episodes for chapter ${chapter.id}:`, err);
              return {
                ...chapter,
                episodes: [],
              };
            }
          })
        );

        // Sắp xếp các chương theo thứ tự
        const sortedChapters = chaptersWithEpisodes.sort((a, b) => a.order - b.order);
        setChapters(sortedChapters);

        // Bước 4: Tìm và set bài học hiện tại
        let foundEpisode: Episode | null = null;
        let foundChapterId: number | null = null;

        for (const chapter of sortedChapters) {
          const episode = chapter.episodes.find((ep) => ep.id === episodeId);
          if (episode) {
            foundEpisode = episode;
            foundChapterId = chapter.id;
            break;
          }
        }

        if (foundEpisode && foundChapterId) {
          setCurrentEpisode(foundEpisode);
          // Tự động mở rộng chương chứa bài học hiện tại
          setExpandedChapters([foundChapterId]);
        } else {
          setError("Không tìm thấy bài học");
        }

        // Bước 5: Tải thông tin enrollment để lấy tiến độ học
        try {
          const enrollmentsResponse = await enrollmentsAPI.getSubscribedCourses({
            subscribed: true,
          });

          if (enrollmentsResponse.result?.enrollments) {
            const enrollment = enrollmentsResponse.result.enrollments.find(
              (e: any) => e.course?.id === courseId
            );

            if (enrollment) {
              setEnrollmentId(enrollment.id);
              setEnrollmentStatus(enrollment.status || "ACTIVE");

              // Kiểm tra khóa học đã hoàn thành chưa
              const courseCompleted = enrollment.isCompleted || enrollment.status === "COMPLETED";
              setIsCourseCompleted(courseCompleted);

              // Tải chi tiết enrollment để lấy danh sách bài đã hoàn thành
              const enrollmentDetail = await enrollmentsAPI.getEnrollmentById(
                courseId,
                enrollment.id
              );

              if (enrollmentDetail.result?.completions) {
                const completedSet = new Set(
                  enrollmentDetail.result.completions.map((c: any) => c.episodeId)
                );
                setCompletedEpisodes(completedSet);
              }

              // Cập nhật bài học cuối cùng đang xem (tracking)
              if (foundEpisode) {
                try {
                  await enrollmentsAPI.updateLastEpisode(
                    courseId,
                    enrollment.id,
                    foundEpisode.id
                  );
                } catch (err) {
                  console.error("Error updating last episode:", err);
                  // Không critical, không hiển thị lỗi cho user
                }
              }
            }
          }
        } catch (err) {
          console.error("Error fetching enrollment data:", err);
          // Không set error, cho phép user tiếp tục xem
        }
      } catch (err: any) {
        console.error("Error fetching course data:", err);
        setError(err.message || "Không thể tải dữ liệu khóa học");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, episodeId]);

  // Lấy tất cả bài học theo thứ tự để điều hướng
  const allEpisodes = chapters.flatMap((ch) => ch.episodes);
  const currentIndex = allEpisodes.findIndex((ep) => ep.id === episodeId);
  const previousEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;
  const isLastEpisode = currentIndex === allEpisodes.length - 1;

  // Tính toán tiến độ
  const totalEpisodes = allEpisodes.length;
  const calculatedProgress = totalEpisodes > 0
    ? Math.round((currentIndex / totalEpisodes) * 100)
    : 0;

  // Kiểm tra bài học có được phép truy cập không (logic khóa/mở)
  const isEpisodeAvailable = (episode: Episode): boolean => {
    // Nếu đã hoàn thành khóa học, mở tất cả bài
    if (enrollmentStatus === "COMPLETED") {
      return true;
    }

    // Tìm vị trí của bài học cần kiểm tra
    const episodeIndex = allEpisodes.findIndex((ep) => ep.id === episode.id);

    // Mở khóa tất cả bài từ đầu đến bài hiện tại (bao gồm cả bài hiện tại)
    // Khóa tất cả bài sau bài hiện tại
    if (episodeIndex <= currentIndex) {
      return true; // Mở khóa từ đầu đến bài hiện tại
    }

    return false; // Khóa từ bài sau bài hiện tại đến cuối
  };

  // Toggle mở/đóng chương
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // Chuyển sang bài học tiếp theo
  const handleNextLesson = async () => {
    if (!nextEpisode) return;

    // Tự động đánh dấu hoàn thành bài hiện tại trước khi chuyển
    await handleMarkComplete();

    // Điều hướng đến bài tiếp theo
    router.push(`/student/courses/${courseId}/lessons/${nextEpisode.id}`);
  };

  // Đánh dấu bài học đã hoàn thành
  const handleMarkComplete = async () => {
    if (!enrollmentId || !currentEpisode) {
      console.warn("No enrollment or episode to mark complete");
      return;
    }

    // Không đánh dấu lại nếu đã hoàn thành
    if (completedEpisodes.has(currentEpisode.id)) {
      return;
    }

    try {
      const response = await enrollmentsAPI.markEpisodeComplete(
        courseId,
        enrollmentId,
        currentEpisode.id
      );

      if (response.result) {
        // Cập nhật state local
        setCompletedEpisodes((prev) => new Set([...prev, currentEpisode.id]));

        toast.success("Đã hoàn thành bài học!");

        // Kiểm tra xem khóa học đã hoàn thành chưa
        if (response.result.enrollment.status === "COMPLETED") {
          toast.success("🎉 Chúc mừng! Bạn đã hoàn thành khóa học!");
        }
      }
    } catch (err: any) {
      console.error("Error marking episode complete:", err);
      // Không hiển thị lỗi, không critical
    }
  };

  const handleCompleteCourse = async () => {
    if (!enrollmentId) {
      toast.error("Không tìm thấy thông tin đăng ký khóa học");
      return;
    }

    try {
      const response = await enrollmentsAPI.completeCourse(courseId, enrollmentId);

      if (response.result) {
        setEnrollmentStatus("COMPLETED");
        toast.success("🎉 Chúc mừng! Bạn đã hoàn thành khóa học!");

        // Navigate to course page or certificates page
        setTimeout(() => {
          router.push(`/student/my-courses`);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error completing course:", err);
      toast.error("Có lỗi xảy ra khi hoàn thành khóa học");
    }
  };

  const convertYouTubeUrl = (url?: string): string | null => {
    if (!url) return null;

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      // Convert to embed URL
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Return original URL if not YouTube
    return url;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-300">Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !currentEpisode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error || "Không tìm thấy bài học"}</h1>
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
          >
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/student/my-courses`)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                <SVGCourse/>
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">{course.title}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <span>{calculatedProgress}%</span>
              <span className="text-gray-500">·</span>
              <span>{currentIndex}/{totalEpisodes} bài học</span>
            </div>

            {currentEpisode && !completedEpisodes.has(currentEpisode.id) && (
              <>
                {isLastEpisode ? (
                  <button
                    onClick={handleCompleteCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all text-sm font-semibold shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Hoàn thành khóa học
                  </button>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
        </header>

        {/* Video Player */}
        <div className="flex-1 bg-dark/55  flex items-center justify-center relative">
          {currentEpisode.type === "VIDEO" && currentEpisode.videoUrl ? (
            (() => {
              const embedUrl = convertYouTubeUrl(currentEpisode.videoUrl);
              const isYouTube = embedUrl && embedUrl.includes("youtube.com/embed");

              return isYouTube ? (
                <iframe
                  key={currentEpisode.id}
                  className="w-full h-full"
                  src={embedUrl}
                  title={currentEpisode.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={currentEpisode.id}
                  className="w-full h-full"
                  controls
                  autoPlay
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    const mins = Math.floor(video.currentTime / 60);
                    const secs = Math.floor(video.currentTime % 60);
                  }}
                  onEnded={handleMarkComplete}
                >
                  <source src={currentEpisode.videoUrl} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              );
            })()
          ) : (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 via-purple-500 to-purple-700">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    {currentEpisode.type === "VIDEO" ? (
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{currentEpisode.title}</h2>
                  <p className="text-white/80">
                    {currentEpisode.type === "QUIZ" ? "Bài kiểm tra" : "Video bài học"}
                  </p>
                  {currentEpisode.type === "VIDEO" && !currentEpisode.videoUrl && (
                    <p className="text-white/60 mt-2 text-sm">Video chưa có sẵn</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg mb-1">{currentEpisode.title}</h2>
            <p className="text-gray-400 text-sm">
              {currentEpisode.type === "QUIZ"
                ? "Bài kiểm tra"
                : currentEpisode.videoUrl && convertYouTubeUrl(currentEpisode.videoUrl)?.includes("youtube.com/embed")
                  ? "Video YouTube"
                  : `Thời lượng: ${formatDuration(currentEpisode.durationSeconds)}`
              }
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => previousEpisode && router.push(`/student/courses/${courseId}/lessons/${previousEpisode.id}`)}
              disabled={!previousEpisode}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                previousEpisode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              BÀI TRƯỚC
            </button>

            <button
              onClick={handleNextLesson}
              disabled={!nextEpisode}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                nextEpisode
                  ? "bg-primary-500 hover:bg-primary-600 text-gray-900"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              BÀI TIẾP THEO
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Course Content */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Nội dung khóa học</h3>
        </div>

        {/* Progress Info */}
        <div className="p-4 bg-primary-100 border-b border-gray-400">
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              <SVGCourse />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Tiến độ học tập</h4>
              <p className="text-sm text-gray-600">
                {currentIndex}/{totalEpisodes} bài học đã hoàn thành
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-700 h-2 rounded-full transition-all"
                  style={{ width: `${calculatedProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{calculatedProgress}% hoàn thành</p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto">
          {chapters.map((chapter, chapterIndex) => {
            const isExpanded = expandedChapters.includes(chapter.id);

            return (
              <div key={chapter.id} className="border-b border-gray-200">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {chapterIndex + 1}. {chapter.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {chapter.episodes.length} bài học
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Episodes List */}
                {isExpanded && (
                  <div className="bg-gray-50">
                    {chapter.episodes.map((episode, episodeIndex) => {
                      const isCurrentEpisode = episode.id === episodeId;
                      // If course is completed, all episodes are marked as completed
                      const isCompleted = isCourseCompleted || completedEpisodes.has(episode.id);
                      const isAvailable = isEpisodeAvailable(episode);

                      return (
                        <button
                          key={episode.id}
                          onClick={() => isAvailable && router.push(`/student/courses/${courseId}/lessons/${episode.id}`)}
                          disabled={!isAvailable}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                            isCurrentEpisode
                              ? "bg-primary-100 border-l-4 border-orange-500"
                              : isAvailable
                                ? "hover:bg-gray-100 cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : isCurrentEpisode ? (
                              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            ) : !isAvailable ? (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm mb-1 ${isCurrentEpisode ? "font-semibold text-gray-900" : isAvailable ? "text-gray-700" : "text-gray-500"}`}>
                              {episodeIndex + 1}. {episode.title}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              {episode.type === "VIDEO" ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {episode.videoUrl && convertYouTubeUrl(episode.videoUrl)?.includes("youtube.com/embed")
                                    ? "YouTube"
                                    : formatDuration(episode.durationSeconds)
                                  }
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Bài kiểm tra
                                </>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
