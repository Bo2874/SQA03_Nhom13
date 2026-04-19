# STT 22 — Báo Cáo Test Chi Tiết (Profile API)

## 1. Thông tin chung

| Trường | Giá trị |
|--------|---------|
| **STT** | 22 |
| **Module** | APIs Profile |
| **File nguồn** | `elearning-frontend/src/apis/profile.ts` |
| **File test** | `test/STT22/profile.api.test.ts` |
| **Config coverage** | `test/STT22/jest.coverage.22.js` |
| **Tổng số TC** | 39 |
| **Ngày chạy** | 2026-04-19 |

---

## 2. Cách chạy test + sinh HTML

```bash
cd test

# Chạy test STT22
npm run test:22

# Chạy coverage + sinh HTML + inject bảng nhóm
npm run coverage:22

# Mở HTML coverage (HTTP server)
npm run serve:22
# Mở trình duyệt: http://localhost:8000/index.html
```

Mở trực tiếp file HTML (có thể bị trắng trang trên một số máy):

```bash
start test/STT22/coverage/index.html
```

---

## 3. Kết quả Execution (Jest)

```
Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        1.176 s
Status:      ALL PASS
```

### 3.1 Danh sách Test Cases (39 TC)

#### Nhóm A — getUser (3 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_01 | GET users/profile | PASS |
| TC_PROFILE_API_02 | Response profile shape preserve | PASS |
| TC_PROFILE_API_03 | 401 khi chưa login → propagate | PASS |

#### Nhóm B — updateUserInfo (4 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_04 | PUT users/profile với body IUserData | PASS |
| TC_PROFILE_API_05 | Body nguyên vẹn 4 field | PASS |
| TC_PROFILE_API_06 | Input không bị mutate | PASS |
| TC_PROFILE_API_07 | 400 validation (email sai format) propagate | PASS |

#### Nhóm C — uploadImage (10 TC)

**C.1 FormData construction**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_08 | POST /images/upload với FormData | PASS |
| TC_PROFILE_API_09 | FormData chứa field "image" với đúng file | PASS |
| TC_PROFILE_API_10 | Field name là "image" (khớp backend) | PASS |
| TC_PROFILE_API_11 | FormData không thừa field (chỉ "image") | PASS |

**C.2 Headers**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_12 | Header Content-Type === "multipart/form-data" | PASS |
| TC_PROFILE_API_13 | Config object chỉ có `headers` key | PASS |

**C.3 File types & error**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_14 | File PNG vẫn upload (wrapper không validate type) | PASS |
| TC_PROFILE_API_15 | File lớn (5MB) — wrapper KHÔNG check size | PASS |
| TC_PROFILE_API_16 | Network error propagate | PASS |
| TC_PROFILE_API_17 | BE 413 Payload Too Large propagate | PASS |

#### Nhóm D — Address CRUD (13 TC)

**getAddresses**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_18 | GET users/address | PASS |
| TC_PROFILE_API_19 | Response array preserve | PASS |

**getAddress**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_20 | GET users/address/:index | PASS |
| TC_PROFILE_API_21 | index=5 đúng URL | PASS |
| TC_PROFILE_API_22 | 404 khi index vượt range | PASS |

**createAddress**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_23 | POST users/address với body IAddressProps | PASS |
| TC_PROFILE_API_24 | Body giữ đủ 8 field | PASS |
| TC_PROFILE_API_25 | Field primary:true giữ type boolean | PASS |
| TC_PROFILE_API_26 | Input không bị mutate | PASS |

**editAddress**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_27 | PUT users/address/:index với body | PASS |
| TC_PROFILE_API_28 | Body partial — chỉ field thay đổi | PASS |

**deleteAddress**

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_29 | DELETE users/address/:index | PASS |
| TC_PROFILE_API_30 | 404 khi index invalid | PASS |

#### Nhóm E — changePassword (7 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_31 | POST users/change-password với body 2 field | PASS |
| TC_PROFILE_API_32 | SECURITY: Password nằm trong BODY, không trong URL | PASS |
| TC_PROFILE_API_33 | oldPassword + newPassword giữ nguyên type string | PASS |
| TC_PROFILE_API_34 | Body không leak field khác | PASS |
| TC_PROFILE_API_35 | 401 (oldPassword sai) → propagate | PASS |
| TC_PROFILE_API_36 | 400 (newPassword không đạt policy) → propagate | PASS |
| TC_PROFILE_API_37 | Input không mutate | PASS |

#### Nhóm F — ERROR & BEHAVIORAL CONTRACT (2 TC)

| ID | Tiêu đề | Trạng thái |
|-----|---------|-----------|
| TC_PROFILE_API_38 | Tất cả function propagate 500 | PASS |
| TC_PROFILE_API_39 | Tất cả function propagate network error | PASS |

---

## 4. Kết quả Coverage (HTML)

### 4.1 Coverage Metrics

| Metric | Coverage | Mục tiêu | Status |
|--------|----------|----------|--------|
| **Statements** | 100% (65/65) | ≥ 80% | PASS |
| **Branches** | 100% (9/9) | ≥ 70% | PASS |
| **Functions** | 100% (9/9) | ≥ 90% | PASS |
| **Lines** | 100% (65/65) | ≥ 80% | PASS |

### 4.2 Đường dẫn HTML

- `test/STT22/coverage/index.html` — trang tổng quan
- `test/STT22/coverage/elearning-frontend/src/apis/profile.ts.html` — chi tiết từng dòng

---

## 5. Cấu trúc thư mục liên quan

```
test/STT22/
├── profile.api.test.ts
├── jest.coverage.22.js
├── execution_report.txt
├── coverage_report.txt
├── STT22_RESULT.md
└── coverage/
    ├── index.html
    └── elearning-frontend/src/apis/profile.ts.html
```

---

## 6. Ghi chú quan trọng (theo kế hoạch)

1. `uploadImage` hardcode `Content-Type: multipart/form-data` — có thể ảnh hưởng boundary của axios.
2. `changePassword` bắt buộc gửi mật khẩu trong body, không nằm ở URL (security-critical).
3. Field name `image` là contract với backend (không đổi sang `file`/`avatar`).

---

**Generated:** 2026-04-19 11:28 UTC+7
**Runner:** Jest 30.3.0 / ts-jest 29.4.9
**Status:** ALL TESTS PASS — 100% COVERAGE
