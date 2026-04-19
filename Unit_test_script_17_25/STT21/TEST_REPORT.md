# STT 21 — Test Report: `apis/zoom.ts`

**File nguồn:** `elearning-frontend/src/apis/zoom.ts`
**File test:** `test/STT21/zoom.api.test.ts`
**Ngày chạy:** 2026-04-19 11:52
**Runner:** Jest 29.7.0 / ts-jest 29.1.0

---

## 1. Kết quả Execution Report

### Tổng quan

| Metric | Kết quả |
|--------|---------|
| Test Suites | 1 passed, 1 total |
| Tests | 25 passed, 0 failed, 25 total |
| Thời gian | 0.383 s |

### Chi tiết từng Test Case

#### Nhóm A — getZoomMeetings (4 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_01 | Không filter → params={} | ✅ PASS |
| TC_ZOOM_API_02 | Có courseId=5 → params={courseId:5} | ✅ PASS |
| TC_ZOOM_API_03 | courseId=0 → truthy check: params={} (bug tiềm tàng) | ✅ PASS |
| TC_ZOOM_API_04 | Response array preserve | ✅ PASS |

#### Nhóm B — getZoomMeetingById (3 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_05 | GET /zoom/meetings/:id | ✅ PASS |
| TC_ZOOM_API_06 | Response preserve đủ field (startUrl, joinUrl, meetingPassword) | ✅ PASS |
| TC_ZOOM_API_07 | 404 khi meeting không tồn tại | ✅ PASS |

#### Nhóm C — createZoomMeeting (8 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_08 | POST /zoom/meetings với body đầy đủ | ✅ PASS |
| TC_ZOOM_API_09 | Body nguyên vẹn — không mutate input | ✅ PASS |
| TC_ZOOM_API_10 | scheduledTime là ISO string — passthrough không convert | ✅ PASS |
| TC_ZOOM_API_11 | durationMinutes giữ type number | ✅ PASS |
| TC_ZOOM_API_12 | meetingPassword nằm trong BODY, không trong URL | ✅ PASS |
| TC_ZOOM_API_13 | meetingPassword không bị log/leak trong params | ✅ PASS |
| TC_ZOOM_API_14 | courseId sai → BE trả 400, wrapper propagate | ✅ PASS |
| TC_ZOOM_API_15 | teacherId không thuộc course → 403, propagate | ✅ PASS |

#### Nhóm D — updateZoomMeeting (4 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_16 | PUT /zoom/meetings/:id | ✅ PASS |
| TC_ZOOM_API_17 | Partial update body (chỉ title) | ✅ PASS |
| TC_ZOOM_API_18 | Update status → enum value đúng | ✅ PASS |
| TC_ZOOM_API_19 | 422 (vượt Zoom limit) propagate | ✅ PASS |

#### Nhóm E — deleteZoomMeeting (3 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_20 | DELETE /zoom/meetings/:id | ✅ PASS |
| TC_ZOOM_API_21 | 404 propagate | ✅ PASS |
| TC_ZOOM_API_22 | 403 (không phải chủ meeting) propagate | ✅ PASS |

#### Nhóm F — ERROR & BEHAVIORAL CONTRACT (3 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_ZOOM_API_23 | 401 Unauthorized propagate chung | ✅ PASS |
| TC_ZOOM_API_24 | Network error propagate | ✅ PASS |
| TC_ZOOM_API_25 | Wrapper KHÔNG retry — gọi 1 lần mock | ✅ PASS |

---

## 2. Kết quả Coverage Report

### Tổng quan Coverage

| Metric | Coverage | Chi tiết |
|--------|----------|----------|
| Statements | 100% | 74/74 |
| Branches | 100% | 7/7 |
| Functions | 100% | 5/5 |
| Lines | 100% | 74/74 |

### Chi tiết theo file

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
|------|---------|----------|---------|---------|-------------------|
| zoom.ts | 100% | 100% | 100% | 100% | - |

### Coverage theo nhóm

| Nhóm | Test Cases | Functions | Status |
|------|------------|-----------|--------|
| Nhóm A — getZoomMeetings | 4 | getZoomMeetings | ✅ PASS |
| Nhóm B — getZoomMeetingById | 3 | getZoomMeetingById | ✅ PASS |
| Nhóm C — createZoomMeeting | 8 | createZoomMeeting | ✅ PASS |
| Nhóm D — updateZoomMeeting | 4 | updateZoomMeeting | ✅ PASS |
| Nhóm E — deleteZoomMeeting | 3 | deleteZoomMeeting | ✅ PASS |
| Nhóm F — ERROR & BEHAVIORAL CONTRACT | 3 | - | ✅ PASS |

---

## 3. Hướng dẫn chạy test

### 3.1. Chạy Execution Test

```bash
cd test
npx jest STT21/ --config jest.config.js --verbose
```

**Output:**
```
PASS STT21/zoom.api.test.ts
  Nhóm A — getZoomMeetings
    √ TC_ZOOM_API_01: Không filter → params={} (2 ms)
    √ TC_ZOOM_API_02: Có courseId=5 → params={courseId:5}
    ...
  Nhóm F — ERROR & BEHAVIORAL CONTRACT
    √ TC_ZOOM_API_25: Wrapper KHÔNG retry — gọi 1 lần mock (1 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        0.383 s
```

### 3.2. Chạy Coverage Report

```bash
cd test
npx jest STT21/ --config STT21/jest.coverage.21.js
```

**Output:**
```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 zoom.ts  |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------

Coverage summary:
  Statements   : 100% ( 74/74 )
  Branches     : 100% ( 7/7 )
  Functions    : 100% ( 5/5 )
  Lines        : 100% ( 74/74 )
```

### 3.3. Mở HTML Coverage Report

```bash
# Cách 1: Mở trực tiếp
start test/STT21/coverage/index.html

# Cách 2: Serve qua HTTP (khuyến nghị)
cd test
node serve-coverage.js 8000 21
# Mở trình duyệt: http://localhost:8000/index.html
```

---

## 4. Cấu trúc thư mục STT21

```
test/STT21/
├── zoom.api.test.ts           ← File test (25 TC)
├── jest.coverage.21.js        ← Config coverage
├── execution_report.txt       ← Execution report text
├── TEST_REPORT.md             ← Báo cáo này
└── coverage/                  ← HTML Coverage Report
    ├── index.html             ← Trang tổng quan
    ├── lcov.info              ← Dữ liệu thô
    ├── zoom.ts.html           ← Chi tiết từng dòng
    └── ...
```

---

## 5. Ghi chú đặc biệt

### 5.1. Bug tiềm tàng phát hiện (TC_ZOOM_API_03)

Code sử dụng `courseId ? { courseId } : {}` — với `courseId=0` (ID hợp lệ về mặt kỹ thuật dù hiếm), sẽ bị coi là không có filter.

**Khuyến nghị:** Nên đổi thành `courseId !== undefined ? { courseId } : {}`

### 5.2. Security-critical (TC_ZOOM_API_12)

`meetingPassword` được đảm bảo nằm trong body, không lọt vào URL. Nếu password bị lọt vào URL, sẽ bị log ở server access log → lộ ngay.

---

## 6. Checklist

- [x] Đọc xong file `.claude/STT21_apis_zoom.md`
- [x] Tạo `test/STT21/` và file test
- [x] Tất cả 25 TC trong kế hoạch đã được implement (ID khớp)
- [x] `npm run test:21` → 0 failed
- [x] Coverage report sinh ra trong `STT21/coverage/`
- [x] `execution_report.txt` đã lưu
- [x] HTML overview rõ 4 chỉ số: Stmts / Branch / Funcs / Lines
- [x] HTML có bảng Test Groups (A/B/C/D/E/F)
- [x] HTML detail thấy code tô màu

---

**Người thực hiện:** Kiro AI Assistant
**Ngày hoàn thành:** 2026-04-19
