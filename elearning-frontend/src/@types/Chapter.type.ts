export interface Chapter {
  id: number;
  course_id: number; // Keep snake_case because it's from JOIN
  title: string;
  order: number; // Changed from order_index to match backend
  created_at?: string;
  updated_at?: string;
  episodes?: any[]; // Array of episodes (populated by backend)
}

export interface CreateChapterRequest {
  title: string;
  order: number; // Changed from order_index
}

export interface UpdateChapterRequest {
  title?: string;
  order?: number; // Changed from order_index
}
