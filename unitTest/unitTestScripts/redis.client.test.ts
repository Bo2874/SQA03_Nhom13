/**
 * Unit Test Script: redis.client.ts
 * Tệp kiểm thử: elearning-backend/src/common/utils/redis.client.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. connectRedis() - Kết nối Redis client, xử lý error
 */

const mockConnect = jest.fn();
const mockOn      = jest.fn();

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: mockConnect,
    on:      mockOn,
  }),
}));

import { createClient } from 'redis';

// Import module CẦN test sau khi mock xong
let connectRedis: () => Promise<void>;
let redisClientModule: any;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  mockConnect.mockResolvedValue(undefined);
  // Dynamic import để lấy fresh module
  redisClientModule = await import(
    '../../../elearning-backend/src/common/utils/redis.client'
  );
  connectRedis = redisClientModule.connectRedis;
});

// =============================================================================
// connectRedis()
// =============================================================================
describe('connectRedis()', () => {

  // TC_REDIS_01
  it('[TC_REDIS_01] CheckDB: connect() được gọi đúng 1 lần', async () => {
    await connectRedis();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  // TC_REDIS_02
  it('[TC_REDIS_02] nên resolve bình thường khi kết nối Redis thành công', async () => {
    mockConnect.mockResolvedValue(undefined);
    await expect(connectRedis()).resolves.toBeUndefined();
  });

  // TC_REDIS_03
  it('[TC_REDIS_03] nên ném lỗi ECONNREFUSED khi Redis không khả dụng', async () => {
    mockConnect.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(connectRedis()).rejects.toThrow('ECONNREFUSED');
  });

  // TC_REDIS_04
  it('[TC_REDIS_04] nên ném lỗi đúng loại khi timeout', async () => {
    mockConnect.mockRejectedValue(new Error('Connection timeout'));
    await expect(connectRedis()).rejects.toThrow('Connection timeout');
  });

  // TC_REDIS_05
  it('[TC_REDIS_05] URL Redis được xây dựng đúng từ env REDIS_HOST và REDIS_PORT', async () => {
    process.env.REDIS_HOST = 'redis-server';
    process.env.REDIS_PORT = '6380';
    jest.resetModules();
    const fresh = await import(
      '../../../elearning-backend/src/common/utils/redis.client'
    );
    // createClient phải được gọi với URL tương ứng
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'redis://redis-server:6380' })
    );
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
  });

  // TC_REDIS_06
  it('[TC_REDIS_06] URL dùng giá trị mặc định localhost:6379 khi env không set', async () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    jest.resetModules();
    await import('../../../elearning-backend/src/common/utils/redis.client');
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'redis://localhost:6379' })
    );
  });

  // TC_REDIS_07
  it("[TC_REDIS_07] onError handler được đăng ký trên redisClient với sự kiện 'error'", async () => {
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
