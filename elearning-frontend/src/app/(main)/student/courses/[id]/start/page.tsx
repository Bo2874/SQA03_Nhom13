"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import coursesAPI from "@/apis/courses";
import enrollmentsAPI from "@/apis/enrollments";

/**
 * This page automatically redirects to the last watched episode (resume learning)
 * or the first episode if user hasn't started yet
 * Used when user clicks "Continue Learning" from my-courses page
 */
export default function StartCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findEpisodeToResume = async () => {
      try {
        // Step 1: Try to get enrollment data to find last watched episode
        try {
          const enrollmentsResponse = await enrollmentsAPI.getSubscribedCourses({
            subscribed: true,
          });

          if (enrollmentsResponse.result?.enrollments) {
            const enrollment = enrollmentsResponse.result.enrollments.find(
              (e: any) => e.course?.id === courseId
            );

            if (enrollment) {
              // Get detailed enrollment with lastEpisode relation
              const enrollmentDetail = await enrollmentsAPI.getEnrollmentById(
                courseId,
                enrollment.id
              );

              // Strategy 1: If backend has lastEpisode set, use it
              if (enrollmentDetail.result?.lastEpisode?.id) {
                router.replace(`/student/courses/${courseId}/lessons/${enrollmentDetail.result.lastEpisode.id}`);
                return;
              }

              // Strategy 2: Find last completed episode and resume from next one
              if (enrollmentDetail.result?.completions && enrollmentDetail.result.completions.length > 0) {
                // Get all episodes to find the next uncompleted one
                const chaptersResponse = await coursesAPI.getAllChapters(courseId);
                const chapters = chaptersResponse.result;

                if (chapters && chapters.length > 0) {
                  const sortedChapters = chapters.sort((a, b) => a.order - b.order);

                  // Collect all episodes in order
                  const allEpisodes: any[] = [];
                  for (const chapter of sortedChapters) {
                    try {
                      const episodesResponse = await coursesAPI.getAllEpisodes(courseId, chapter.id);
                      const episodes = episodesResponse.result || [];
                      const sortedEpisodes = episodes.sort((a, b) => a.order - b.order);
                      allEpisodes.push(...sortedEpisodes);
                    } catch (err) {
                      console.error(`Error fetching episodes for chapter ${chapter.id}:`, err);
                    }
                  }

                  if (allEpisodes.length > 0) {
                    // Find first uncompleted episode
                    const completedIds = new Set(
                      enrollmentDetail.result.completions.map((c: any) => c.episodeId)
                    );

                    const firstUncompletedEpisode = allEpisodes.find(
                      (ep) => !completedIds.has(ep.id)
                    );

                    if (firstUncompletedEpisode) {
                      router.replace(`/student/courses/${courseId}/lessons/${firstUncompletedEpisode.id}`);
                      return;
                    } else {
                      // All episodes completed, go to last episode to review
                      const lastEpisode = allEpisodes[allEpisodes.length - 1];
                      router.replace(`/student/courses/${courseId}/lessons/${lastEpisode.id}`);
                      return;
                    }
                  }
                }
              }
            }
          }
        } catch (enrollmentErr) {
          console.warn("Could not fetch enrollment data, will start from first episode:", enrollmentErr);
          // Continue to find first episode
        }

        // Step 2: No last episode found, find first episode
        const chaptersResponse = await coursesAPI.getAllChapters(courseId);
        const chapters = chaptersResponse.result;

        if (!chapters || chapters.length === 0) {
          setError("Khóa học chưa có nội dung");
          return;
        }

        // Sort chapters by order
        const sortedChapters = chapters.sort((a, b) => a.order - b.order);

        // Find first chapter with episodes
        for (const chapter of sortedChapters) {
          try {
            const episodesResponse = await coursesAPI.getAllEpisodes(courseId, chapter.id);
            const episodes = episodesResponse.result;

            if (episodes && episodes.length > 0) {
              // Sort episodes by order and get the first one
              const sortedEpisodes = episodes.sort((a, b) => a.order - b.order);
              const firstEpisode = sortedEpisodes[0];

              // Redirect to first episode
              router.replace(`/student/courses/${courseId}/lessons/${firstEpisode.id}`);
              return;
            }
          } catch (err) {
            console.error(`Error fetching episodes for chapter ${chapter.id}:`, err);
            // Continue to next chapter
          }
        }

        // If no episodes found in any chapter
        setError("Khóa học chưa có bài học nào");
      } catch (err: any) {
        console.error("Error finding episode:", err);
        setError(err.message || "Không thể tải thông tin khóa học");
      }
    };

    findEpisodeToResume();
  }, [courseId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
          >
            Xem thông tin khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-300">Đang tải bài học...</p>
      </div>
    </div>
  );
}
