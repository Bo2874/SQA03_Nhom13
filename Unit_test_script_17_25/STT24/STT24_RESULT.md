# STT 24 — Báo cáo kết quả kiểm thử: `utils/toast.ts`

**File nguồn:** `elearning-frontend/src/utils/toast.ts`
**File test:** `test/STT24/toast.test.ts`
**Ngày chạy:** 2026-04-19
**Runner:** Jest 30 / ts-jest 29 / Node.js v24

---

## Tổng quan

| Hạng mục | Kết quả |
|----------|---------|
| Tổng số TC | 26 |
| TC Pass | **26** |
| TC Fail | **0** |
| Thời gian | ~1.2 s |
| Coverage Statements | **100%** (52/52) |
| Coverage Branches | **100%** (4/4) |
| Coverage Functions | **100%** (4/4) |
| Coverage Lines | **100%** (52/52) |

---

## Cấu trúc nhóm test

| Nhóm | Mô tả | Số TC |
|------|-------|-------|
| A | Type routing — đảm bảo đúng loại toast được gọi | 5 |
| B | Message passthrough — message truyền nguyên văn | 5 |
| C | Options/Config — kiểm tra từng option chi tiết | 13 |
| D | Behavioral contract — tính nhất quán khi gọi | 3 |

---

## Cách chạy

### 0. Chuẩn bị môi trường (1 lần)

```bash
cd test
npm install
```

### 1. Chạy test thường (verbose)

```bash
cd test
npm run test:24
```

**Output mẫu:**

```
PASS STT24/toast.test.ts
  Nhóm A — Type routing (critical — tránh copy-paste bug)
    √ TC_TOAST_01: successToast gọi đúng toast.success (2 ms)
    √ TC_TOAST_02: errorToast gọi đúng toast.error
    √ TC_TOAST_03: infoToast gọi trực tiếp toast() (không phải .info) (1 ms)
    √ TC_TOAST_04: warningToast gọi trực tiếp toast() (1 ms)
    √ TC_TOAST_05: Gọi successToast KHÔNG kích hoạt toast.error (regression guard) (1 ms)
  Nhóm B — Message passthrough
    √ TC_TOAST_06: Message truyền nguyên văn
    √ TC_TOAST_07: Empty string vẫn gọi toast với ""
    √ TC_TOAST_08: Message rất dài (1000 ký tự) passthrough không truncate
    √ TC_TOAST_09: Message chứa HTML/script passthrough không escape
    √ TC_TOAST_10: Message Unicode tiếng Việt có dấu passthrough
  Nhóm C — Options/Config
    √ TC_TOAST_11: successToast — duration === 2500 (3 ms)
    √ TC_TOAST_12: successToast — position === "top-right" (1 ms)
    √ TC_TOAST_13: successToast — style.background === "#333" và color === "#fff"
    √ TC_TOAST_14: successToast — style.borderRadius "8px" và padding "12px 20px"
    √ TC_TOAST_15: successToast — iconTheme.primary === "#10b981"
    √ TC_TOAST_16: successToast — iconTheme.secondary === "#fff"
    √ TC_TOAST_17: errorToast — iconTheme.primary === "#ef4444" (red)
    √ TC_TOAST_18: errorToast — options base giống successToast (duration, position, style core)
    √ TC_TOAST_19: infoToast — icon === "ℹ️"
    √ TC_TOAST_20: infoToast — không set iconTheme (chỉ icon) (1 ms)
    √ TC_TOAST_21: warningToast — icon === "⚠️"
    √ TC_TOAST_22: warningToast — style.background override thành "#f59e0b"
    √ TC_TOAST_23: warningToast — các style khác (color, borderRadius) vẫn giữ từ base
  Nhóm D — Behavioral contract
    √ TC_TOAST_24: successToast return undefined (void)
    √ TC_TOAST_25: Gọi 10 lần liên tiếp — mỗi lần 1 call đến thư viện
    √ TC_TOAST_26: 4 wrapper không tự throw nếu message là undefined/null

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        1.203 s
```

### 2. Chạy coverage + sinh HTML

```bash
cd test
npm run coverage:24
```

**Output terminal:**

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 toast.ts |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 52/52 )
Branches     : 100% ( 4/4 )
Functions    : 100% ( 4/4 )
Lines        : 100% ( 52/52 )
================================================================================
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        4.88 s
✅ Injected group summary into: ...test/STT24/coverage/index.html
```

### 3. Mở HTML Coverage Report

```bash
cd test
npm run serve:24
# Mở trình duyệt: http://localhost:8000/index.html
```

Hoặc mở trực tiếp file:

```
test/STT24/coverage/index.html
```

---

## Kết quả chi tiết từng TC

| ID | Nhóm | Tiêu đề | Kết quả |
|----|------|---------|---------|
| TC_TOAST_01 | A | successToast gọi đúng toast.success | PASS |
| TC_TOAST_02 | A | errorToast gọi đúng toast.error | PASS |
| TC_TOAST_03 | A | infoToast gọi trực tiếp toast() (không phải .info) | PASS |
| TC_TOAST_04 | A | warningToast gọi trực tiếp toast() | PASS |
| TC_TOAST_05 | A | Gọi successToast KHÔNG kích hoạt toast.error (regression guard) | PASS |
| TC_TOAST_06 | B | Message truyền nguyên văn | PASS |
| TC_TOAST_07 | B | Empty string vẫn gọi toast với "" | PASS |
| TC_TOAST_08 | B | Message rất dài (1000 ký tự) passthrough không truncate | PASS |
| TC_TOAST_09 | B | Message chứa HTML/script passthrough không escape | PASS |
| TC_TOAST_10 | B | Message Unicode tiếng Việt có dấu passthrough | PASS |
| TC_TOAST_11 | C | successToast — duration === 2500 | PASS |
| TC_TOAST_12 | C | successToast — position === "top-right" | PASS |
| TC_TOAST_13 | C | successToast — style.background === "#333" và color === "#fff" | PASS |
| TC_TOAST_14 | C | successToast — style.borderRadius "8px" và padding "12px 20px" | PASS |
| TC_TOAST_15 | C | successToast — iconTheme.primary === "#10b981" | PASS |
| TC_TOAST_16 | C | successToast — iconTheme.secondary === "#fff" | PASS |
| TC_TOAST_17 | C | errorToast — iconTheme.primary === "#ef4444" (red) | PASS |
| TC_TOAST_18 | C | errorToast — options base giống successToast | PASS |
| TC_TOAST_19 | C | infoToast — icon === "ℹ️" | PASS |
| TC_TOAST_20 | C | infoToast — không set iconTheme (chỉ icon) | PASS |
| TC_TOAST_21 | C | warningToast — icon === "⚠️" | PASS |
| TC_TOAST_22 | C | warningToast — style.background override thành "#f59e0b" | PASS |
| TC_TOAST_23 | C | warningToast — các style khác (color, borderRadius) vẫn giữ từ base | PASS |
| TC_TOAST_24 | D | successToast return undefined (void) | PASS |
| TC_TOAST_25 | D | Gọi 10 lần liên tiếp — mỗi lần 1 call đến thư viện | PASS |
| TC_TOAST_26 | D | 4 wrapper không tự throw nếu message là undefined/null | PASS |

---

## Coverage Report HTML

Sau khi chạy `npm run coverage:24`, thư mục `test/STT24/coverage/` gồm:

```
test/STT24/coverage/
├── index.html          ← trang tổng quan (4 chỉ số + bảng nhóm A/B/C/D)
├── lcov.info           ← dữ liệu thô cho CI
├── toast.ts.html       ← chi tiết từng dòng (tô màu xanh = covered)
└── ...
```

**Trang index.html hiển thị:**
- 4 thanh progress: Statements 100%, Branches 100%, Functions 100%, Lines 100%
- Bảng file: `toast.ts` — tất cả 100%
- Bảng Test Groups: Nhóm A (5 TC), B (5 TC), C (13 TC), D (3 TC) — tổng 26 TC

**Trang chi tiết `toast.ts.html`:**
- Toàn bộ code tô màu xanh (covered)
- Số lần thực thi hiển thị bên trái mỗi dòng

---

## Lưu ý kỹ thuật

### Vấn đề dual-instance của react-hot-toast

`react-hot-toast` có hai instance trong project:
- `elearning-frontend/node_modules/react-hot-toast` — dùng bởi `toast.ts`
- `test/node_modules/react-hot-toast` — cài để hỗ trợ TypeScript types

Nếu dùng `jest.mock('react-hot-toast', factory)` thông thường, mock chỉ áp dụng cho instance
trong `test/node_modules`, trong khi `toast.ts` dùng instance từ `elearning-frontend/node_modules`.
Kết quả: `mock.calls` luôn = 0 dù test không throw.

**Giải pháp:** Thêm vào `jest.config.js` và `jest.coverage.24.js`:

```js
moduleNameMapper: {
  '^react-hot-toast$': '<rootDir>/__mocks__/react-hot-toast.js',
}
```

File `test/__mocks__/react-hot-toast.js` dùng `jest.fn()` và được resolve bởi CẢ hai file
(test file và toast.ts), đảm bảo cùng một instance → mock hoạt động đúng.

---

## Cấu trúc thư mục sau khi hoàn thành

```
test/STT24/
├── toast.test.ts           ← 26 TC (4 nhóm A/B/C/D)
├── jest.coverage.24.js     ← config coverage riêng (rootDir + coverageDirectory tuyệt đối)
├── execution_report.txt    ← output verbose đầy đủ
├── STT24_RESULT.md         ← file này
└── coverage/               ← sinh tự động
    ├── index.html          ← trang tổng quan (4 chỉ số 100%)
    ├── toast.ts.html       ← chi tiết từng dòng
    └── lcov.info
```

---

## Checklist

- [x] Đọc xong `.claude/STT24_utils_toast.md`
- [x] Tạo `test/STT24/` và file test `toast.test.ts`
- [x] Tất cả 26 TC trong kế hoạch đã được implement (ID TC_TOAST_01..26 khớp)
- [x] `npm run test:24` → 26 passed, 0 failed
- [x] `npm run coverage:24` → HTML report sinh ra trong `STT24/coverage/`
- [x] Coverage: Statements 100% / Branches 100% / Funcs 100% / Lines 100%
- [x] `execution_report.txt` đã lưu (có dòng "Tests: 26 passed")
- [x] HTML overview có 4 chỉ số: Stmts / Branch / Funcs / Lines
- [x] HTML có bảng Test Groups (A/B/C/D) và số Test Cases đúng
- [x] HTML detail (toast.ts.html) thấy code tô màu xanh + số lần gọi
