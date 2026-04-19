/**
 * STT 24 — Unit tests for elearning-frontend/src/utils/toast.ts
 * 26 test cases
 */

// ── Mock react-hot-toast — phải đứng TRÊN tất cả import ──────
// Module được redirect sang test/__mocks__/react-hot-toast.js qua moduleNameMapper,
// đảm bảo cùng instance được dùng bởi cả test file và toast.ts.
jest.mock('react-hot-toast');

// ── Imports ────────────────────────────────────────────────────
import { successToast, errorToast, infoToast, warningToast } from '@/utils/toast';

// Lấy mock từ registry (cùng object mà toast.ts dùng khi gọi thư viện)
const toastMock = jest.requireMock('react-hot-toast').default as any;

beforeEach(() => jest.clearAllMocks());

// ── Nhóm A — Type routing ─────────────────────────────────────
describe('Nhóm A — Type routing (critical — tránh copy-paste bug)', () => {
  it('TC_TOAST_01: successToast gọi đúng toast.success', () => {
    successToast('Thành công');
    expect(toastMock.success).toHaveBeenCalledTimes(1);
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('TC_TOAST_02: errorToast gọi đúng toast.error', () => {
    errorToast('Lỗi');
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('TC_TOAST_03: infoToast gọi trực tiếp toast() (không phải .info)', () => {
    infoToast('Info');
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('TC_TOAST_04: warningToast gọi trực tiếp toast()', () => {
    warningToast('Cảnh báo');
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('TC_TOAST_05: Gọi successToast KHÔNG kích hoạt toast.error (regression guard)', () => {
    successToast('ok');
    expect(toastMock.error).toHaveBeenCalledTimes(0);
  });
});

// ── Nhóm B — Message passthrough ──────────────────────────────
describe('Nhóm B — Message passthrough', () => {
  it('TC_TOAST_06: Message truyền nguyên văn', () => {
    successToast('Hello');
    expect(toastMock.success.mock.calls[0][0]).toBe('Hello');
  });

  it('TC_TOAST_07: Empty string vẫn gọi toast với ""', () => {
    successToast('');
    expect(toastMock.success).toHaveBeenCalledTimes(1);
    expect(toastMock.success.mock.calls[0][0]).toBe('');
  });

  it('TC_TOAST_08: Message rất dài (1000 ký tự) passthrough không truncate', () => {
    const longMsg = 'a'.repeat(1000);
    successToast(longMsg);
    expect(toastMock.success.mock.calls[0][0]).toBe(longMsg);
    expect(toastMock.success.mock.calls[0][0]).toHaveLength(1000);
  });

  it('TC_TOAST_09: Message chứa HTML/script passthrough không escape', () => {
    const xss = '<script>alert(1)</script>';
    successToast(xss);
    expect(toastMock.success.mock.calls[0][0]).toBe(xss);
  });

  it('TC_TOAST_10: Message Unicode tiếng Việt có dấu passthrough', () => {
    successToast('Đã lưu thành công');
    expect(toastMock.success.mock.calls[0][0]).toBe('Đã lưu thành công');
  });
});

// ── Nhóm C — Options/Config ───────────────────────────────────
describe('Nhóm C — Options/Config', () => {
  // successToast options
  it('TC_TOAST_11: successToast — duration === 2500', () => {
    successToast('x');
    expect(toastMock.success.mock.calls[0][1].duration).toBe(2500);
  });

  it('TC_TOAST_12: successToast — position === "top-right"', () => {
    successToast('x');
    expect(toastMock.success.mock.calls[0][1].position).toBe('top-right');
  });

  it('TC_TOAST_13: successToast — style.background === "#333" và color === "#fff"', () => {
    successToast('x');
    const style = toastMock.success.mock.calls[0][1].style;
    expect(style.background).toBe('#333');
    expect(style.color).toBe('#fff');
  });

  it('TC_TOAST_14: successToast — style.borderRadius "8px" và padding "12px 20px"', () => {
    successToast('x');
    const style = toastMock.success.mock.calls[0][1].style;
    expect(style.borderRadius).toBe('8px');
    expect(style.padding).toBe('12px 20px');
  });

  it('TC_TOAST_15: successToast — iconTheme.primary === "#10b981"', () => {
    successToast('x');
    expect(toastMock.success.mock.calls[0][1].iconTheme.primary).toBe('#10b981');
  });

  it('TC_TOAST_16: successToast — iconTheme.secondary === "#fff"', () => {
    successToast('x');
    expect(toastMock.success.mock.calls[0][1].iconTheme.secondary).toBe('#fff');
  });

  // errorToast options
  it('TC_TOAST_17: errorToast — iconTheme.primary === "#ef4444" (red)', () => {
    errorToast('x');
    expect(toastMock.error.mock.calls[0][1].iconTheme.primary).toBe('#ef4444');
  });

  it('TC_TOAST_18: errorToast — options base giống successToast (duration, position, style core)', () => {
    errorToast('x');
    const opts = toastMock.error.mock.calls[0][1];
    expect(opts.duration).toBe(2500);
    expect(opts.position).toBe('top-right');
    expect(opts.style.background).toBe('#333');
    expect(opts.style.color).toBe('#fff');
  });

  // infoToast options
  it('TC_TOAST_19: infoToast — icon === "ℹ️"', () => {
    infoToast('Info');
    const opts = toastMock.mock.calls[0][1];
    expect(opts.icon).toBe('ℹ️');
  });

  it('TC_TOAST_20: infoToast — không set iconTheme (chỉ icon)', () => {
    infoToast('Info');
    const opts = toastMock.mock.calls[0][1];
    expect(opts.iconTheme).toBeUndefined();
  });

  // warningToast options
  it('TC_TOAST_21: warningToast — icon === "⚠️"', () => {
    warningToast('Warning');
    const opts = toastMock.mock.calls[0][1];
    expect(opts.icon).toBe('⚠️');
  });

  it('TC_TOAST_22: warningToast — style.background override thành "#f59e0b"', () => {
    warningToast('Warning');
    const opts = toastMock.mock.calls[0][1];
    expect(opts.style.background).toBe('#f59e0b');
  });

  it('TC_TOAST_23: warningToast — các style khác (color, borderRadius) vẫn giữ từ base', () => {
    warningToast('Warning');
    const style = toastMock.mock.calls[0][1].style;
    expect(style.color).toBe('#fff');
    expect(style.borderRadius).toBe('8px');
    expect(style.padding).toBe('12px 20px');
  });
});

// ── Nhóm D — Behavioral contract ─────────────────────────────
describe('Nhóm D — Behavioral contract', () => {
  it('TC_TOAST_24: successToast return undefined (void)', () => {
    const ret = successToast('x');
    expect(ret).toBeUndefined();
  });

  it('TC_TOAST_25: Gọi 10 lần liên tiếp — mỗi lần 1 call đến thư viện', () => {
    for (let i = 0; i < 10; i++) successToast(`msg ${i}`);
    expect(toastMock.success).toHaveBeenCalledTimes(10);
  });

  it('TC_TOAST_26: 4 wrapper không tự throw nếu message là undefined/null', () => {
    expect(() => successToast(undefined as any)).not.toThrow();
    expect(() => errorToast(null as any)).not.toThrow();
    expect(() => infoToast(undefined as any)).not.toThrow();
    expect(() => warningToast(null as any)).not.toThrow();
  });
});
