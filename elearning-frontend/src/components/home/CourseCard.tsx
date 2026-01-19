import Image from "next/image";
import Link from "next/link";

// Course interface matching backend response
interface Course {
  id: number | string;
  title: string;
  summary?: string;
  thumbnailUrl?: string;
  teacher?: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  subject?: {
    id: number;
    name: string;
  };
  gradeLevel?: {
    id: number;
    name: string;
  };
  chapterCount?: number;
  totalEpisodes?: number;
  enrollmentCount?: number;
  status?: string;
}

interface CourseCardProps {
  course: Course;
}

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)",
  "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
];

export default function CourseCard({ course }: CourseCardProps) {
  const gradient = gradients[Number(course.id) % gradients.length];
  const teacherName = course.teacher?.fullName || "Giảng viên";
  const subjectName = course.subject?.name || "Môn học";
  const gradeName = course.gradeLevel?.name || "";
  const enrollmentCount = course.enrollmentCount || 0;
  const chapterCount = course.chapterCount || 0;

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100">
        {/* Thumbnail with Gradient Overlay */}
        <div className="relative h-48 overflow-hidden">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div
              className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ background: gradient }}
            />
          )}

          {/* Overlay content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                {subjectName}
              </span>
              {gradeName && (
                <span className="bg-primary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {gradeName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-5">
          {/* Title */}
          <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] text-base group-hover:text-primary-600 transition-colors">
            {course.title}
          </h4>

          {/* Summary */}
          {course.summary && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
              {course.summary}
            </p>
          )}

          {/* Teacher */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-br from-primary-400 to-primary-600">
              {course.teacher?.avatarUrl ? (
                <Image
                  src={course.teacher.avatarUrl}
                  alt={teacherName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                  {teacherName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-700 font-medium">{teacherName}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {/* Students */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-900">{enrollmentCount}</span>
              <p className="text-xs text-gray-500">Học viên</p>
            </div>

            {/* Chapters */}
            <div className="text-center border-x border-gray-100">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-900">{chapterCount}</span>
              <p className="text-xs text-gray-500">Chương</p>
            </div>

            {/* Lessons */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-900">{course.totalEpisodes || 0}</span>
              <p className="text-xs text-gray-500">Bài học</p>
            </div>
          </div>

          {/* Free Badge */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600">Miễn phí</span>
              <div className="flex items-center gap-1 text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                Xem chi tiết
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
