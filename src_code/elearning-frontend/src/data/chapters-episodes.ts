import type { Chapter } from "@/@types/Chapter.type";
import type { Episode } from "@/@types/Episode.type";
import { EpisodeType } from "@/@types/Episode.type";

// Mock chapters for course 1 (Toán hình học không gian - Lớp 11)
export const mockChapters: Chapter[] = [
  {
    id: 1,
    course_id: 1,
    title: "Chương 1: Đường thẳng và mặt phẳng trong không gian",
    order_index: 1,
    created_at: "2024-01-10T10:00:00",
    updated_at: "2024-01-10T10:00:00",
  },
  {
    id: 2,
    course_id: 1,
    title: "Chương 2: Vectơ trong không gian",
    order_index: 2,
    created_at: "2024-01-10T10:05:00",
    updated_at: "2024-01-10T10:05:00",
  },
  {
    id: 3,
    course_id: 1,
    title: "Chương 3: Quan hệ vuông góc trong không gian",
    order_index: 3,
    created_at: "2024-01-10T10:10:00",
    updated_at: "2024-01-10T10:10:00",
  },
];

// Mock episodes
export const mockEpisodes: Episode[] = [
  // Chapter 1 episodes
  {
    id: 1,
    chapter_id: 1,
    title: "Giới thiệu về đường thẳng và mặt phẳng",
    type: EpisodeType.VIDEO,
    order_index: 1,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 600,
    is_preview: true,
    created_at: "2024-01-10T10:15:00",
    updated_at: "2024-01-10T10:15:00",
  },
  {
    id: 2,
    chapter_id: 1,
    title: "Các định lý cơ bản về đường thẳng và mặt phẳng",
    type: EpisodeType.VIDEO,
    order_index: 2,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 720,
    is_preview: false,
    created_at: "2024-01-10T10:20:00",
    updated_at: "2024-01-10T10:20:00",
  },
  {
    id: 3,
    chapter_id: 1,
    title: "Bài tập: Đường thẳng và mặt phẳng cơ bản",
    type: EpisodeType.VIDEO,
    order_index: 3,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 900,
    is_preview: false,
    created_at: "2024-01-10T10:25:00",
    updated_at: "2024-01-10T10:25:00",
  },
  {
    id: 4,
    chapter_id: 1,
    title: "Kiểm tra kiến thức Chương 1",
    type: EpisodeType.QUIZ,
    order_index: 4,
    quiz_id: 1,
    is_preview: false,
    created_at: "2024-01-10T10:30:00",
    updated_at: "2024-01-10T10:30:00",
  },

  // Chapter 2 episodes
  {
    id: 5,
    chapter_id: 2,
    title: "Khái niệm vectơ trong không gian",
    type: EpisodeType.VIDEO,
    order_index: 1,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 540,
    is_preview: true,
    created_at: "2024-01-10T11:00:00",
    updated_at: "2024-01-10T11:00:00",
  },
  {
    id: 6,
    chapter_id: 2,
    title: "Các phép toán vectơ",
    type: EpisodeType.VIDEO,
    order_index: 2,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 780,
    is_preview: false,
    created_at: "2024-01-10T11:10:00",
    updated_at: "2024-01-10T11:10:00",
  },
  {
    id: 7,
    chapter_id: 2,
    title: "Tích vô hướng và ứng dụng",
    type: EpisodeType.VIDEO,
    order_index: 3,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 660,
    is_preview: false,
    created_at: "2024-01-10T11:20:00",
    updated_at: "2024-01-10T11:20:00",
  },
  {
    id: 8,
    chapter_id: 2,
    title: "Kiểm tra: Vectơ trong không gian",
    type: EpisodeType.QUIZ,
    order_index: 4,
    quiz_id: 2,
    is_preview: false,
    created_at: "2024-01-10T11:30:00",
    updated_at: "2024-01-10T11:30:00",
  },

  // Chapter 3 episodes
  {
    id: 9,
    chapter_id: 3,
    title: "Hai đường thẳng vuông góc",
    type: EpisodeType.VIDEO,
    order_index: 1,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 600,
    is_preview: false,
    created_at: "2024-01-10T12:00:00",
    updated_at: "2024-01-10T12:00:00",
  },
  {
    id: 10,
    chapter_id: 3,
    title: "Đường thẳng vuông góc với mặt phẳng",
    type: EpisodeType.VIDEO,
    order_index: 2,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 720,
    is_preview: false,
    created_at: "2024-01-10T12:10:00",
    updated_at: "2024-01-10T12:10:00",
  },
  {
    id: 11,
    chapter_id: 3,
    title: "Hai mặt phẳng vuông góc",
    type: EpisodeType.VIDEO,
    order_index: 3,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_duration_seconds: 680,
    is_preview: false,
    created_at: "2024-01-10T12:20:00",
    updated_at: "2024-01-10T12:20:00",
  },
  {
    id: 12,
    chapter_id: 3,
    title: "Kiểm tra tổng hợp Chương 3",
    type: EpisodeType.QUIZ,
    order_index: 4,
    quiz_id: 3,
    is_preview: false,
    created_at: "2024-01-10T12:30:00",
    updated_at: "2024-01-10T12:30:00",
  },
];

// Helper functions
export const getChaptersByCourseId = (courseId: number): Chapter[] => {
  return mockChapters.filter((chapter) => chapter.course_id === courseId);
};

export const getChapterById = (id: number): Chapter | undefined => {
  return mockChapters.find((chapter) => chapter.id === id);
};

export const getEpisodesByChapterId = (chapterId: number): Episode[] => {
  return mockEpisodes.filter((episode) => episode.chapter_id === chapterId);
};

export const getEpisodeById = (id: number): Episode | undefined => {
  return mockEpisodes.find((episode) => episode.id === id);
};

// Calculate total video duration for a chapter
export const getChapterDuration = (chapterId: number): number => {
  const episodes = getEpisodesByChapterId(chapterId);
  return episodes.reduce((total, episode) => {
    if (episode.type === EpisodeType.VIDEO && episode.video_duration_seconds) {
      return total + episode.video_duration_seconds;
    }
    return total;
  }, 0);
};

// Format seconds to HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};
