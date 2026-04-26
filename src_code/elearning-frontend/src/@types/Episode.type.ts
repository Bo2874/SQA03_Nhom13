export enum EpisodeType {
  VIDEO = "VIDEO",
  QUIZ = "QUIZ",
}

export interface Episode {
  id: number;
  chapter_id: number; // Keep snake_case because it's from JOIN
  title: string;
  type: EpisodeType;
  order: number; // Changed from order_index
  videoUrl?: string | null; // Changed from video_url
  durationSeconds?: number | null; // Changed from video_duration_seconds
  quiz_id?: number | null;
  is_preview?: boolean;
  createdAt: string; // Changed from created_at
  updatedAt?: string; // Changed from updated_at
}

export interface CreateEpisodeRequest {
  title: string;
  type: EpisodeType;
  order: number;
  videoUrl?: string;
  durationSeconds?: number;
  quiz_id?: number;
  is_preview?: boolean;
}

export interface UpdateEpisodeRequest {
  title?: string;
  type?: EpisodeType;
  order?: number; // Changed from order_index
  videoUrl?: string; // Changed from video_url
  durationSeconds?: number; // Changed from video_duration_seconds
  quiz_id?: number;
  is_preview?: boolean;
}
