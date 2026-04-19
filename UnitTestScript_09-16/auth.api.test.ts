/**
 * Unit Test Script: apis/auth.ts
 * Tệp kiểm thử: elearning-frontend/src/apis/auth.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. login(data)                 - POST /auth/sign-in
 * 2. register(data)              - POST /auth/register
 * 3. getCurrentUserFromToken()   - GET /auth/me
 * 4. logout()                    - GET /auth/logout
 * 5. requestOtp(email, prefix)   - POST /auth/request-otp?prefix=...
 * 6. resetPassword(data)         - PUT /auth/reset-password
 * 7. getCurrentUser()            - localStorage.getItem('user')
 * 8. saveCurrentUser(user)       - localStorage.setItem('user', JSON.stringify(user))
 * 9. clearCurrentUser()          - localStorage.removeItem('user')
 */

// ─── Mock axiosRequest ────────────────────────────────────────────────────────
jest.mock('../../../elearning-frontend/src/config/axios', () => ({
  default: {
    post: jest.fn(),
    get:  jest.fn(),
    put:  jest.fn(),
  },
}));

import axiosReq from '../../../elearning-frontend/src/config/axios';
import {
  login, register, getCurrentUserFromToken, logout,
  requestOtp, resetPassword, getCurrentUser,
  saveCurrentUser, clearCurrentUser,
} from '../../../elearning-frontend/src/apis/auth';

const mockAxios = axiosReq as jest.Mocked<typeof axiosReq>;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// =============================================================================
// 1. login(data)
// =============================================================================
describe('login(data)', () => {

  // TC_LOGIN_01
  it("[TC_LOGIN_01] CheckDB: nên gọi axiosRequest.post với '/auth/sign-in'", async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: { token: 'abc' } });
    const data = { email: 'test@test.com', password: 'pass123' };
    await login(data as any);
    expect(mockAxios.post).toHaveBeenCalledWith('/auth/sign-in', data);
  });

  // TC_LOGIN_02
  it('[TC_LOGIN_02] nên trả về response từ axiosRequest', async () => {
    const mockRes = { data: { user: { id: 1 }, token: 'xyz' } };
    (mockAxios.post as jest.Mock).mockResolvedValue(mockRes);
    const result = await login({ email: 'a@a.com', password: 'pass' } as any);
    expect(result).toEqual(mockRes);
  });

  // TC_LOGIN_03
  it('[TC_LOGIN_03] nên reject khi server trả về 401 Unauthorized', async () => {
    (mockAxios.post as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));
    await expect(login({ email: 'a@a.com', password: 'wrong' } as any)).rejects.toThrow('401');
  });
});

// =============================================================================
// 2. register(data)
// =============================================================================
describe('register(data)', () => {

  // TC_REGISTER_01
  it("[TC_REGISTER_01] CheckDB: nên gọi axiosRequest.post với '/auth/register'", async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: { user: {} } });
    const data = { email: 'new@test.com', password: 'pass', otp: '123456' };
    await register(data as any);
    expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', data);
  });

  // TC_REGISTER_02
  it('[TC_REGISTER_02] nên trả về response khi đăng ký thành công', async () => {
    const mockRes = { data: { user: { id: 1, email: 'new@test.com' } } };
    (mockAxios.post as jest.Mock).mockResolvedValue(mockRes);
    const result = await register({ email: 'new@test.com', password: 'p', otp: '000000' } as any);
    expect(result).toEqual(mockRes);
  });

  // TC_REGISTER_03
  it('[TC_REGISTER_03] nên reject khi OTP sai hoặc hết hạn', async () => {
    (mockAxios.post as jest.Mock).mockRejectedValue(new Error('400 Bad Request'));
    await expect(register({ email: 'x@x.com', password: 'p', otp: 'bad' } as any)).rejects.toThrow('400');
  });
});

// =============================================================================
// 3. getCurrentUserFromToken()
// =============================================================================
describe('getCurrentUserFromToken()', () => {

  // TC_GETME_01
  it("[TC_GETME_01] CheckDB: nên gọi axiosRequest.get với '/auth/me'", async () => {
    (mockAxios.get as jest.Mock).mockResolvedValue({ data: { id: 1 } });
    await getCurrentUserFromToken();
    expect(mockAxios.get).toHaveBeenCalledWith('/auth/me');
  });

  // TC_GETME_02
  it('[TC_GETME_02] nên trả về user data khi token hợp lệ', async () => {
    const mockUser = { id: 1, email: 'a@a.com', role: 'student' };
    (mockAxios.get as jest.Mock).mockResolvedValue({ data: mockUser });
    const result = await getCurrentUserFromToken();
    expect(result).toEqual({ data: mockUser });
  });

  // TC_GETME_03
  it('[TC_GETME_03] nên reject khi token không hợp lệ (401)', async () => {
    (mockAxios.get as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));
    await expect(getCurrentUserFromToken()).rejects.toThrow('401');
  });
});

// =============================================================================
// 4. logout()
// =============================================================================
describe('logout()', () => {

  // TC_LOGOUT_01
  it("[TC_LOGOUT_01] CheckDB: nên gọi axiosRequest.get với '/auth/logout'", async () => {
    (mockAxios.get as jest.Mock).mockResolvedValue(undefined);
    await logout();
    expect(mockAxios.get).toHaveBeenCalledWith('/auth/logout');
  });

  // TC_LOGOUT_02
  it('[TC_LOGOUT_02] nên resolve bình thường khi server xử lý logout', async () => {
    (mockAxios.get as jest.Mock).mockResolvedValue(undefined);
    await expect(logout()).resolves.toBeUndefined();
  });
});

// =============================================================================
// 5. requestOtp(email, prefix)
// =============================================================================
describe('requestOtp(email, prefix)', () => {

  // TC_OTP_01
  it("[TC_OTP_01] URL chứa đúng query param prefix='otp'", async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: null });
    await requestOtp('a@b.com', 'otp');
    expect(mockAxios.post).toHaveBeenCalledWith('/auth/request-otp?prefix=otp', { email: 'a@b.com' });
  });

  // TC_OTP_02
  it("[TC_OTP_02] URL dùng prefix 'reset-password:otp' khi được truyền", async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: null });
    await requestOtp('a@b.com', 'reset-password:otp');
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/auth/request-otp?prefix=reset-password:otp',
      { email: 'a@b.com' },
    );
  });

  // TC_OTP_03
  it('[TC_OTP_03] Body request chứa {email} đúng', async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: null });
    await requestOtp('user@test.com', 'otp');
    const [, body] = (mockAxios.post as jest.Mock).mock.calls[0];
    expect(body).toEqual({ email: 'user@test.com' });
  });

  // TC_OTP_04
  it("[TC_OTP_04] prefix mặc định là 'otp' khi không truyền", async () => {
    (mockAxios.post as jest.Mock).mockResolvedValue({ data: null });
    await requestOtp('a@b.com');
    expect(mockAxios.post).toHaveBeenCalledWith('/auth/request-otp?prefix=otp', { email: 'a@b.com' });
  });
});

// =============================================================================
// 6. resetPassword(data)
// =============================================================================
describe('resetPassword(data)', () => {

  // TC_RESET_01
  it('[TC_RESET_01] CheckDB: nên gọi axiosRequest.put với endpoint và data đúng', async () => {
    (mockAxios.put as jest.Mock).mockResolvedValue({ data: {} });
    const data = { email: 'a@b.com', otp: '123456', newPassword: 'newpass' };
    await resetPassword(data as any);
    expect(mockAxios.put).toHaveBeenCalledWith('/auth/reset-password', data);
  });

  // TC_RESET_02
  it('[TC_RESET_02] nên trả về user data sau khi reset thành công', async () => {
    const mockRes = { data: { id: 1, email: 'a@b.com' } };
    (mockAxios.put as jest.Mock).mockResolvedValue(mockRes);
    const result = await resetPassword({ email: 'a@b.com', otp: '111111', newPassword: 'p' } as any);
    expect(result).toEqual(mockRes);
  });
});

// =============================================================================
// 7. getCurrentUser()
// =============================================================================
describe('getCurrentUser()', () => {

  // TC_GETLOCAL_01
  it('[TC_GETLOCAL_01] nên trả về user object khi localStorage có dữ liệu hợp lệ', () => {
    const user = { id: 1, email: 'a@b.com' };
    localStorage.setItem('user', JSON.stringify(user));
    const result = getCurrentUser();
    expect(result).toEqual(user);
  });

  // TC_GETLOCAL_02
  it("[TC_GETLOCAL_02] nên trả về null khi localStorage không có key 'user'", () => {
    const result = getCurrentUser();
    expect(result).toBeNull();
  });

  // TC_GETLOCAL_03
  it('[TC_GETLOCAL_03] nên trả về null khi JSON bị corrupted', () => {
    localStorage.setItem('user', 'invalid json {{{');
    const result = getCurrentUser();
    expect(result).toBeNull();
  });
});

// =============================================================================
// 8. saveCurrentUser(user)
// =============================================================================
describe('saveCurrentUser(user)', () => {

  // TC_SAVELOCAL_01
  it('[TC_SAVELOCAL_01] nên lưu user vào localStorage dưới dạng JSON', () => {
    const user = { id: 1, email: 'a@b.com', role: 'student' };
    saveCurrentUser(user);
    const stored = localStorage.getItem('user');
    expect(stored).toBe(JSON.stringify(user));
  });

  // TC_SAVELOCAL_02
  it('[TC_SAVELOCAL_02] nên không throw khi localStorage.setItem thất bại', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveCurrentUser({ id: 1 })).not.toThrow();
    spy.mockRestore();
  });
});

// =============================================================================
// 9. clearCurrentUser()
// =============================================================================
describe('clearCurrentUser()', () => {

  // TC_CLEARLOCAL_01
  it("[TC_CLEARLOCAL_01] nên removeItem localStorage với key 'user'", () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    clearCurrentUser();
    expect(localStorage.getItem('user')).toBeNull();
  });

  // TC_CLEARLOCAL_02
  it('[TC_CLEARLOCAL_02] nên không throw khi localStorage.removeItem lỗi', () => {
    const spy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => clearCurrentUser()).not.toThrow();
    spy.mockRestore();
  });
});
