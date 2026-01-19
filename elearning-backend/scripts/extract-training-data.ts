import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
// Import tất cả entity từ file index
import * as Entities from '../src/entities'; 

// Load env
config({ path: '.env.dev' });

// Chuyển object Entities thành array
const entitiesArray = Object.values(Entities);

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: '1234', 
  database: 'elearning', 
  entities: entitiesArray, // Load tất cả entity
  synchronize: false,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TrainingExample {
  messages: ChatMessage[];
}

async function extractData() {
  try {
    console.log('🔄 Đang kết nối Database...');
    await AppDataSource.initialize();
    console.log('✅ Kết nối thành công!');

    const trainingData: TrainingExample[] = [];
    const systemPrompt = "Bạn là trợ lý AI thông minh của hệ thống E-Learning. Nhiệm vụ của bạn là hỗ trợ học viên và trả lời thông tin về khóa học, giảng viên.";

    // 1. TRÍCH XUẤT DỮ LIỆU KHÓA HỌC
    // Sử dụng Entities.Course thay vì Course trực tiếp để đồng bộ
    const courseRepo = AppDataSource.getRepository(Entities.Course);
    const courses = await courseRepo.find({
        relations: {
            teacher: true,
            subject: true,
            gradeLevel: true
        }
    });

    console.log(`📊 Tìm thấy ${courses.length} khóa học.`);

    for (const course of courses) {
        const teacherName = course.teacher?.fullName || 'Giảng viên hệ thống';
        const subjectName = course.subject?.name || 'Chung';
        const gradeName = course.gradeLevel?.name || 'Tất cả';

        // Mẫu 1: Giới thiệu khóa học
        trainingData.push({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Hãy giới thiệu về khóa học "${course.title}"` },
                { role: 'assistant', content: `Khóa học "${course.title}" thuộc môn ${subjectName}, dành cho ${gradeName}. Được giảng dạy bởi thầy/cô ${teacherName}. ${course.summary ? 'Tóm tắt: ' + course.summary : ''}` }
            ]
        });

        // Mẫu 2: Hỏi người dạy
        trainingData.push({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Ai là người dạy khóa học "${course.title}"?` },
                { role: 'assistant', content: `Giảng viên phụ trách khóa học "${course.title}" là thầy/cô ${teacherName}.` }
            ]
        });
    }

    // 2. TRÍCH XUẤT DỮ LIỆU GIÁO VIÊN
    const userRepo = AppDataSource.getRepository(Entities.User);
    const teachers = await userRepo.find({
        where: { role: 'TEACHER' as any }
    });

    console.log(`👨‍🏫 Tìm thấy ${teachers.length} giáo viên.`);

    for (const teacher of teachers) {
        trainingData.push({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Cho tôi biết về giảng viên ${teacher.fullName}` },
                { role: 'assistant', content: `Giảng viên ${teacher.fullName} hiện đang giảng dạy tại hệ thống E-Learning. Bạn có thể liên hệ qua email: ${teacher.email}.` }
            ]
        });
    }

    // 3. THÊM DỮ LIỆU NGHIỆP VỤ HỆ THỐNG
    const systemQA = [
        { q: "Làm thế nào để đăng ký tài khoản?", a: "Bạn có thể bấm vào nút 'Đăng ký' ở góc trên bên phải màn hình, điền email và mật khẩu để tạo tài khoản mới." },
        { q: "Tôi quên mật khẩu thì phải làm sao?", a: "Hãy bấm vào 'Quên mật khẩu' tại trang Đăng nhập, hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu cho bạn." },
        { q: "Hệ thống có những vai trò nào?", a: "Hệ thống có 3 vai trò chính: Admin (Quản trị), Teacher (Giáo viên - tạo khóa học) và Student (Học viên)." },
        { q: "Làm sao để trở thành giáo viên?", a: "Sau khi đăng ký tài khoản, bạn cần cập nhật hồ sơ cá nhân và gửi các bằng chứng chuyên môn. Admin sẽ duyệt hồ sơ của bạn trước khi bạn có thể tạo khóa học." }
    ];

    for (const qa of systemQA) {
        trainingData.push({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: qa.q },
                { role: 'assistant', content: qa.a }
            ]
        });
    }

    // GHI FILE JSONL
    const outputPath = path.join(__dirname, '../../ai_training_data.jsonl');
    const stream = fs.createWriteStream(outputPath, { flags: 'w' });
    
    for (const item of trainingData) {
        stream.write(JSON.stringify(item) + '\n');
    }

    stream.end();
    console.log(`\n✅ Thành công! Dữ liệu huấn luyện đã được xuất ra: ${outputPath}`);
    console.log(`📝 Tổng cộng: ${trainingData.length} mẫu hội thoại.`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
  }
}

extractData();
