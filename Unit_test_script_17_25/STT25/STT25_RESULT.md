# STT 25 — Báo Cáo Test Chi Tiết (formatTime)

## 1. Thông tin chung

| Trường | Giá trị |
|--------|---------|
| **STT** | 25 |
| **Module** | Utils — formatTime |
| **File nguồn** | `elearning-frontend/src/utils/formatTime.ts` |
| **File test** | `test/STT25/formatTime.test.ts` |
| **Config coverage** | `test/STT25/jest.coverage.25.js` |
| **Tổng số TC** | 40 |
| **Ngày chạy** | 2026-04-19 |

---

## 2. Cách chạy test + sinh HTML

```bash
cd test

# Chạy test STT25
npm run test:25

# Chạy coverage + sinh HTML + inject bảng nhóm
npm run coverage:25

# Mở HTML coverage (HTTP server)
npm run serve:25
# Mở trình duyệt: http://localhost:8000/index.html
```

Mở trực tiếp file HTML (có thể bị trắng trang trên một số máy):

```bash
start test/STT25/coverage/index.html
```

---

## 3. Kết quả Execution (Jest)

```
Test Suites: 1 passed, 1 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        0.457 s
Status:      ALL PASS
```

### 3.1 Danh sách Test Cases (40 TC)

#### Nhóm A — calculateTimeLeft (Happy path)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_01 | Còn 1 ngày chẵn | PASS |
| TC_TIME_02 | Còn 2h 30m 45s | PASS |
| TC_TIME_03 | Còn 1 ngày 12h | PASS |
| TC_TIME_04 | Còn chính xác 1 phút | PASS |
| TC_TIME_05 | Còn chính xác 59 giây | PASS |
| TC_TIME_06 | Còn 1 giờ chẵn | PASS |
| TC_TIME_07 | Còn 30 ngày | PASS |

#### Nhóm B — Boundary (CRITICAL)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_08 | endTime === now → [0,0,0,0] | PASS |
| TC_TIME_09 | endTime = now - 1ms → [0,0,0,0] | PASS |
| TC_TIME_10 | endTime = now + 1ms → [0,0,0,0] | PASS |
| TC_TIME_11 | endTime = now + 999ms → [0,0,0,0] | PASS |
| TC_TIME_12 | endTime = now + 1000ms → [0,0,0,1] | PASS |
| TC_TIME_13 | endTime = now + 59999ms → [0,0,0,59] | PASS |
| TC_TIME_14 | endTime = now + 60000ms → [0,0,1,0] | PASS |

#### Nhóm C — Past time (không trả âm)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_15 | endTime trong quá khứ 1 giờ | PASS |
| TC_TIME_16 | endTime rất xa trong quá khứ (1 năm) | PASS |
| TC_TIME_17 | endTime = now - 1s | PASS |

#### Nhóm D — Future time xa

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_18 | 10 năm sau | PASS |
| TC_TIME_19 | 100 ngày 23h 59m 59s | PASS |

#### Nhóm E — Transition

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_20 | 59s, advance 1s → sang phút mới | PASS |
| TC_TIME_21 | Day transition (1 ngày → 23:59:59) | PASS |
| TC_TIME_22 | Hour transition gần mốc ngày mới | PASS |

#### Nhóm F — Invalid input

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_23 | endTime = null → throw TypeError | PASS |
| TC_TIME_24 | endTime = undefined → throw | PASS |
| TC_TIME_25 | endTime = new Date("invalid") → NaN array | PASS |
| TC_TIME_26 | endTime là Date object hợp lệ | PASS |

#### Nhóm G — formatDate (Happy path)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_27 | Default format DD/MM/YY | PASS |
| TC_TIME_28 | Format MM/DD/YY | PASS |
| TC_TIME_29 | Ngày 1 chữ số padStart "0" | PASS |
| TC_TIME_30 | Tháng 1 chữ số padStart | PASS |
| TC_TIME_31 | Year lấy 2 chữ số cuối | PASS |
| TC_TIME_32 | Năm 2099 → "99" | PASS |
| TC_TIME_33 | Năm 2000 → "00" | PASS |

#### Nhóm H — formatDate edge / invalid

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_34 | ISO với timezone Z vs local → phụ thuộc timezone | PASS |
| TC_TIME_35 | Invalid ISO "not-a-date" → NaN output | PASS |
| TC_TIME_36 | Empty string "" → NaN output | PASS |
| TC_TIME_37 | Timestamp number string → invalid → NaN output | PASS |
| TC_TIME_38 | Format "XX" as any → default DD/MM/YY | PASS |

#### Nhóm I — Consistency & Performance

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_TIME_39 | Gọi calculateTimeLeft 10000 lần (performance check) | PASS |
| TC_TIME_40 | Gọi cùng endTime 2 lần liên tiếp → kết quả giống nhau | PASS |

---

## 4. Kết quả Coverage (HTML)

### 4.1 Coverage Metrics

| Metric | Coverage | Mục tiêu | Status |
|--------|----------|----------|--------|
| **Statements** | 100% (32/32) | ≥ 80% | PASS |
| **Branches** | 100% (6/6) | ≥ 70% | PASS |
| **Functions** | 100% (2/2) | ≥ 90% | PASS |
| **Lines** | 100% (32/32) | ≥ 80% | PASS |

### 4.2 Đường dẫn HTML

- `test/STT25/coverage/index.html` — trang tổng quan
- `test/STT25/coverage/formatTime.ts.html` — chi tiết từng dòng

---

## 5. Cấu trúc thư mục liên quan

```
test/STT25/
├── formatTime.test.ts
├── jest.coverage.25.js
├── execution_report.txt
├── coverage_report.txt
├── STT25_RESULT.md
└── coverage/
    ├── index.html
    └── formatTime.ts.html
```

---

## 6. Ghi chú quan trọng (theo kế hoạch)

1. Nhóm boundary (TC_TIME_08 → TC_TIME_14) là trọng yếu cho countdown.
2. `formatDate` phụ thuộc timezone runtime; đã cố định `TZ=Asia/Ho_Chi_Minh` trong test.
3. Invalid date hiện trả `NaN/NaN/aN` — chỉ document behavior hiện tại.

---

**Generated:** 2026-04-19 17:10 UTC+7
**Runner:** Jest 30.3.0 / ts-jest 29.4.9
**Status:** ALL TESTS PASS — 100% COVERAGE
