import { Course, Subject, GradeLevel, CourseStatus } from "@/@types/Course.type";

export const subjects: Subject[] = [
  { id: 1, name: "Toán" },
  { id: 2, name: "Văn" },
  { id: 3, name: "Tiếng Anh" },
  { id: 4, name: "Vật lý" },
  { id: 5, name: "Hóa học" },
  { id: 6, name: "Sinh học" },
  { id: 7, name: "Lịch sử" },
  { id: 8, name: "Địa lý" },
];

export const gradeLevels: GradeLevel[] = [
  { id: 1, name: "Lớp 10" },
  { id: 2, name: "Lớp 11" },
  { id: 3, name: "Lớp 12" },
];

export const mockCourses: Course[] = [
  {
    id: 1,
    teacher_id: 1,
    title: "Toán hình học không gian - Lớp 11",
    summary: "Khóa học chuyên sâu về hình học không gian dành cho học sinh lớp 11. Bao gồm các dạng bài tập từ cơ bản đến nâng cao.",
    thumbnail_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500",
    subject_id: 1,
    subject: { id: 1, name: "Toán" },
    grade_level_id: 2,
    grade_level: { id: 2, name: "Lớp 11" },
    status: CourseStatus.PUBLISHED,
    rejection_reason: null,
    submitted_at: "2024-01-10T10:00:00",
    approved_at: "2024-01-11T14:30:00",
    created_at: "2024-01-10T10:00:00",
    updated_at: "2024-01-15T08:20:00",
  },
  {
    id: 2,
    teacher_id: 1,
    title: "Giải tích 12 - Chuyên sâu",
    summary: "Ôn tập và nâng cao kiến thức giải tích lớp 12, chuẩn bị cho kỳ thi THPT Quốc gia.",
    thumbnail_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500",
    subject_id: 1,
    subject: { id: 1, name: "Toán" },
    grade_level_id: 3,
    grade_level: { id: 3, name: "Lớp 12" },
    status: CourseStatus.DRAFT,
    rejection_reason: null,
    submitted_at: null,
    approved_at: null,
    created_at: "2024-01-14T09:00:00",
    updated_at: "2024-01-14T16:45:00",
  },
  {
    id: 3,
    teacher_id: 1,
    title: "Đại số lớp 10",
    summary: "Kiến thức đại số cơ bản cho học sinh lớp 10, bám sát chương trình SGK.",
    thumbnail_url: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=500",
    subject_id: 1,
    subject: { id: 1, name: "Toán" },
    grade_level_id: 1,
    grade_level: { id: 1, name: "Lớp 10" },
    status: CourseStatus.PUBLISHED,
    rejection_reason: null,
    submitted_at: "2024-01-05T11:00:00",
    approved_at: "2024-01-06T10:00:00",
    created_at: "2024-01-05T11:00:00",
    updated_at: "2024-01-13T14:20:00",
  },
  {
    id: 4,
    teacher_id: 1,
    title: "Ngữ văn 11 - Văn học Việt Nam",
    summary: "Phân tích các tác phẩm văn học Việt Nam trong chương trình lớp 11.",
    thumbnail_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
    subject_id: 2,
    subject: { id: 2, name: "Văn" },
    grade_level_id: 2,
    grade_level: { id: 2, name: "Lớp 11" },
    status: CourseStatus.PENDING_REVIEW,
    rejection_reason: null,
    submitted_at: "2024-01-16T15:00:00",
    approved_at: null,
    created_at: "2024-01-16T15:00:00",
    updated_at: "2024-01-16T15:00:00",
  },
  {
    id: 5,
    teacher_id: 1,
    title: "Tiếng Anh giao tiếp - Cơ bản",
    summary: "Học tiếng Anh giao tiếp hàng ngày, phát âm chuẩn và từ vựng thiết yếu.",
    thumbnail_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500",
    subject_id: 3,
    subject: { id: 3, name: "Tiếng Anh" },
    grade_level_id: 1,
    grade_level: { id: 1, name: "Lớp 10" },
    status: CourseStatus.REJECTED,
    rejection_reason: "Nội dung khóa học chưa đầy đủ, cần bổ sung thêm bài tập thực hành.",
    submitted_at: "2024-01-12T10:00:00",
    approved_at: null,
    created_at: "2024-01-12T10:00:00",
    updated_at: "2024-01-13T09:00:00",
  },
];

// Helper functions
export const getCourseById = (id: number): Course | undefined => {
  return mockCourses.find((course) => course.id === id);
};

export const getSubjectById = (id: number): Subject | undefined => {
  return subjects.find((subject) => subject.id === id);
};

export const getGradeLevelById = (id: number): GradeLevel | undefined => {
  return gradeLevels.find((level) => level.id === id);
};
