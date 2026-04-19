/**
 * Unit Test Script: chatbot.service.ts
 * Tệp kiểm thử: elearning-backend/src/modules/chatbot/chatbot.service.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. onModuleInit()                          - Khởi tạo AI model khi module load
 * 2. generateResponse(userMessage, history)  - Sinh câu trả lời từ AI
 */

jest.mock('fs', () => ({ existsSync: jest.fn() }));

import * as fs from 'fs';
import { ChatbotService } from '../../../elearning-backend/src/modules/chatbot/chatbot.service';

let service: ChatbotService;
const mockExistsSync = fs.existsSync as jest.Mock;

beforeEach(() => {
  service = new ChatbotService();
  (service as any).session = undefined;
  jest.clearAllMocks();
  mockExistsSync.mockReturnValue(false); // Mặc định: không có model file
});

// =============================================================================
// 1. onModuleInit()
// =============================================================================
describe('onModuleInit()', () => {

  // TC_INIT_01
  it('[TC_INIT_01] nên gọi loadModel() và không throw khi module khởi động', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  // TC_INIT_02
  it('[TC_INIT_02] nên không throw khi model file không tồn tại', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(service.onModuleInit()).resolves.not.toThrow?.();
  });

  // TC_INIT_03
  it('[TC_INIT_03] this.session vẫn undefined khi model file không tồn tại', async () => {
    mockExistsSync.mockReturnValue(false);
    await service.onModuleInit();
    expect((service as any).session).toBeUndefined();
  });
});

// =============================================================================
// 2. generateResponse(userMessage, history)
// =============================================================================
describe('generateResponse(userMessage, history)', () => {

  // TC_GEN_01
  it('[TC_GEN_01] nên trả về thông báo chờ khi session chưa được khởi tạo', async () => {
    (service as any).session = undefined;
    const result = await service.generateResponse('Xin chào');
    expect(typeof result).toBe('string');
    expect(result.toLowerCase()).toMatch(/đợi|chờ|khởi động/i);
  });

  // TC_GEN_02
  it('[TC_GEN_02] nên trả về câu trả lời từ AI khi session đã sẵn sàng', async () => {
    const mockSession = { prompt: jest.fn().mockResolvedValue('Xin chào! Tôi có thể giúp gì?') };
    (service as any).session = mockSession;

    const result = await service.generateResponse('Xin chào');
    expect(result).toBe('Xin chào! Tôi có thể giúp gì?');
  });

  // TC_GEN_03
  it('[TC_GEN_03] CheckDB: session.prompt được gọi với đúng userMessage', async () => {
    const mockPrompt = jest.fn().mockResolvedValue('OK');
    (service as any).session = { prompt: mockPrompt };

    await service.generateResponse('Toán là gì?');
    expect(mockPrompt).toHaveBeenCalledWith('Toán là gì?');
  });

  // TC_GEN_04
  it("[TC_GEN_04] nên trả về thông báo 'Bộ nhớ tạm thời đầy' khi lỗi 'No sequences left'", async () => {
    (service as any).session = {
      prompt: jest.fn().mockRejectedValue(new Error('No sequences left in context')),
    };
    const result = await service.generateResponse('test');
    expect(result).toMatch(/bộ nhớ|tạm thời|đầy/i);
  });

  // TC_GEN_05
  it('[TC_GEN_05] nên trả về thông báo lỗi chung khi gặp lỗi không xác định', async () => {
    (service as any).session = {
      prompt: jest.fn().mockRejectedValue(new Error('Unknown AI error')),
    };
    const result = await service.generateResponse('test');
    expect(result).toMatch(/trục trặc|lỗi|xin lỗi/i);
  });

  // TC_GEN_06
  it('[TC_GEN_06] không throw lỗi ra ngoài trong mọi trường hợp lỗi', async () => {
    (service as any).session = {
      prompt: jest.fn().mockRejectedValue(new Error('Critical failure')),
    };
    await expect(service.generateResponse('crash me')).resolves.not.toThrow?.();
    const result = await service.generateResponse('crash me again');
    expect(typeof result).toBe('string');
  });

  // TC_GEN_07
  it('[TC_GEN_07] luôn trả về kiểu string trong mọi trường hợp', async () => {
    // Case 1: session = undefined
    (service as any).session = undefined;
    const r1 = await service.generateResponse('test');
    expect(typeof r1).toBe('string');

    // Case 2: session hoạt động
    (service as any).session = { prompt: jest.fn().mockResolvedValue('response') };
    const r2 = await service.generateResponse('test');
    expect(typeof r2).toBe('string');
  });

  // TC_GEN_08
  it('[TC_GEN_08] history parameter được chấp nhận với giá trị mặc định []', async () => {
    (service as any).session = { prompt: jest.fn().mockResolvedValue('OK') };
    // Không truyền history
    await expect(service.generateResponse('hello')).resolves.toBeDefined();
    // Truyền history rỗng
    await expect(service.generateResponse('hello', [])).resolves.toBeDefined();
  });
});
