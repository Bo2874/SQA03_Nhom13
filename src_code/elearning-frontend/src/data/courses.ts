export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  instructorAvatar: string;
  originalPrice: number;
  salePrice: number;
  totalStudents: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  images: string[];
  gradient: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Toán học lớp 1-12",
    subtitle: "📐",
    description: "Nền tảng vững chắc với Đại số, Hình học, Giải tích. Phương pháp giảng dạy sinh động, dễ hiểu cho mọi cấp độ từ Tiểu học đến THPT.",
    buttonText: "KHÁM PHÁ NGAY",
    buttonLink: "/courses",
    images: [
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
      "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400",
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400",
    ],
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "2",
    title: "Vật lý - Hóa học",
    subtitle: "🔬",
    description: "Khám phá thế giới khoa học qua thí nghiệm thực hành, video minh họa sinh động và bài tập ứng dụng thực tế từ lớp 6 đến lớp 12.",
    buttonText: "BẮT ĐẦU HỌC",
    buttonLink: "/courses",
    images: [
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
      "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400",
    ],
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "3",
    title: "Ngữ văn - Tiếng Anh",
    subtitle: "📚",
    description: "Nâng cao kỹ năng đọc hiểu, viết và giao tiếp. Phân tích tác phẩm văn học và luyện thi THPT Quốc gia hiệu quả.",
    buttonText: "HỌC THỬ MIỄN PHÍ",
    buttonLink: "/courses",
    images: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    ],
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
];

export const proCourses: Course[] = [
  {
    id: "1",
    title: "HTML CSS Pro",
    description: "Cho người mới bắt đầu",
    thumbnail: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=667eea&color=fff",
    originalPrice: 2500000,
    salePrice: 1299000,
    totalStudents: 590,
    totalLessons: 0,
    totalDuration: "116h50p",
    isPro: true,
    isFree: false,
    gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
  },
  {
    id: "2",
    title: "JavaScript Pro",
    description: "Cho người mới bắt đầu",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=f59e0b&color=fff",
    originalPrice: 3299000,
    salePrice: 1399000,
    totalStudents: 254,
    totalLessons: 0,
    totalDuration: "49h34p",
    isPro: true,
    isFree: false,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)",
  },
  {
    id: "3",
    title: "Ngôn ngữ Sass",
    description: "Cho Frontend Developer",
    thumbnail: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=ec4899&color=fff",
    originalPrice: 400000,
    salePrice: 299000,
    totalStudents: 27,
    totalLessons: 0,
    totalDuration: "6h18p",
    isPro: true,
    isFree: false,
    gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
  },
  {
    id: "4",
    title: "ReactJS Complete",
    description: "Từ cơ bản đến nâng cao",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=3b82f6&color=fff",
    originalPrice: 3500000,
    salePrice: 1599000,
    totalStudents: 412,
    totalLessons: 0,
    totalDuration: "68h25p",
    isPro: true,
    isFree: false,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
];

export const freeCourses: Course[] = [
  {
    id: "5",
    title: "HTML CSS cơ bản",
    description: "Khóa học miễn phí",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=10b981&color=fff",
    originalPrice: 0,
    salePrice: 0,
    totalStudents: 1250,
    totalLessons: 30,
    totalDuration: "12h30p",
    isPro: false,
    isFree: true,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    id: "6",
    title: "JavaScript cơ bản",
    description: "Khóa học miễn phí",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=f59e0b&color=fff",
    originalPrice: 0,
    salePrice: 0,
    totalStudents: 980,
    totalLessons: 25,
    totalDuration: "10h15p",
    isPro: false,
    isFree: true,
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  },
  {
    id: "7",
    title: "Git & GitHub",
    description: "Khóa học miễn phí",
    thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500",
    instructor: "Sơn Đặng",
    instructorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=6366f1&color=fff",
    originalPrice: 0,
    salePrice: 0,
    totalStudents: 756,
    totalLessons: 18,
    totalDuration: "8h45p",
    isPro: false,
    isFree: true,
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
];

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  gradient: string;
}

export interface BlogPost {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  authorAvatar: string;
  publishedAt: string;
  isVerified?: boolean;
}

export const featuredVideos: Video[] = [
  {
    id: "1",
    title: "Bạn sẽ làm được gì sau khóa học?",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    duration: "03:15",
    views: 1122768,
    likes: 6603,
    comments: 145,
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
  },
  {
    id: "2",
    title: "Sinh viên IT đi thực tập tại doanh nghiệp cần biết những gì?",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500",
    duration: "14:51",
    views: 263966,
    likes: 6442,
    comments: 235,
    gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
  },
  {
    id: "3",
    title: "Phương pháp học lập trình của Admin F8?",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
    duration: "21:06",
    views: 131658,
    likes: 6200,
    comments: 337,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  },
  {
    id: "4",
    title: '"Code Thiếu Nhi Battle" Tranh Giành Trà Sữa Size L',
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500",
    duration: "25:10",
    views: 282523,
    likes: 5681,
    comments: 181,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    id: "5",
    title: "Javascript có thể làm được gì? Giới thiệu qua về trang F8 | Học lập trình",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500",
    duration: "07:53",
    views: 869402,
    likes: 4591,
    comments: 127,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  {
    id: "6",
    title: "ReactJS là gì? Tại sao nên học ReactJS?",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    duration: "10:41",
    views: 517482,
    likes: 3917,
    comments: 349,
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
  {
    id: "7",
    title: "Các thẻ HTML thông dụng",
    thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500",
    duration: "15:23",
    views: 368936,
    likes: 3790,
    comments: 204,
    gradient: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
  },
  {
    id: "8",
    title: "Học Flexbox qua ví dụ",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=500",
    duration: "35:04",
    views: 259292,
    likes: 3491,
    comments: 212,
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  },
];

export const featuredBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Tổng hợp các sản phẩm của học viên tại F8",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500",
    author: "Sơn Đặng",
    authorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=3b82f6&color=fff",
    publishedAt: "6 phút đọc",
    isVerified: true,
  },
  {
    id: "2",
    title: "[Phần 1] Tạo dự án ReactJS với Webpack và Babel",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
    author: "Sơn Đặng",
    authorAvatar: "https://ui-avatars.com/api/?name=Son+Dang&background=3b82f6&color=fff",
    publishedAt: "12 phút đọc",
    isVerified: true,
  },
  {
    id: "3",
    title: "Cách đưa code lên GitHub và tạo GitHub Pages",
    thumbnail: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500",
    author: "Võ Minh Khả",
    authorAvatar: "https://ui-avatars.com/api/?name=Vo+Minh+Kha&background=f59e0b&color=fff",
    publishedAt: "4 phút đọc",
  },
  {
    id: "4",
    title: "Ký sự ngày thứ 25 học ở F8",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
    author: "Sơn Sớn",
    authorAvatar: "https://ui-avatars.com/api/?name=Son+Son&background=6366f1&color=fff",
    publishedAt: "1 phút đọc",
  },
  {
    id: "5",
    title: "Các nguồn tài nguyên hữu ích cho 1 front-end developer",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    author: "Dương Vương",
    authorAvatar: "https://ui-avatars.com/api/?name=Duong+Vuong&background=8b5cf6&color=fff",
    publishedAt: "2 phút đọc",
  },
  {
    id: "6",
    title: "Thời gian và Động lực",
    thumbnail: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=500",
    author: "Dong Ngo",
    authorAvatar: "https://ui-avatars.com/api/?name=Dong+Ngo&background=10b981&color=fff",
    publishedAt: "6 phút đọc",
  },
  {
    id: "7",
    title: "Tổng hợp tài liệu tự học tiếng anh có bản.",
    thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500",
    author: "Trung Lê Thành",
    authorAvatar: "https://ui-avatars.com/api/?name=Trung+Le&background=f59e0b&color=fff",
    publishedAt: "10 phút đọc",
  },
  {
    id: "8",
    title: "Học như thế nào là phù hợp ?",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500",
    author: "Ngoc Tien Pham",
    authorAvatar: "https://ui-avatars.com/api/?name=Ngoc+Tien&background=ec4899&color=fff",
    publishedAt: "4 phút đọc",
  },
];
