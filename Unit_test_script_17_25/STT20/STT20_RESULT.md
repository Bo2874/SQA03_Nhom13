# STT 20 — Báo Cáo Test Chi Tiết

## 📋 Thông Tin Chung

| Trường | Giá trị |
|--------|--------|
| **STT** | 20 |
| **Module** | APIs Search |
| **File nguồn** | `elearning-frontend/src/apis/search.ts` |
| **File test** | `test/STT20/search.api.test.ts` |
| **Config coverage** | `test/STT20/jest.coverage.20.js` |
| **Tổng số TC** | 27 |
| **Ngày chạy** | 2026-04-19 |

---

## ✅ Kết Quả Execution

### 1.1 Test Summary

```
Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        1.634 s (execution), 4.384 s (coverage)
Status:      ✅ ALL PASS
```

### 1.2 Danh Sách Test Cases (27 TC)

#### Nhóm A — searchCourses (16 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| **A.1 Query params construction** | | |
| TC_SEARCH_API_01 | Params rỗng {} → gọi với params={} | ✅ PASS |
| TC_SEARCH_API_02 | Chỉ có keyword | ✅ PASS |
| TC_SEARCH_API_03 | Đủ 5 field (keyword, subjectId, gradeLevelId, page, limit) | ✅ PASS |
| TC_SEARCH_API_04 | Input không bị mutate | ✅ PASS |
| TC_SEARCH_API_05 | Params undefined key vẫn được giữ | ✅ PASS |
| **A.2 Keyword encoding** | | |
| TC_SEARCH_API_06 | Keyword có dấu cách | ✅ PASS |
| TC_SEARCH_API_07 | Keyword tiếng Việt có dấu | ✅ PASS |
| TC_SEARCH_API_08 | Keyword chứa & | ✅ PASS |
| TC_SEARCH_API_09 | Keyword chứa # | ✅ PASS |
| TC_SEARCH_API_10 | Keyword rỗng "" | ✅ PASS |
| TC_SEARCH_API_11 | Keyword rất dài (>500 ký tự) | ✅ PASS |
| **A.3 Pagination edge** | | |
| TC_SEARCH_API_12 | page=0 passthrough | ✅ PASS |
| TC_SEARCH_API_13 | page âm passthrough | ✅ PASS |
| TC_SEARCH_API_14 | limit rất lớn (1000) | ✅ PASS |
| **A.4 Response shape** | | |
| TC_SEARCH_API_15 | Có kết quả | ✅ PASS |
| TC_SEARCH_API_16 | 0 kết quả | ✅ PASS |

#### Nhóm B — searchTeachers (3 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_SEARCH_API_17 | Params đủ 3 (keyword, page, limit) | ✅ PASS |
| TC_SEARCH_API_18 | Response teachers shape đầy đủ (totalCourses, totalStudents) preserve | ✅ PASS |
| TC_SEARCH_API_19 | 0 kết quả → teachers=[] | ✅ PASS |

#### Nhóm C — getTeacherById (4 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_SEARCH_API_20 | GET /teachers/:id | ✅ PASS |
| TC_SEARCH_API_21 | id=0 → URL /teachers/0 không rơi default | ✅ PASS |
| TC_SEARCH_API_22 | Response có courses array (nested) preserve nguyên vẹn | ✅ PASS |
| TC_SEARCH_API_23 | 404 (teacher không tồn tại) → propagate | ✅ PASS |

#### Nhóm D — ERROR & BEHAVIOR (4 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_SEARCH_API_24 | Network error reject với message | ✅ PASS |
| TC_SEARCH_API_25 | 500 Server Error propagate | ✅ PASS |
| TC_SEARCH_API_26 | Wrapper KHÔNG debounce — gọi 5 lần → 5 request | ✅ PASS |
| TC_SEARCH_API_27 | Wrapper KHÔNG cancel request cũ khi gọi mới | ✅ PASS |

---

## 📊 Code Coverage

### 2.1 Coverage Metrics

| Metric | Coverage | Mục tiêu | Status |
|--------|----------|----------|--------|
| **Statements** | 100% (102/102) | ≥ 80% | ✅ PASS |
| **Branches** | 100% (3/3) | ≥ 70% | ✅ PASS |
| **Functions** | 100% (3/3) | ≥ 90% | ✅ PASS |
| **Lines** | 100% (102/102) | ≥ 80% | ✅ PASS |

### 2.2 Coverage Chi Tiết theo Function

| Function | Statements | Branches | Lines | Status |
|----------|-----------|----------|-------|--------|
| `searchCourses` | 100% | 100% | 100% | ✅ PASS |
| `searchTeachers` | 100% | 100% | 100% | ✅ PASS |
| `getTeacherById` | 100% | 100% | 100% | ✅ PASS |

### 2.3 Coverage Chi Tiết theo Nhóm Test

| Nhóm | Test Cases | Functions Tested | Coverage % | Status |
|------|-----------|------------------|-----------|--------|
| **Nhóm A — searchCourses** | 16 | searchCourses | 100% | ✅ PASS |
| **Nhóm B — searchTeachers** | 3 | searchTeachers | 100% | ✅ PASS |
| **Nhóm C — getTeacherById** | 4 | getTeacherById | 100% | ✅ PASS |
| **Nhóm D — ERROR & BEHAVIOR** | 4 | searchCourses, searchTeachers, getTeacherById | 100% | ✅ PASS |

---

## 🏗️ Cấu Trúc Thư Mục

```
test/STT20/
├── search.api.test.ts             ← File test (27 TC)
├── jest.coverage.20.js            ← Config coverage
├── execution_report.txt           ← Output từ npm run test:20
├── coverage_report.txt            ← Output từ npm run coverage:20
└── coverage/                      ← HTML coverage report (sinh tự động)
    ├── index.html                 ← Trang tổng quan
    ├── elearning-frontend/
    │   └── src/
    │       └── apis/
    │           └── search.ts.html ← Chi tiết từng dòng
    └── lcov.info                  ← Dữ liệu thô cho CI/CD
```

---

## 🚀 Cách Chạy Test

### 3.1 Chạy toàn bộ test STT20

```bash
cd test
npm run test:20
```

**Hoặc với verbose:**

```bash
npx jest STT20/ --verbose --no-coverage
```

### 3.2 Chạy coverage STT20

```bash
npm run coverage:20
```

**Hoặc manual:**

```bash
npx jest STT20/ --config STT20/jest.coverage.20.js --coverageDirectory=STT20/coverage
```

### 3.3 Mở HTML coverage report

**Cách 1 — HTTP server (khuyến nghị):**

```bash
node serve-coverage.js 8000 20
# Mở browser: http://localhost:8000/index.html
```

**Cách 2 — Mở trực tiếp (có thể bị trắng trang):**

```bash
# Windows
start test/STT20/coverage/index.html
```

---

## 📝 Chi Tiết Chạy Test

### 4.1 Execution Report Text

```
PASS STT20/search.api.test.ts
  Nhóm A — searchCourses
    ✓ TC_SEARCH_API_01: Params rỗng {} → gọi với params={} (4 ms)
    ✓ TC_SEARCH_API_02: Chỉ có keyword (1 ms)
    ✓ TC_SEARCH_API_03: Đủ 5 field (keyword, subjectId, gradeLevelId, page, limit)
    ✓ TC_SEARCH_API_04: Input không bị mutate
    ✓ TC_SEARCH_API_05: Params undefined key vẫn được giữ (1 ms)
    ✓ TC_SEARCH_API_06: Keyword có dấu cách
    ✓ TC_SEARCH_API_07: Keyword tiếng Việt có dấu (1 ms)
    ✓ TC_SEARCH_API_08: Keyword chứa &
    ✓ TC_SEARCH_API_09: Keyword chứa #
    ✓ TC_SEARCH_API_10: Keyword rỗng ""
    ✓ TC_SEARCH_API_11: Keyword rất dài (>500 ký tự)
    ✓ TC_SEARCH_API_12: page=0 passthrough (1 ms)
    ✓ TC_SEARCH_API_13: page âm passthrough
    ✓ TC_SEARCH_API_14: limit rất lớn (1000)
    ✓ TC_SEARCH_API_15: Có kết quả (1 ms)
    ✓ TC_SEARCH_API_16: 0 kết quả (1 ms)
  Nhóm B — searchTeachers
    ✓ TC_SEARCH_API_17: Params đủ 3 (keyword, page, limit)
    ✓ TC_SEARCH_API_18: Response teachers shape đầy đủ (totalCourses, totalStudents) preserve
    ✓ TC_SEARCH_API_19: 0 kết quả → teachers=[]
  Nhóm C — getTeacherById
    ✓ TC_SEARCH_API_20: GET /teachers/:id (1 ms)
    ✓ TC_SEARCH_API_21: id=0 → URL /teachers/0 không rơi default
    ✓ TC_SEARCH_API_22: Response có courses array (nested) preserve nguyên vẹn (1 ms)
    ✓ TC_SEARCH_API_23: 404 (teacher không tồn tại) → propagate (16 ms)
  Nhóm D — ERROR & BEHAVIOR
    ✓ TC_SEARCH_API_24: Network error reject với message (1 ms)
    ✓ TC_SEARCH_API_25: 500 Server Error propagate
    ✓ TC_SEARCH_API_26: Wrapper KHÔNG debounce — gọi 5 lần → 5 request
    ✓ TC_SEARCH_API_27: Wrapper KHÔNG cancel request cũ khi gọi mới

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        1.634 s
```

### 4.2 Coverage Report Terminal

```
-----------|---------|----------|---------|---------|-------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------|---------|----------|---------|---------|-------------------
All files  |     100 |      100 |     100 |     100 |                   
 search.ts |     100 |      100 |     100 |     100 |                   
-----------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 102/102 )
Branches     : 100% ( 3/3 )
Functions    : 100% ( 3/3 )
Lines        : 100% ( 102/102 )
================================================================================
```

---

## ✨ Highlights

### 5.1 Test Coverage

- ✅ **100% Function Coverage** — Tất cả 3 functions được test
- ✅ **100% Statement Coverage** — Mọi dòng code được thực thi
- ✅ **100% Branch Coverage** — Tất cả nhánh điều kiện được test
- ✅ **27 Test Cases** — Bao quát tất cả scenarios

### 5.2 Test Scenarios Covered

#### Nhóm A — Query Parameters (16 TC)
- ✅ Params construction (empty, partial, complete)
- ✅ Input immutability
- ✅ Keyword encoding (Vietnamese, special chars, passthrough)
- ✅ Pagination edge cases (0, negative, large values)
- ✅ Response shape (with/without results)

#### Nhóm B — Teachers Search (3 TC)
- ✅ Full parameter passing
- ✅ Complex response structure preservation
- ✅ Empty result handling

#### Nhóm C — Get Teacher By ID (4 TC)
- ✅ URL parameter handling
- ✅ Edge case: id=0 (zero ID)
- ✅ Nested array preservation
- ✅ Error propagation (404)

#### Nhóm D — Error & Behavior (4 TC)
- ✅ Network error handling
- ✅ Server error (5xx) propagation
- ✅ No debounce verification (multiple requests)
- ✅ No request cancellation (old requests not cancelled)

---

## 📦 Fixtures & Setup

### 6.1 Mock Configuration

```typescript
jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
```

### 6.2 Clear Mocks Between Tests

```typescript
beforeEach(() => jest.clearAllMocks());
```

---

## ⚠️ Notes & Considerations

1. **Passthrough Tests (TC_06 → TC_09)**: Đây là guard tests để đảm bảo wrapper không can thiệp vào encoding của axios. Nếu tương lai có ai thêm `encodeURIComponent` thủ công, tests sẽ fail.

2. **Debounce & Request Cancellation (TC_26, TC_27)**: Wrapper `search.ts` là **functional wrapper** chỉ pass params; debounce và request cancellation là trách nhiệm của UI layer.

3. **No Database Required**: Tất cả tests sử dụng mocks của axios, không cần setup database hay rollback.

4. **Coverage Threshold**: Hiện tại đạt 100%, vượt quá mục tiêu (Statements: 80%, Branches: 70%, Functions: 90%, Lines: 80%).

---

## 📚 Files Reference

| File | Dòng | Nội dung |
|------|------|---------|
| `search.ts` | 55-65 | `searchCourses` function |
| `search.ts` | 68-78 | `searchTeachers` function |
| `search.ts` | 81-94 | `getTeacherById` function |
| `search.api.test.ts` | 1-27 | Nhóm A — searchCourses (16 TC) |
| `search.api.test.ts` | 28-59 | Nhóm B — searchTeachers (3 TC) |
| `search.api.test.ts` | 60-100 | Nhóm C — getTeacherById (4 TC) |
| `search.api.test.ts` | 101-154 | Nhóm D — Error & Behavior (4 TC) |

---

## 🎯 Checklist Hoàn Thành

```
✅ Đọc xong file .claude/STT20_apis_search.md
✅ Tạo test/STT20/ và file search.api.test.ts
✅ Tất cả 27 TC trong kế hoạch đã được implement (ID khớp)
✅ npm run test:20 → 27 PASS / 0 FAILED
✅ npm run coverage:20 → HTML report sinh ra trong STT20/coverage/
✅ Coverage: 100% Statements, 100% Branches, 100% Functions, 100% Lines
✅ jest.coverage.20.js được cấu hình đúng với rootDir = project root
✅ Không có uncovered lines (mục tiêu threshold đạt)
```

---

**Generated:** 2026-04-19 11:20 UTC+7  
**Runner:** Jest 29.7.0 / ts-jest 29.1.0  
**Status:** ✅ **ALL TESTS PASS - 100% COVERAGE**
