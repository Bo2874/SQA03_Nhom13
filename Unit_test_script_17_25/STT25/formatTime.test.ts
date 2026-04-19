/**
 * STT 25 — Unit tests for elearning-frontend/src/utils/formatTime.ts
 * 40 test cases
 */

// ── Imports ────────────────────────────────────────────────────
import { calculateTimeLeft, formatDate } from '@/utils/formatTime';

process.env.TZ = 'Asia/Ho_Chi_Minh';

const baseNow = new Date('2025-01-15T10:00:00.000Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(baseNow);
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Nhóm A — calculateTimeLeft (Happy path) ───────────────────
describe('Nhóm A — calculateTimeLeft (Happy path)', () => {
  it('TC_TIME_01: Còn 1 ngày chẵn', () => {
    const endTime = new Date(baseNow.getTime() + 86400000);
    expect(calculateTimeLeft(endTime)).toEqual([1, 0, 0, 0]);
  });

  it('TC_TIME_02: Còn 2h 30m 45s', () => {
    const endTime = new Date(baseNow.getTime() + (2 * 3600 + 30 * 60 + 45) * 1000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 2, 30, 45]);
  });

  it('TC_TIME_03: Còn 1 ngày 12h', () => {
    const endTime = new Date(baseNow.getTime() + (86400 + 12 * 3600) * 1000);
    expect(calculateTimeLeft(endTime)).toEqual([1, 12, 0, 0]);
  });

  it('TC_TIME_04: Còn chính xác 1 phút', () => {
    const endTime = new Date(baseNow.getTime() + 60000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 1, 0]);
  });

  it('TC_TIME_05: Còn chính xác 59 giây', () => {
    const endTime = new Date(baseNow.getTime() + 59000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 59]);
  });

  it('TC_TIME_06: Còn 1 giờ chẵn', () => {
    const endTime = new Date(baseNow.getTime() + 3600000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 1, 0, 0]);
  });

  it('TC_TIME_07: Còn 30 ngày', () => {
    const endTime = new Date(baseNow.getTime() + 30 * 86400000);
    expect(calculateTimeLeft(endTime)).toEqual([30, 0, 0, 0]);
  });
});

// ── Nhóm B — Boundary (CRITICAL) ──────────────────────────────
describe('Nhóm B — Boundary (CRITICAL)', () => {
  it('TC_TIME_08: endTime === now → [0,0,0,0]', () => {
    const endTime = new Date(baseNow.getTime());
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_09: endTime = now - 1ms → [0,0,0,0]', () => {
    const endTime = new Date(baseNow.getTime() - 1);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_10: endTime = now + 1ms → [0,0,0,0]', () => {
    const endTime = new Date(baseNow.getTime() + 1);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_11: endTime = now + 999ms → [0,0,0,0]', () => {
    const endTime = new Date(baseNow.getTime() + 999);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_12: endTime = now + 1000ms → [0,0,0,1]', () => {
    const endTime = new Date(baseNow.getTime() + 1000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 1]);
  });

  it('TC_TIME_13: endTime = now + 59999ms → [0,0,0,59]', () => {
    const endTime = new Date(baseNow.getTime() + 59999);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 59]);
  });

  it('TC_TIME_14: endTime = now + 60000ms → [0,0,1,0]', () => {
    const endTime = new Date(baseNow.getTime() + 60000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 1, 0]);
  });
});

// ── Nhóm C — Past time (không trả âm) ─────────────────────────
describe('Nhóm C — Past time (không trả âm)', () => {
  it('TC_TIME_15: endTime trong quá khứ 1 giờ', () => {
    const endTime = new Date(baseNow.getTime() - 3600000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_16: endTime rất xa trong quá khứ (1 năm)', () => {
    const endTime = new Date(baseNow.getTime() - 365 * 86400000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });

  it('TC_TIME_17: endTime = now - 1s', () => {
    const endTime = new Date(baseNow.getTime() - 1000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 0]);
  });
});

// ── Nhóm D — Future time xa ───────────────────────────────────
describe('Nhóm D — Future time xa', () => {
  it('TC_TIME_18: 10 năm sau', () => {
    const endTime = new Date(baseNow.getTime() + 10 * 365 * 86400000);
    expect(calculateTimeLeft(endTime)).toEqual([3650, 0, 0, 0]);
  });

  it('TC_TIME_19: 100 ngày 23h 59m 59s', () => {
    const endTime = new Date(baseNow.getTime() + (100 * 86400 + 23 * 3600 + 59 * 60 + 59) * 1000);
    expect(calculateTimeLeft(endTime)).toEqual([100, 23, 59, 59]);
  });
});

// ── Nhóm E — Transition ───────────────────────────────────────
describe('Nhóm E — Transition', () => {
  it('TC_TIME_20: 59s, advance 1s → sang phút mới', () => {
    const endTime = new Date(baseNow.getTime() + 60000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 1, 0]);

    jest.advanceTimersByTime(1000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 0, 0, 59]);
  });

  it('TC_TIME_21: Day transition (1 ngày → 23:59:59)', () => {
    const endTime = new Date(baseNow.getTime() + 24 * 3600 * 1000);
    expect(calculateTimeLeft(endTime)).toEqual([1, 0, 0, 0]);

    jest.advanceTimersByTime(1000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 23, 59, 59]);
  });

  it('TC_TIME_22: Hour transition gần mốc ngày mới', () => {
    const endTime = new Date(baseNow.getTime() + (24 * 3600 + 3600) * 1000);
    expect(calculateTimeLeft(endTime)).toEqual([1, 1, 0, 0]);

    jest.advanceTimersByTime(3600000);
    expect(calculateTimeLeft(endTime)).toEqual([1, 0, 0, 0]);
  });
});

// ── Nhóm F — Invalid input ────────────────────────────────────
describe('Nhóm F — Invalid input', () => {
  it('TC_TIME_23: endTime = null → throw TypeError', () => {
    expect(() => calculateTimeLeft(null as any)).toThrow(TypeError);
  });

  it('TC_TIME_24: endTime = undefined → throw', () => {
    expect(() => calculateTimeLeft(undefined as any)).toThrow();
  });

  it('TC_TIME_25: endTime = new Date("invalid") → NaN array', () => {
    const result = calculateTimeLeft(new Date('x'));
    expect(result.every((value) => Number.isNaN(value))).toBe(true);
  });

  it('TC_TIME_26: endTime là Date object hợp lệ', () => {
    const endTime = new Date(baseNow.getTime() + 3600000);
    expect(calculateTimeLeft(endTime)).toEqual([0, 1, 0, 0]);
  });
});

// ── Nhóm G — formatDate (Happy path) ──────────────────────────
describe('Nhóm G — formatDate (Happy path)', () => {
  it('TC_TIME_27: Default format DD/MM/YY', () => {
    expect(formatDate('2025-01-15T10:00:00Z')).toBe('15/01/25');
  });

  it('TC_TIME_28: Format MM/DD/YY', () => {
    expect(formatDate('2025-01-15T10:00:00Z', 'MM/DD/YY')).toBe('01/15/25');
  });

  it('TC_TIME_29: Ngày 1 chữ số padStart "0"', () => {
    expect(formatDate('2025-01-05T00:00:00Z')).toBe('05/01/25');
  });

  it('TC_TIME_30: Tháng 1 chữ số padStart', () => {
    expect(formatDate('2025-09-01T00:00:00Z')).toBe('01/09/25');
  });

  it('TC_TIME_31: Year lấy 2 chữ số cuối', () => {
    expect(formatDate('2025-12-31T00:00:00Z')).toBe('31/12/25');
  });

  it('TC_TIME_32: Năm 2099 → "99"', () => {
    expect(formatDate('2099-06-15T00:00:00Z')).toBe('15/06/99');
  });

  it('TC_TIME_33: Năm 2000 → "00"', () => {
    expect(formatDate('2000-01-01T00:00:00Z')).toBe('01/01/00');
  });
});

// ── Nhóm H — formatDate edge / invalid ────────────────────────
describe('Nhóm H — formatDate edge / invalid', () => {
  it('TC_TIME_34: ISO với timezone Z vs local → phụ thuộc timezone', () => {
    expect(formatDate('2025-01-15T23:00:00Z')).toBe('16/01/25');
  });

  it('TC_TIME_35: Invalid ISO "not-a-date" → NaN output', () => {
    expect(formatDate('not-a-date')).toBe('NaN/NaN/aN');
  });

  it('TC_TIME_36: Empty string "" → NaN output', () => {
    expect(formatDate('')).toBe('NaN/NaN/aN');
  });

  it('TC_TIME_37: Timestamp number string → invalid → NaN output', () => {
    expect(formatDate('1736937600000')).toBe('NaN/NaN/aN');
  });

  it('TC_TIME_38: Format "XX" as any → default DD/MM/YY', () => {
    expect(formatDate('2025-01-15T10:00:00Z', 'XX' as any)).toBe('15/01/25');
  });
});

// ── Nhóm I — Consistency & Performance ────────────────────────
describe('Nhóm I — Consistency & Performance', () => {
  it('TC_TIME_39: Gọi calculateTimeLeft 10000 lần (performance check)', () => {
    const endTime = new Date(baseNow.getTime() + 3600000);
    for (let i = 0; i < 10000; i++) {
      calculateTimeLeft(endTime);
    }
    expect(calculateTimeLeft(endTime)).toEqual([0, 1, 0, 0]);
  });

  it('TC_TIME_40: Gọi cùng endTime 2 lần liên tiếp → kết quả giống nhau', () => {
    const endTime = new Date(baseNow.getTime() + 60000);
    const first = calculateTimeLeft(endTime);
    const second = calculateTimeLeft(endTime);
    expect(first).toEqual(second);
  });
});
