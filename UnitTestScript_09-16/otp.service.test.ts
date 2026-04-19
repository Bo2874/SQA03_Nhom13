/**
 * Unit Test Script: otp.service.ts
 * Tệp kiểm thử: elearning-backend/src/common/utils/otp.service.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. generateOTP() [private, kiểm tra qua createOTP] - Tạo mã OTP 6 chữ số ngẫu nhiên
 * 2. createOTP(email, prefix)  - Tạo và lưu OTP vào Redis
 * 3. verifyOTP(email, prefix, otp) - Xác thực OTP (single-use)
 */

// ─── Mock redisClient trước khi import module ─────────────────────────────────
jest.mock('../../../elearning-backend/src/common/utils/redis.client', () => ({
  redisClient: {
    setEx: jest.fn().mockResolvedValue('OK'),
    get:   jest.fn(),
    del:   jest.fn().mockResolvedValue(1),
  },
}));

import { OtpService } from '../../../elearning-backend/src/common/utils/otp.service';
import { redisClient } from '../../../elearning-backend/src/common/utils/redis.client';

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

let service: OtpService;

beforeEach(() => {
  service = new OtpService();
  jest.clearAllMocks();
  (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');
  (mockRedis.del   as jest.Mock).mockResolvedValue(1);
  delete process.env.OTP_EXPIRATION;
});

// =============================================================================
// 1. generateOTP() – kiểm tra gián tiếp qua createOTP()
// =============================================================================
describe('generateOTP() [private via createOTP]', () => {

  // TC_GENOTP_01
  it('[TC_GENOTP_01] OTP phải là chuỗi đúng 6 ký tự', async () => {
    let capturedOtp = '';
    (mockRedis.setEx as jest.Mock).mockImplementation((_key, _ttl, otp) => {
      capturedOtp = otp;
      return Promise.resolve('OK');
    });
    await service.createOTP('test@test.com', 'otp');
    expect(capturedOtp).toHaveLength(6);
  });

  // TC_GENOTP_02
  it('[TC_GENOTP_02] OTP chỉ chứa chữ số (0-9)', async () => {
    let capturedOtp = '';
    (mockRedis.setEx as jest.Mock).mockImplementation((_key, _ttl, otp) => {
      capturedOtp = otp;
      return Promise.resolve('OK');
    });
    await service.createOTP('test@test.com', 'otp');
    expect(/^[0-9]{6}$/.test(capturedOtp)).toBe(true);
  });

  // TC_GENOTP_03
  it('[TC_GENOTP_03] OTP trong khoảng 100000 đến 999999', async () => {
    let capturedOtp = '';
    (mockRedis.setEx as jest.Mock).mockImplementation((_key, _ttl, otp) => {
      capturedOtp = otp;
      return Promise.resolve('OK');
    });
    await service.createOTP('test@test.com', 'otp');
    const numOtp = parseInt(capturedOtp);
    expect(numOtp).toBeGreaterThanOrEqual(100000);
    expect(numOtp).toBeLessThanOrEqual(999999);
  });

  // TC_GENOTP_04
  it('[TC_GENOTP_04] Hai OTP liên tiếp phải khác nhau (tính ngẫu nhiên)', async () => {
    const otps: string[] = [];
    (mockRedis.setEx as jest.Mock).mockImplementation((_key, _ttl, otp) => {
      otps.push(otp);
      return Promise.resolve('OK');
    });
    await service.createOTP('a@test.com', 'otp');
    await service.createOTP('a@test.com', 'otp');
    // Xác suất trùng cực thấp: 1 / 900000
    expect(otps[0]).not.toBe(otps[1]);
  });
});

// =============================================================================
// 2. createOTP(email, prefix)
// =============================================================================
describe('createOTP(email, prefix)', () => {

  // TC_CREATE_01
  it('[TC_CREATE_01] nên trả về OTP string sau khi lưu Redis thành công', async () => {
    const result = await service.createOTP('test@gmail.com', 'otp');
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(6);
  });

  // TC_CREATE_02
  it("[TC_CREATE_02] CheckDB: key Redis đúng format '{prefix}:{email}'", async () => {
    await service.createOTP('a@b.com', 'reset-password:otp');
    expect(mockRedis.setEx).toHaveBeenCalledWith(
      'reset-password:otp:a@b.com',
      expect.any(Number),
      expect.any(String),
    );
  });

  // TC_CREATE_03
  it('[TC_CREATE_03] TTL mặc định là 300 giây khi OTP_EXPIRATION không được set', async () => {
    await service.createOTP('x@x.com', 'otp');
    expect(mockRedis.setEx).toHaveBeenCalledWith(
      expect.any(String),
      300,
      expect.any(String),
    );
  });

  // TC_CREATE_04
  it('[TC_CREATE_04] TTL dùng đúng giá trị từ OTP_EXPIRATION env', async () => {
    process.env.OTP_EXPIRATION = '600';
    await service.createOTP('x@x.com', 'otp');
    expect(mockRedis.setEx).toHaveBeenCalledWith(
      expect.any(String),
      600,
      expect.any(String),
    );
  });

  // TC_CREATE_05
  it('[TC_CREATE_05] CheckDB: redisClient.setEx được gọi đúng 1 lần', async () => {
    await service.createOTP('test@test.com', 'otp');
    expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
  });

  // TC_CREATE_06
  it('[TC_CREATE_06] nên reject khi Redis không khả dụng', async () => {
    (mockRedis.setEx as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.createOTP('test@test.com', 'otp')).rejects.toThrow('ECONNREFUSED');
  });
});

// =============================================================================
// 3. verifyOTP(email, prefix, otp)
// =============================================================================
describe('verifyOTP(email, prefix, otp)', () => {

  // TC_VERIFY_01
  it('[TC_VERIFY_01] nên trả về true và xóa key khi OTP khớp', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('123456');

    const result = await service.verifyOTP('test@test.com', 'otp', '123456');
    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith('otp:test@test.com');
  });

  // TC_VERIFY_02
  it('[TC_VERIFY_02] nên trả về false và KHÔNG xóa key khi OTP sai', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('123456');

    const result = await service.verifyOTP('test@test.com', 'otp', '999999');
    expect(result).toBe(false);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  // TC_VERIFY_03
  it('[TC_VERIFY_03] nên trả về false khi OTP đã hết hạn (Redis trả về null)', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue(null);

    const result = await service.verifyOTP('test@test.com', 'otp', '123456');
    expect(result).toBe(false);
  });

  // TC_VERIFY_04
  it('[TC_VERIFY_04] CheckDB: del được gọi đúng 1 lần CHỈ KHI OTP đúng', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('654321');

    await service.verifyOTP('a@b.com', 'otp', '654321');
    expect(mockRedis.del).toHaveBeenCalledTimes(1);
    expect(mockRedis.del).toHaveBeenCalledWith('otp:a@b.com');
  });

  // TC_VERIFY_05
  it('[TC_VERIFY_05] CheckDB: del KHÔNG được gọi khi OTP sai', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('123456');

    await service.verifyOTP('a@b.com', 'otp', '000000');
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  // TC_VERIFY_06
  it("[TC_VERIFY_06] CheckDB: key format nhất quán giữa get và del", async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('111111');

    await service.verifyOTP('test@test.com', 'otp', '111111');
    expect(mockRedis.get).toHaveBeenCalledWith('otp:test@test.com');
    expect(mockRedis.del).toHaveBeenCalledWith('otp:test@test.com');
  });

  // TC_VERIFY_07
  it('[TC_VERIFY_07] OTP chỉ dùng được 1 lần (gọi verify lần 2 trả về false)', async () => {
    // Lần 1: OTP tồn tại
    (mockRedis.get as jest.Mock).mockResolvedValueOnce('123456');
    // Lần 2: Redis đã xóa key → trả về null
    (mockRedis.get as jest.Mock).mockResolvedValueOnce(null);

    const first  = await service.verifyOTP('test@test.com', 'otp', '123456');
    const second = await service.verifyOTP('test@test.com', 'otp', '123456');

    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
