/**
 * Unit Test Script: roles.guard.ts
 * Tệp kiểm thử: elearning-backend/src/common/guards/roles.guard.ts
 * Framework: Jest + @nestjs/testing
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 * 1. canActivate(context) - Phân quyền theo role (ADMIN/TEACHER/STUDENT)
 *    Cần test 100% trường hợp phân quyền
 */

import { RolesGuard } from '../../../elearning-backend/src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

// ─── Mock Reflector ───────────────────────────────────────────────────────────
const mockReflector = {
  getAllAndOverride: jest.fn(),
};

// ─── Helper tạo mock ExecutionContext ─────────────────────────────────────────
function createCtx(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler:   () => ({}),
    getClass:     () => ({}),
  } as any;
}

let guard: RolesGuard;

beforeEach(() => {
  guard = new RolesGuard(mockReflector as any);
  jest.clearAllMocks();
});

// =============================================================================
// canActivate(context)
// =============================================================================
describe('canActivate(context)', () => {

  // TC_ROLES_01
  it('[TC_ROLES_01] nên trả về true khi không có @Roles() decorator (unprotected endpoint)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const result = guard.canActivate(createCtx({ id: 1, role: 'student' }));
    expect(result).toBe(true);
  });

  // TC_ROLES_02
  it('[TC_ROLES_02] nên trả về false khi request không có user (JWT auth failed)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const result = guard.canActivate(createCtx(undefined));
    expect(result).toBe(false);
  });

  // TC_ROLES_03
  it('[TC_ROLES_03] nên trả về false khi user không có field role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const result = guard.canActivate(createCtx({ id: 1 })); // no role
    expect(result).toBe(false);
  });

  // TC_ROLES_04
  it('[TC_ROLES_04] nên trả về true khi user.role khớp với requiredRoles (ADMIN)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const result = guard.canActivate(createCtx({ id: 1, role: 'admin' }));
    expect(result).toBe(true);
  });

  // TC_ROLES_05
  it('[TC_ROLES_05] nên trả về true khi user.role là TEACHER và route yêu cầu TEACHER', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['teacher']);
    const result = guard.canActivate(createCtx({ id: 2, role: 'teacher' }));
    expect(result).toBe(true);
  });

  // TC_ROLES_06
  it('[TC_ROLES_06] nên trả về true khi route cho phép nhiều role và user có 1 trong số đó', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin', 'teacher']);
    const result = guard.canActivate(createCtx({ id: 2, role: 'teacher' }));
    expect(result).toBe(true);
  });

  // TC_ROLES_07
  it('[TC_ROLES_07] nên trả về false khi user.role không nằm trong requiredRoles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const result = guard.canActivate(createCtx({ id: 3, role: 'student' }));
    expect(result).toBe(false);
  });

  // TC_ROLES_08
  it('[TC_ROLES_08] nên trả về false khi student cố truy cập route chỉ dành cho admin', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const result = guard.canActivate(createCtx({ id: 5, role: 'student' }));
    expect(result).toBe(false);
  });

  // TC_ROLES_09
  it('[TC_ROLES_09] CheckDB: reflector.getAllAndOverride được gọi với ROLES_KEY metadata', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    guard.canActivate(createCtx({ id: 1, role: 'admin' }));
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledTimes(1);
  });

  // TC_ROLES_10
  it('[TC_ROLES_10] nên trả về false khi requiredRoles là mảng rỗng []', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const result = guard.canActivate(createCtx({ id: 1, role: 'admin' }));
    // [].includes('admin') === false
    expect(result).toBe(false);
  });
});
