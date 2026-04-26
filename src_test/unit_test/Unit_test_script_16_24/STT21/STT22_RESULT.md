# STT 22 — Báo Cáo Test Chi Tiết

## 📋 Thông Tin Chung

| Trường | Giá trị |
|--------|--------|
| **STT** | 22 |
| **Module** | APIs Profile |
| **File nguồn** | `elearning-frontend/src/apis/profile.ts` |
| **File test** | `test/STT22/profile.api.test.ts` |
| **Config coverage** | `test/STT22/jest.coverage.22.js` |
| **Tổng số TC** | 39 |
| **Ngày chạy** | 2026-04-19 |

---

## ✅ Kết Quả Execution

### 1.1 Test Summary

```
Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        1.176 s (execution), 4.554 s (coverage)
Status:      ✅ ALL PASS
```

### 1.2 Danh Sách Test Cases (39 TC)

#### Nhóm A — getUser (3 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_01 | GET users/profile | ✅ PASS |
| TC_PROFILE_API_02 | Response profile shape preserve | ✅ PASS |
| TC_PROFILE_API_03 | 401 khi chưa login → propagate | ✅ PASS |

#### Nhóm B — updateUserInfo (4 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_04 | PUT users/profile với body IUserData | ✅ PASS |
| TC_PROFILE_API_05 | Body nguyên vẹn 4 field | ✅ PASS |
| TC_PROFILE_API_06 | Input không bị mutate | ✅ PASS |
| TC_PROFILE_API_07 | 400 validation (email sai format) propagate | ✅ PASS |

#### Nhóm C — uploadImage (10 TC)

**C.1 FormData construction:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_08 | POST /images/upload với FormData | ✅ PASS |
| TC_PROFILE_API_09 | FormData chứa field "image" với đúng file | ✅ PASS |
| TC_PROFILE_API_10 | Field name là "image" (khớp backend) | ✅ PASS |
| TC_PROFILE_API_11 | FormData không thừa field (chỉ "image") | ✅ PASS |

**C.2 Headers:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_12 | Header Content-Type === "multipart/form-data" | ✅ PASS |
| TC_PROFILE_API_13 | Config object chỉ có `headers` key | ✅ PASS |

**C.3 File types & error:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_14 | File PNG vẫn upload (wrapper không validate type) | ✅ PASS |
| TC_PROFILE_API_15 | File lớn (5MB) — wrapper KHÔNG check size | ✅ PASS |
| TC_PROFILE_API_16 | Network error propagate | ✅ PASS |
| TC_PROFILE_API_17 | BE 413 Payload Too Large propagate | ✅ PASS |

#### Nhóm D — Address CRUD (13 TC)

**getAddresses:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_18 | GET users/address | ✅ PASS |
| TC_PROFILE_API_19 | Response array preserve | ✅ PASS |

**getAddress:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_20 | GET users/address/:index | ✅ PASS |
| TC_PROFILE_API_21 | index=5 đúng URL | ✅ PASS |
| TC_PROFILE_API_22 | 404 khi index vượt range | ✅ PASS |

**createAddress:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_23 | POST users/address với body IAddressProps | ✅ PASS |
| TC_PROFILE_API_24 | Body giữ đủ 8 field | ✅ PASS |
| TC_PROFILE_API_25 | Field primary:true giữ type boolean | ✅ PASS |
| TC_PROFILE_API_26 | Input không bị mutate | ✅ PASS |

**editAddress:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_27 | PUT users/address/:index với body | ✅ PASS |
| TC_PROFILE_API_28 | Body partial — chỉ field thay đổi | ✅ PASS |

**deleteAddress:**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_29 | DELETE users/address/:index | ✅ PASS |
| TC_PROFILE_API_30 | 404 khi index invalid | ✅ PASS |

#### Nhóm E — changePassword (7 TC - CRITICAL)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_31 | POST users/change-password với body 2 field | ✅ PASS |
| TC_PROFILE_API_32 | **SECURITY**: Password nằm trong BODY, không trong URL | ✅ PASS |
| TC_PROFILE_API_33 | oldPassword + newPassword giữ nguyên type string | ✅ PASS |
| TC_PROFILE_API_34 | Body không leak field khác | ✅ PASS |
| TC_PROFILE_API_35 | 401 (oldPassword sai) → propagate | ✅ PASS |
| TC_PROFILE_API_36 | 400 (newPassword không đạt policy) → propagate | ✅ PASS |
| TC_PROFILE_API_37 | Input không mutate | ✅ PASS |

#### Nhóm F — ERROR & BEHAVIORAL CONTRACT (2 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_38 | Tất cả function propagate 500 | ✅ PASS |
| TC_PROFILE_API_39 | Tất cả function propagate network error | ✅ PASS |

---

## 📊 Code Coverage

### 2.1 Coverage Metrics

| Metric | Coverage | Mục tiêu | Status |
|--------|----------|----------|--------|
| **Statements** | 100% (65/65) | ≥ 80% | ✅ PASS |
| **Branches** | 100% (9/9) | ≥ 70% | ✅ PASS |
| **Functions** | 100% (9/9) | ≥ 90% | ✅ PASS |
| **Lines** | 100% (65/65) | ≥ 80% | ✅ PASS |

### 2.2 Coverage Chi Tiết theo Function

| Function | Statements | Branches | Lines | Status |
|----------|-----------|----------|-------|--------|
| `getUser` | 100% | 100% | 100% | ✅ PASS |
| `updateUserInfo` | 100% | 100% | 100% | ✅ PASS |
| `uploadImage` | 100% | 100% | 100% | ✅ PASS |
| `getAddresses` | 100% | 100% | 100% | ✅ PASS |
| `getAddress` | 100% | 100% | 100% | ✅ PASS |
| `createAddress` | 100% | 100% | 100% | ✅ PASS |
| `editAddress` | 100% | 100% | 100% | ✅ PASS |
| `deleteAddress` | 100% | 100% | 100% | ✅ PASS |
| `changePassword` | 100% | 100% | 100% | ✅ PASS |

### 2.3 Coverage Chi Tiết theo Nhóm Test

| Nhóm | Test Cases | Functions Tested | Coverage % | Status |
|------|-----------|------------------|-----------|--------|
| **Nhóm A — getUser** | 3 | getUser | 100% | ✅ PASS |
| **Nhóm B — updateUserInfo** | 4 | updateUserInfo | 100% | ✅ PASS |
| **Nhóm C — uploadImage** | 10 | uploadImage | 100% | ✅ PASS |
| **Nhóm D — Address CRUD** | 13 | getAddresses, getAddress, createAddress, editAddress, deleteAddress | 100% | ✅ PASS |
| **Nhóm E — changePassword** | 7 | changePassword | 100% | ✅ PASS |
| **Nhóm F — ERROR & BEHAVIORAL** | 2 | Tất cả functions | 100% | ✅ PASS |

---

## 🏗️ Cấu Trúc Thư Mục

```
test/STT22/
├── profile.api.test.ts           ← File test (39 TC)
├── jest.coverage.22.js           ← Config coverage
├── execution_report.txt          ← Output từ npm run test:22
├── coverage_report.txt           ← Output từ npm run coverage:22
└── coverage/                     ← HTML coverage report (sinh tự động)
    ├── index.html                ← Trang tổng quan
    ├── elearning-frontend/
    │   └── src/
    │       └── apis/
    │           └── profile.ts.html ← Chi tiết từng dòng
    └── lcov.info                 ← Dữ liệu thô cho CI/CD
```

---

## 🚀 Cách Chạy Test

### 3.1 Chạy toàn bộ test STT22

```bash
cd test
npm run test:22
```

**Hoặc với verbose:**

```bash
npx jest STT22/ --verbose --no-coverage
```

### 3.2 Chạy coverage STT22

```bash
npm run coverage:22
```

**Hoặc manual:**

```bash
npx jest STT22/ --config STT22/jest.coverage.22.js --coverageDirectory=STT22/coverage
```

### 3.3 Mở HTML coverage report

**Cách 1 — HTTP server (khuyến nghị):**

```bash
npm run serve:22
# Mở browser: http://localhost:8000/index.html
```

**Cách 2 — Mở trực tiếp:**

```bash
# Windows
start test/STT22/coverage/index.html
```

---

## 📝 Chi Tiết Chạy Test

### 4.1 Execution Report Text

```
PASS STT22/profile.api.test.ts
  Nhóm A — getUser
    ✓ TC_PROFILE_API_01: GET users/profile (2 ms)
    ✓ TC_PROFILE_API_02: Response profile shape preserve
    ✓ TC_PROFILE_API_03: 401 khi chưa login → propagate (11 ms)
  Nhóm B — updateUserInfo
    ✓ TC_PROFILE_API_04: PUT users/profile với body IUserData (1 ms)
    ✓ TC_PROFILE_API_05: Body nguyên vẹn 4 field
    ✓ TC_PROFILE_API_06: Input không bị mutate (1 ms)
    ✓ TC_PROFILE_API_07: 400 validation (email sai format) propagate
  Nhóm C — uploadImage
    ✓ TC_PROFILE_API_08: POST /images/upload với FormData (1 ms)
    ✓ TC_PROFILE_API_09: FormData chứa field "image" với đúng file (1 ms)
    ✓ TC_PROFILE_API_10: Field name là "image" (khớp backend)
    ✓ TC_PROFILE_API_11: FormData không thừa field (chỉ "image") (1 ms)
    ✓ TC_PROFILE_API_12: Header Content-Type === "multipart/form-data"
    ✓ TC_PROFILE_API_13: Config object chỉ có `headers` key
    ✓ TC_PROFILE_API_14: File PNG vẫn upload (wrapper không validate type)
    ✓ TC_PROFILE_API_15: File lớn (5MB) — wrapper KHÔNG check size (2 ms)
    ✓ TC_PROFILE_API_16: Network error propagate (1 ms)
    ✓ TC_PROFILE_API_17: BE 413 Payload Too Large propagate (3 ms)
  Nhóm D — Address CRUD
    ✓ TC_PROFILE_API_18: GET users/address
    ✓ TC_PROFILE_API_19: Response array preserve
    ✓ TC_PROFILE_API_20: GET users/address/:index (1 ms)
    ✓ TC_PROFILE_API_21: index=5 đúng URL
    ✓ TC_PROFILE_API_22: 404 khi index vượt range
    ✓ TC_PROFILE_API_23: POST users/address với body IAddressProps (1 ms)
    ✓ TC_PROFILE_API_24: Body giữ đủ 8 field
    ✓ TC_PROFILE_API_25: Field primary:true giữ type boolean
    ✓ TC_PROFILE_API_26: Input không bị mutate
    ✓ TC_PROFILE_API_27: PUT users/address/:index với body (1 ms)
    ✓ TC_PROFILE_API_28: Body partial — chỉ field thay đổi
    ✓ TC_PROFILE_API_29: DELETE users/address/:index
    ✓ TC_PROFILE_API_30: 404 khi index invalid (1 ms)
  Nhóm E — changePassword
    ✓ TC_PROFILE_API_31: POST users/change-password với body 2 field
    ✓ TC_PROFILE_API_32: SECURITY: Password nằm trong BODY, không trong URL (1 ms)
    ✓ TC_PROFILE_API_33: oldPassword + newPassword giữ nguyên type string
    ✓ TC_PROFILE_API_34: Body không leak field khác
    ✓ TC_PROFILE_API_35: 401 (oldPassword sai) → propagate (1 ms)
    ✓ TC_PROFILE_API_36: 400 (newPassword không đạt policy) → propagate
    ✓ TC_PROFILE_API_37: Input không mutate
  Nhóm F — ERROR & BEHAVIORAL CONTRACT
    ✓ TC_PROFILE_API_38: Tất cả function propagate 500
    ✓ TC_PROFILE_API_39: Tất cả function propagate network error

Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        1.176 s
```

### 4.2 Coverage Report Terminal

```
------------|---------|----------|---------|---------|-------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------|---------|----------|---------|---------|-------------------
All files   |     100 |      100 |     100 |     100 |                   
 profile.ts |     100 |      100 |     100 |     100 |                   
------------|---------|----------|---------|---------|-------------------

Coverage summary:
  Statements   : 100% ( 65/65 )
  Branches     : 100% ( 9/9 )
  Functions    : 100% ( 9/9 )
  Lines        : 100% ( 65/65 )
```

---

## ✨ Highlights

### 5.1 Test Coverage

- ✅ **100% Function Coverage** — Tất cả 9 functions được test
- ✅ **100% Statement Coverage** — Mọi dòng code được thực thi
- ✅ **100% Branch Coverage** — Tất cả nhánh điều kiện được test
- ✅ **39 Test Cases** — Bao quát tất cả scenarios

### 5.2 Test Scenarios Covered

#### Nhóm A — getUser (3 TC)
- ✅ GET endpoint
- ✅ Response shape preservation
- ✅ 401 error propagation

#### Nhóm B — updateUserInfo (4 TC)
- ✅ PUT endpoint với IUserData
- ✅ Body field preservation (4 fields)
- ✅ Input immutability
- ✅ 400 validation error

#### Nhóm C — uploadImage (10 TC) - **CRITICAL**
- ✅ FormData construction (POST /images/upload)
- ✅ Field name "image" validation
- ✅ No extra fields in FormData
- ✅ Header Content-Type multipart/form-data
- ✅ File type passthrough (PNG, JPEG)
- ✅ Large file handling (5MB)
- ✅ Network error propagation
- ✅ 413 Payload Too Large error

#### Nhóm D — Address CRUD (13 TC)
- ✅ getAddresses: GET endpoint + array preservation
- ✅ getAddress: GET with index + URL construction
- ✅ createAddress: POST with 8-field IAddressProps
- ✅ editAddress: PUT with partial update
- ✅ deleteAddress: DELETE endpoint
- ✅ 404 error handling
- ✅ Input immutability
- ✅ Boolean field type preservation

#### Nhóm E — changePassword (7 TC) - **SECURITY-CRITICAL**
- ✅ POST endpoint
- ✅ **Security**: Password in BODY not URL
- ✅ Type preservation (both strings)
- ✅ No field leakage
- ✅ 401 error (wrong oldPassword)
- ✅ 400 error (weak newPassword)
- ✅ Input immutability

#### Nhóm F — Error & Behavioral (2 TC)
- ✅ 500 error propagation
- ✅ Network error propagation

---

## 🔐 Security Notes

### TC_PROFILE_API_32 — Password Security
- ✅ Password fields (`oldPassword`, `newPassword`) are sent in request BODY
- ✅ NOT exposed in URL or query parameters
- ✅ Prevents password leakage in server logs
- ✅ Request body is encrypted by HTTPS

### Multipart/FormData (TC_PROFILE_API_12, TC_PROFILE_API_13)
- ⚠️ **Note**: Code hardcodes `Content-Type: "multipart/form-data"` header
- This may prevent axios from auto-setting boundary
- Recommend discussion with team: either remove header to let browser/axios set, or ensure backend correctly parses

---

## 📦 Fixtures & Setup

### 6.1 Mock Configuration

```typescript
jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
```

### 6.2 Helper Functions

```typescript
const createMockFile = (name='a.jpg', type='image/jpeg', sizeKB=100): File => {
  const blob = new Blob([new Uint8Array(sizeKB*1024)], { type });
  return new File([blob], name, { type });
};
```

### 6.3 Clear Mocks Between Tests

```typescript
beforeEach(() => jest.clearAllMocks());
```

---

## 📚 Files Reference

| File | Dòng | Nội dung |
|------|------|---------|
| `profile.ts` | 21-23 | `updateUserInfo` function |
| `profile.ts` | 25-34 | `uploadImage` function (multipart) |
| `profile.ts` | 36-38 | `getAddresses` function |
| `profile.ts` | 40-42 | `getUser` function |
| `profile.ts` | 44-46 | `getAddress` function |
| `profile.ts` | 48-50 | `createAddress` function |
| `profile.ts` | 52-54 | `editAddress` function |
| `profile.ts` | 56-58 | `deleteAddress` function |
| `profile.ts` | 60-65 | `changePassword` function (security-critical) |
| `profile.api.test.ts` | 1-65 | Nhóm A — getUser (3 TC) |
| `profile.api.test.ts` | 66-160 | Nhóm B — updateUserInfo (4 TC) |
| `profile.api.test.ts` | 161-340 | Nhóm C — uploadImage (10 TC) |
| `profile.api.test.ts` | 341-470 | Nhóm D — Address CRUD (13 TC) |
| `profile.api.test.ts` | 471-540 | Nhóm E — changePassword (7 TC) |
| `profile.api.test.ts` | 541-550 | Nhóm F — Error & Behavioral (2 TC) |

---

## 🎯 Checklist Hoàn Thành

```
✅ Đọc xong file .claude/STT22_apis_profile.md
✅ Tạo test/STT22/ và file profile.api.test.ts
✅ Tất cả 39 TC trong kế hoạch đã được implement (ID khớp)
✅ npm run test:22 → 39 PASS / 0 FAILED
✅ npm run coverage:22 → HTML report sinh ra trong STT22/coverage/
✅ Coverage: 100% Statements, 100% Branches, 100% Functions, 100% Lines
✅ jest.coverage.22.js được cấu hình đúng với rootDir = project root
✅ Không có uncovered lines (mục tiêu threshold đạt)
✅ Tất cả 9 functions được test (getUser, updateUserInfo, uploadImage, getAddresses, getAddress, createAddress, editAddress, deleteAddress, changePassword)
✅ Security-critical tests: TC_PROFILE_API_32 (password in body), TC_PROFILE_API_12, TC_PROFILE_API_13 (multipart headers)
```

---

**Generated:** 2026-04-19 11:28 UTC+7  
**Runner:** Jest 30.3.0 / ts-jest 29.4.9  
**Status:** ✅ **ALL TESTS PASS - 100% COVERAGE**
