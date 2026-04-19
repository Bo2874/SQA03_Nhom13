/**
 * Unit Test Script: jwt-auth.guard.ts
 * Tệp kiểm thử: elearning-backend/src/common/guards/jwt-auth.guard.ts
 * Framework: Jest + @nestjs/testing
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. canActivate(context) - Bảo vệ route bằng JWT
 *    - Bypass nếu @Public()
 *    - Log warning nếu thiếu ACCESS_TOKEN cookie
 *    - Delegate sang super.canActivate() cho protected routes
 */

import { JwtAuthGuard } from '../../../elearning-backend/src/common/guards/jwt-auth.guard';
import { Reflector }    from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

// ─── Mock Reflector ───────────────────────────────────────────────────────────
const mockReflector = { getAllAndOverride: jest.fn() };

// ─── Helper tạo mock ExecutionContext ─────────────────────────────────────────
function createMockContext(cookies: Record<string, any> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies, method: 'GET', url: '/test' }),
    }),
    getHandler: () => ({}),
    getClass:   () => ({}),
  } as any;
}

let guard: JwtAuthGuard;
let superCanActivateSpy: jest.SpyInstance;

beforeEach(() => {
  guard = new JwtAuthGuard(mockReflector as any);
  // Spy trên prototype của AuthGuard('jwt') → super.canActivate
  superCanActivateSpy = jest
    .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
    .mockReturnValue(true as any);
  jest.clearAllMocks();
  // Re-apply spy sau clearAllMocks
  superCanActivateSpy = jest
    .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
    .mockReturnValue(true as any);
});

// =============================================================================
// canActivate(context)
// =============================================================================
describe('canActivate(context)', () => {

  // TC_JWT_01
  it('[TC_JWT_01] nên trả về true ngay khi endpoint có @Public() decorator', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true); // isPublic = true
    const result = guard.canActivate(createMockContext());
    expect(result).toBe(true);
    expect(superCanActivateSpy).not.toHaveBeenCalled();
  });

  // TC_JWT_02
  it('[TC_JWT_02] nên gọi super.canActivate() khi endpoint không có @Public()', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    guard.canActivate(createMockContext({ ACCESS_TOKEN: 'valid_token' }));
    expect(superCanActivateSpy).toHaveBeenCalledTimes(1);
  });

  // TC_JWT_03
  it('[TC_JWT_03] nên trả về kết quả từ super.canActivate() cho protected route', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    superCanActivateSpy.mockReturnValue(true as any);
    const result = guard.canActivate(createMockContext({ ACCESS_TOKEN: 'token' }));
    expect(result).toBe(true);
  });

  // TC_JWT_04
  it('[TC_JWT_04] nên trả về false khi super.canActivate() trả về false (token invalid)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    superCanActivateSpy.mockReturnValue(false as any);
    const result = guard.canActivate(createMockContext({ ACCESS_TOKEN: 'bad_token' }));
    expect(result).toBe(false);
  });

  // TC_JWT_05
  it('[TC_JWT_05] KHÔNG gọi super.canActivate() khi endpoint là @Public()', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    guard.canActivate(createMockContext());
    expect(superCanActivateSpy).toHaveBeenCalledTimes(0);
  });

  // TC_JWT_06
  it("[TC_JWT_06] CheckDB: reflector.getAllAndOverride được gọi với key 'isPublic'", () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    guard.canActivate(createMockContext());
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', expect.any(Array));
  });

  // TC_JWT_07
  it('[TC_JWT_07] nên KHÔNG throw khi thiếu ACCESS_TOKEN cookie (chỉ log warn)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    superCanActivateSpy.mockReturnValue(true as any);
    // cookies rỗng → không có ACCESS_TOKEN
    expect(() => guard.canActivate(createMockContext({}))).not.toThrow();
    expect(superCanActivateSpy).toHaveBeenCalled();
  });

  // TC_JWT_08
  it('[TC_JWT_08] nên gọi super.canActivate() bình thường khi có ACCESS_TOKEN', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    superCanActivateSpy.mockReturnValue(true as any);
    guard.canActivate(createMockContext({ ACCESS_TOKEN: 'valid_jwt_token' }));
    expect(superCanActivateSpy).toHaveBeenCalledTimes(1);
  });
});
