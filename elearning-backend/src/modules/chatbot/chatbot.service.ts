
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private model: any;
  private context: any;
  private session: any; // Lưu phiên chat toàn cục

  async onModuleInit() {
    await this.loadModel();
  }

  private async loadModel() {
    const modelPath = path.join(process.cwd(), 'models', 'model.gguf');
    
    if (!fs.existsSync(modelPath)) {
      console.warn('⚠️ KHÔNG TÌM THẤY MODEL AI!');
      return;
    }

    console.log('🔄 Đang khởi động AI Engine...');
    
    try {
      // Dynamic import để tránh lỗi ESM
      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
      
      const llama = await getLlama();
      
      this.model = await llama.loadModel({
        modelPath: modelPath,
      });

      // Tạo Context (Bộ nhớ)
      this.context = await this.model.createContext({
        contextSize: 2048, // Độ dài nhớ tối đa
        threads: 4,        // Số nhân CPU dùng để chạy
      });

      // KHỞI TẠO SESSION 1 LẦN DUY NHẤT Ở ĐÂY
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: `Bạn là Trợ lý ảo thông minh của hệ thống E-Learning.
        
        THÔNG TIN HỆ THỐNG:
        - Đây là nền tảng học trực tuyến kết nối Giáo viên và Học sinh.
        - Giáo viên có thể: Đăng ký, xác thực hồ sơ (CCCD, Bằng cấp), Tạo khóa học, Tạo chương, Tạo bài học, Tạo đề thi.
        - Học sinh có thể: Tìm kiếm khóa học, Đăng ký học, Xem video, Làm bài kiểm tra, Xem tiến trình.
        - Admin: Phê duyệt giáo viên và khóa học.
        
        NHIỆM VỤ CỦA BẠN:
        - Trả lời ngắn gọn (dưới 3 câu), thân thiện, lịch sự bằng Tiếng Việt.
        - Nếu được hỏi về kiến thức (Toán, Lý, Anh...), hãy đóng vai gia sư để giải thích.
        `
      });

      console.log('✅ AI Engine & Chat Session đã sẵn sàng!');
    } catch (error) {
      console.error('❌ Lỗi khởi động AI:', error);
    }
  }

  async generateResponse(userMessage: string, history: any[] = []): Promise<string> {
    if (!this.session) {
      return "Hệ thống AI đang khởi động, vui lòng đợi 5 giây và thử lại...";
    }

    try {
      console.log(`User: ${userMessage}`);
      
      // Sử dụng lại session đã tạo -> Không bị lỗi No sequences left
      // Session này sẽ tự động nhớ lịch sử chat trước đó
      const reply = await this.session.prompt(userMessage);
      
      console.log(`AI: ${reply}`);
      return reply;
    } catch (error) {
      console.error("Lỗi khi sinh câu trả lời:", error);
      
      // Nếu lỗi quá nặng (tràn bộ nhớ), thử reset lại session
      if (error.message.includes("No sequences left")) {
          return "Bộ nhớ tạm thời đầy. Vui lòng khởi động lại server để reset AI.";
      }
      
      return "Xin lỗi, tôi gặp chút trục trặc. Bạn hỏi lại được không?";
    }
  }
}
