# STT 21 — Hướng dẫn triển khai Unit Tests cho Zoom API

**File nguồn:** `elearning-frontend/src/apis/zoom.ts`  
**Tổng số test cases:** 25  
**Tổng số function test:** 5 (getZoomMeetings, getZoomMeetingById, createZoomMeeting, updateZoomMeeting, deleteZoomMeeting)

---

## 📋 Mục lục

1. [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
2. [Cấu trúc test](#cấu-trúc-test)
3. [Chạy test](#chạy-test)
4. [Kết quả mẫu](#kết-quả-mẫu)
5. [Tạo Coverage Report](#tạo-coverage-report)
6. [Xác minh hoàn thành](#xác-minh-hoàn-thành)

---

## 🚀 Chuẩn bị môi trường

### Bước 1: Cài đặt dependencies (chỉ 1 lần)

```bash
cd D:\4Y2S\sqa\SQA03_Nhom13\test
npm install
```

**Kiểm tra:** Thư mục `test/node_modules/` phải tồn tại và chứa `jest/`.

---

### Bước 2: Tạo thư mục STT21

```bash
cd test
mkdir STT21
```

---

## 📁 Cấu trúc test

### File cần tạo/kiểm tra

```
test/STT21/
├── zoom.api.test.ts              ← file test chính (tạo từ template)
├── jest.coverage.21.js            ← config coverage riêng
├── execution_report.txt           ← sinh tự động sau khi chạy test
├── coverage/                      ← sinh tự động sau khi chạy coverage
│   ├── index.html                 ← giao diện HTML xem coverage
│   └── ...
└── screenshots/                   ← tạo thủ công (chụp màn hình)
    ├── exec_overview.png
    ├── exec_detail.png
    ├── cov_terminal.png
    ├── cov_html_overview.png
    └── cov_html_detail.png
```

---

## 🔧 Cấu trúc Test File

### Bước 1: Tạo file `zoom.api.test.ts`

File này nên được tạo theo template chuẩn từ STT21 kế hoạch test (xem `.claude/STT21_apis_zoom.md`).

**Mẫu cơ bản:**

```typescript
/**
 * STT 21 — Unit tests for elearning-frontend/src/apis/zoom.ts
 * 25 test cases
 */

// ── Mock phải đứng TRÊN tất cả import ─────────────────────────
jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────
import axiosRequest from '@/config/axios';
import {
  getZoomMeetings,
  getZoomMeetingById,
  createZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
  ZoomMeeting,
  CreateZoomMeetingRequest,
  UpdateZoomMeetingRequest,
} from '@/apis/zoom';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ── Nhóm A — getZoomMeetings ──────────────────────────────────
describe('Nhóm A — getZoomMeetings', () => {
  it('TC_ZOOM_API_01: Không filter → params={}', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings();

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: {} });
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_02: Có courseId=5 → params={courseId:5}', async () => {
    const mockResponse = { message: 'ok', result: [{ id: 1, courseId: 5 }] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings(5);

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: { courseId: 5 } });
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_03: courseId=0 → falsy check (potential bug)', async () => {
    // Code: courseId ? {...} : {} → 0 bị coi là falsy
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings(0);

    // Bug: params={} thay vì params={courseId:0}
    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: {} });
  });

  it('TC_ZOOM_API_04: Response array preserve', async () => {
    const meeting1 = { id: 1, courseId: 1, title: 'Meeting 1', durationMinutes: 60 };
    const meeting2 = { id: 2, courseId: 1, title: 'Meeting 2', durationMinutes: 45 };
    const mockResponse = { message: 'ok', result: [meeting1, meeting2] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings();

    expect(result.result).toHaveLength(2);
    expect(result.result[0].id).toBe(1);
    expect(result.result[1].id).toBe(2);
  });
});

// ── Nhóm B — getZoomMeetingById ──────────────────────────────
describe('Nhóm B — getZoomMeetingById', () => {
  it('TC_ZOOM_API_05: GET /zoom/meetings/:id', async () => {
    const mockResponse = { message: 'ok', result: { id: 42, courseId: 1, title: 'Test' } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetingById(42);

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings/42');
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_06: Response preserve đủ field', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 1,
        courseId: 1,
        title: 'Meeting',
        startUrl: 'https://...',
        joinUrl: 'https://...',
        meetingPassword: 'abc123',
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetingById(1);

    expect(result.result.startUrl).toBeDefined();
    expect(result.result.joinUrl).toBeDefined();
    expect(result.result.meetingPassword).toBeDefined();
  });

  it('TC_ZOOM_API_07: 404 khi meeting không tồn tại', async () => {
    mockAxios.get.mockRejectedValue({ response: { status: 404 } });

    await expect(getZoomMeetingById(999)).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ── Nhóm C — createZoomMeeting ────────────────────────────────
describe('Nhóm C — createZoomMeeting', () => {
  const fullRequestBody: CreateZoomMeetingRequest = {
    courseId: 1,
    teacherId: 2,
    title: 'New Meeting',
    description: 'Test meeting',
    joinUrl: 'https://zoom.us/join',
    meetingPassword: 'secure123',
    scheduledTime: '2025-01-15T10:00:00Z',
    durationMinutes: 60,
  };

  it('TC_ZOOM_API_08: POST /zoom/meetings với body đầy đủ', async () => {
    const mockResponse = { message: 'ok', result: { id: 1, ...fullRequestBody } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createZoomMeeting(fullRequestBody);

    expect(mockAxios.post).toHaveBeenCalledWith('/zoom/meetings', fullRequestBody);
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_09: Body nguyên vẹn — không mutate input', async () => {
    const inputCopy = JSON.parse(JSON.stringify(fullRequestBody));
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(fullRequestBody);

    expect(fullRequestBody).toEqual(inputCopy);
  });

  it('TC_ZOOM_API_10: scheduledTime là ISO string — passthrough', async () => {
    const body = { ...fullRequestBody, scheduledTime: '2025-01-15T10:00:00Z' };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(body);

    const callArgs = mockAxios.post.mock.calls[0][1];
    expect(callArgs.scheduledTime).toBe('2025-01-15T10:00:00Z');
  });

  it('TC_ZOOM_API_11: durationMinutes giữ type number', async () => {
    const body = { ...fullRequestBody, durationMinutes: 60 };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(body);

    const callArgs = mockAxios.post.mock.calls[0][1];
    expect(callArgs.durationMinutes).toBe(60);
    expect(typeof callArgs.durationMinutes).toBe('number');
  });

  it('TC_ZOOM_API_12: meetingPassword nằm trong BODY, không URL', async () => {
    const body = { ...fullRequestBody, meetingPassword: 'abc123' };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(body);

    const callUrl = mockAxios.post.mock.calls[0][0];
    expect(callUrl).not.toContain('abc123');
    expect(callUrl).toBe('/zoom/meetings');
  });

  it('TC_ZOOM_API_13: meetingPassword chỉ xuất hiện trong body JSON', async () => {
    const body = { ...fullRequestBody, meetingPassword: 'secret_pass' };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(body);

    const [url, bodyArg] = mockAxios.post.mock.calls[0];
    expect(url).not.toContain('secret_pass');
    expect(bodyArg.meetingPassword).toBe('secret_pass');
  });

  it('TC_ZOOM_API_14: courseId sai → BE trả 400, wrapper propagate', async () => {
    const body = { ...fullRequestBody, courseId: 999 };
    mockAxios.post.mockRejectedValue({ response: { status: 400 } });

    await expect(createZoomMeeting(body)).rejects.toEqual({
      response: { status: 400 },
    });
  });

  it('TC_ZOOM_API_15: teacherId không thuộc course → 403 propagate', async () => {
    const body = { ...fullRequestBody, teacherId: 999 };
    mockAxios.post.mockRejectedValue({ response: { status: 403 } });

    await expect(createZoomMeeting(body)).rejects.toEqual({
      response: { status: 403 },
    });
  });
});

// ── Nhóm D — updateZoomMeeting ────────────────────────────────
describe('Nhóm D — updateZoomMeeting', () => {
  it('TC_ZOOM_API_16: PUT /zoom/meetings/:id', async () => {
    const updateBody: UpdateZoomMeetingRequest = { title: 'Updated Title' };
    const mockResponse = { message: 'ok', result: { id: 42, title: 'Updated Title' } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateZoomMeeting(42, updateBody);

    expect(mockAxios.put).toHaveBeenCalledWith('/zoom/meetings/42', updateBody);
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_17: Partial update body (chỉ title)', async () => {
    const updateBody: UpdateZoomMeetingRequest = { title: 'New Title' };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateZoomMeeting(1, updateBody);

    const callArgs = mockAxios.put.mock.calls[0][1];
    expect(Object.keys(callArgs)).toEqual(['title']);
  });

  it('TC_ZOOM_API_18: Update status → enum value đúng', async () => {
    const updateBody: UpdateZoomMeetingRequest = { status: 'ENDED' };
    const mockResponse = { message: 'ok', result: { id: 1, status: 'ENDED' } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateZoomMeeting(1, updateBody);

    const callArgs = mockAxios.put.mock.calls[0][1];
    expect(callArgs.status).toBe('ENDED');
  });

  it('TC_ZOOM_API_19: 422 (vượt Zoom limit) propagate', async () => {
    const updateBody: UpdateZoomMeetingRequest = { durationMinutes: 5000 };
    mockAxios.put.mockRejectedValue({ response: { status: 422 } });

    await expect(updateZoomMeeting(1, updateBody)).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

// ── Nhóm E — deleteZoomMeeting ────────────────────────────────
describe('Nhóm E — deleteZoomMeeting', () => {
  it('TC_ZOOM_API_20: DELETE /zoom/meetings/:id', async () => {
    const mockResponse = { message: 'ok', result: { message: 'Deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteZoomMeeting(42);

    expect(mockAxios.delete).toHaveBeenCalledWith('/zoom/meetings/42');
    expect(result).toEqual(mockResponse);
  });

  it('TC_ZOOM_API_21: 404 propagate', async () => {
    mockAxios.delete.mockRejectedValue({ response: { status: 404 } });

    await expect(deleteZoomMeeting(999)).rejects.toEqual({
      response: { status: 404 },
    });
  });

  it('TC_ZOOM_API_22: 403 (không phải chủ meeting) propagate', async () => {
    mockAxios.delete.mockRejectedValue({ response: { status: 403 } });

    await expect(deleteZoomMeeting(1)).rejects.toEqual({
      response: { status: 403 },
    });
  });
});

// ── Nhóm F — ERROR & BEHAVIORAL CONTRACT ──────────────────────
describe('Nhóm F — ERROR & BEHAVIORAL CONTRACT', () => {
  it('TC_ZOOM_API_23: 401 Unauthorized propagate chung', async () => {
    mockAxios.get.mockRejectedValue({ response: { status: 401 } });

    await expect(getZoomMeetings()).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('TC_ZOOM_API_24: Network error propagate', async () => {
    const networkError = new Error('ECONNREFUSED');
    mockAxios.get.mockRejectedValue(networkError);

    await expect(getZoomMeetings()).rejects.toEqual(networkError);
  });

  it('TC_ZOOM_API_25: Wrapper KHÔNG retry — gọi 1 lần mock', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    await getZoomMeetings();

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });
});
```

> Để lấy file test hoàn chỉnh, hãy chạy từ template hoặc copy từ STT20 và điều chỉnh theo spec của Zoom API.

---

### Bước 2: Tạo file `jest.coverage.21.js`

Tạo file `test/STT21/jest.coverage.21.js`:

```javascript
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.resolve(__dirname, '..');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: PROJECT_ROOT,
  transform: {
    '^.+\\.tsx?$': [
      path.join(TEST_DIR, 'node_modules/ts-jest'),
      { tsconfig: path.join(TEST_DIR, 'tsconfig.json') },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/elearning-frontend/src/$1',
  },
  testMatch: ['<rootDir>/test/STT21/**/*.test.ts'],
  clearMocks: true,
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  collectCoverageFrom: ['elearning-frontend/src/apis/zoom.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 90,
      lines: 80,
    },
  },
};
```

---

## ▶️ Chạy test

### Chạy test thường (nhanh, không coverage HTML)

```bash
cd test
npm run test:21
```

**Hoặc chi tiết hơn (verbose):**

```bash
npx jest STT21/ --verbose --no-coverage 2>&1 | tee STT21/execution_report.txt
```

### Kết quả mẫu

**Output trên terminal (nên thấy tất cả test PASS):**

```
 PASS  STT21/zoom.api.test.ts
  Nhóm A — getZoomMeetings
    ✓ TC_ZOOM_API_01: Không filter → params={} (2 ms)
    ✓ TC_ZOOM_API_02: Có courseId=5 → params={courseId:5} (1 ms)
    ✓ TC_ZOOM_API_03: courseId=0 → falsy check (potential bug) (1 ms)
    ✓ TC_ZOOM_API_04: Response array preserve (1 ms)
  Nhóm B — getZoomMeetingById
    ✓ TC_ZOOM_API_05: GET /zoom/meetings/:id (1 ms)
    ✓ TC_ZOOM_API_06: Response preserve đủ field (1 ms)
    ✓ TC_ZOOM_API_07: 404 khi meeting không tồn tại (1 ms)
  Nhóm C — createZoomMeeting
    ✓ TC_ZOOM_API_08: POST /zoom/meetings với body đầy đủ (1 ms)
    ✓ TC_ZOOM_API_09: Body nguyên vẹn — không mutate input (1 ms)
    ✓ TC_ZOOM_API_10: scheduledTime là ISO string — passthrough (1 ms)
    ✓ TC_ZOOM_API_11: durationMinutes giữ type number (1 ms)
    ✓ TC_ZOOM_API_12: meetingPassword nằm trong BODY, không URL (1 ms)
    ✓ TC_ZOOM_API_13: meetingPassword chỉ xuất hiện trong body JSON (1 ms)
    ✓ TC_ZOOM_API_14: courseId sai → BE trả 400, wrapper propagate (1 ms)
    ✓ TC_ZOOM_API_15: teacherId không thuộc course → 403 propagate (1 ms)
  Nhóm D — updateZoomMeeting
    ✓ TC_ZOOM_API_16: PUT /zoom/meetings/:id (1 ms)
    ✓ TC_ZOOM_API_17: Partial update body (chỉ title) (1 ms)
    ✓ TC_ZOOM_API_18: Update status → enum value đúng (1 ms)
    ✓ TC_ZOOM_API_19: 422 (vượt Zoom limit) propagate (1 ms)
  Nhóm E — deleteZoomMeeting
    ✓ TC_ZOOM_API_20: DELETE /zoom/meetings/:id (1 ms)
    ✓ TC_ZOOM_API_21: 404 propagate (1 ms)
    ✓ TC_ZOOM_API_22: 403 (không phải chủ meeting) propagate (1 ms)
  Nhóm F — ERROR & BEHAVIORAL CONTRACT
    ✓ TC_ZOOM_API_23: 401 Unauthorized propagate chung (1 ms)
    ✓ TC_ZOOM_API_24: Network error propagate (1 ms)
    ✓ TC_ZOOM_API_25: Wrapper KHÔNG retry — gọi 1 lần mock (1 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        1.823 s
```

---

## 📊 Tạo Coverage Report

### Chạy coverage (tạo HTML report)

```bash
cd test
npm run coverage:21
```

**Output terminal sẽ hiển thị bảng coverage:**

```
----------|----------|----------|----------|----------|-------------------
File      | % Stmts  | % Branch | % Funcs  | % Lines  | Uncovered Line #s
----------|----------|----------|----------|----------|-------------------
All files |    100   |     100  |    100   |    100   |
 apis/    |          |          |          |          |
  zoom.ts |    100   |     100  |    100   |    100   |
----------|----------|----------|----------|----------|-------------------

Coverage summary:
  Statements   : 100% ( 64/64 )
  Branches     : 100% ( 8/8 )
  Functions    : 100% ( 5/5 )
  Lines        : 100% ( 64/64 )
```

### Mở HTML coverage report

```bash
# Windows — mở trực tiếp
start test/STT21/coverage/index.html

# Hoặc serve qua HTTP (khuyến nghị)
cd test
node serve-coverage.js 8000 21
# Mở browser: http://localhost:8000/index.html
```

**HTML page sẽ hiển thị:**
- 📊 4 chỉ số coverage: Statements, Branches, Functions, Lines
- 📑 Bảng chi tiết theo file (click vào zoom.ts xem code tô màu)
- 🟢 Dòng code được test → màu xanh
- 🔴 Dòng code chưa test → màu đỏ
- 🟡 Nhánh chỉ test 1 phần → màu vàng

---

## ✅ Xác minh hoàn thành

### Checklist cuối cùng

```
☑ Tạo thư mục test/STT21/
☑ Tạo file zoom.api.test.ts (25 TC)
☑ Tạo file jest.coverage.21.js
☑ npm run test:21 → 0 failed (all 25 PASS)
☑ npm run coverage:21 → Coverage ≥ 80/70/90/80 (Stmts/Branch/Funcs/Lines)
☑ execution_report.txt lưu lại kết quả
☑ Chụp 5 ảnh screenshot:
   - exec_overview.png (terminal: Tests summary)
   - exec_detail.png (terminal: danh sách TC ✓)
   - cov_terminal.png (terminal: bảng coverage %)
   - cov_html_overview.png (HTML: 4 chỉ số + bảng file)
   - cov_html_detail.png (HTML: code tô màu xanh/đỏ)
☑ Toàn bộ file đặt trong test/STT21/
```

---

## 📝 Cấu trúc thư mục cuối cùng

```
test/STT21/
├── zoom.api.test.ts
├── jest.coverage.21.js
├── execution_report.txt
├── IMPLEMENTATION_GUIDE.md (file này)
├── coverage/
│   ├── index.html
│   └── ... (tự động sinh)
└── screenshots/
    ├── exec_overview.png
    ├── exec_detail.png
    ├── cov_terminal.png
    ├── cov_html_overview.png
    └── cov_html_detail.png
```

---

## 🔗 Liên kết tài liệu

- **Kế hoạch chi tiết:** `.claude/STT21_apis_zoom.md`
- **Hướng dẫn chung:** `.claude/HUONG_DAN_VIET_TEST_STT.md`
- **Source code:** `elearning-frontend/src/apis/zoom.ts`

---

**Cập nhật:** 2026-04-19  
**Trạng thái:** Sẵn sàng triển khai ✅
