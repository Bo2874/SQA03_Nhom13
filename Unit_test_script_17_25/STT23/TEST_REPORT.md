# STT 23 — Test Report: `utils/cloudinary.ts`

**File nguồn:** `elearning-frontend/src/utils/cloudinary.ts`
**File test:** `test/STT23/cloudinary.test.ts`
**Ngày chạy:** 2026-04-19 17:01
**Runner:** Jest 29.7.0 / ts-jest 29.1.0

---

## 1. Cách chạy

### Bước 0 — Chuẩn bị (chỉ 1 lần)

```bash
cd test
npm install
```

### Bước 1 — Chạy test (không coverage)

```bash
cd test
npx jest --config STT23/jest.config.23.js --verbose --no-coverage
```

### Bước 2 — Chạy coverage + sinh HTML

```bash
cd test
npx jest --config STT23/jest.coverage.23.js --coverageDirectory=STT23/coverage
```

### Bước 3 — Mở HTML report

```bash
# Windows
start test/STT23/coverage/index.html

# Hoặc serve qua HTTP (tránh trắng trang)
node test/serve-coverage.js 8000 23
# Mở: http://localhost:8000/index.html
```

---

## 2. Kết quả Execution Report

### Tổng quan

| Metric | Kết quả |
|--------|---------|
| Test Suites | 1 passed, 1 total |
| Tests | **94 passed, 0 failed**, 94 total |
| Thời gian | 2.036 s |

### Chi tiết từng Test Case

#### Nhóm A — isValidImageFile (10 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_01 | image/jpeg → true | ✅ PASS |
| TC_CLOUDI_02 | image/jpg → true (alias) | ✅ PASS |
| TC_CLOUDI_03 | image/png → true | ✅ PASS |
| TC_CLOUDI_04 | image/gif → true | ✅ PASS |
| TC_CLOUDI_05 | image/webp → true | ✅ PASS |
| TC_CLOUDI_06 | image/svg+xml → false | ✅ PASS |
| TC_CLOUDI_07 | application/pdf → false | ✅ PASS |
| TC_CLOUDI_08 | video/mp4 → false | ✅ PASS |
| TC_CLOUDI_09 | type rỗng "" → false | ✅ PASS |
| TC_CLOUDI_10 | Uppercase "IMAGE/JPEG" → true (File API normalizes MIME to lowercase) | ✅ PASS |

#### Nhóm B — isValidVideoFile (7 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_11 | video/mp4 → true | ✅ PASS |
| TC_CLOUDI_12 | video/webm → true | ✅ PASS |
| TC_CLOUDI_13 | video/ogg → true | ✅ PASS |
| TC_CLOUDI_14 | video/quicktime (.mov) → true | ✅ PASS |
| TC_CLOUDI_15 | video/x-matroska (.mkv) → false | ✅ PASS |
| TC_CLOUDI_16 | image/jpeg → false | ✅ PASS |
| TC_CLOUDI_17 | application/pdf → false | ✅ PASS |

#### Nhóm C — isValidDocumentFile (10 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_18 | application/msword (.doc) → true | ✅ PASS |
| TC_CLOUDI_19 | .docx → true | ✅ PASS |
| TC_CLOUDI_20 | .ppt → true | ✅ PASS |
| TC_CLOUDI_21 | .pptx → true | ✅ PASS |
| TC_CLOUDI_22 | .xls → true | ✅ PASS |
| TC_CLOUDI_23 | .xlsx → true | ✅ PASS |
| TC_CLOUDI_24 | text/plain → true | ✅ PASS |
| TC_CLOUDI_25 | application/pdf → false (PDF đã bị comment out) | ✅ PASS |
| TC_CLOUDI_26 | application/x-msdownload (.exe) → false | ✅ PASS |
| TC_CLOUDI_27 | image/jpeg → false | ✅ PASS |

#### Nhóm D — isValidFileSize — BOUNDARY CRITICAL (7 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_28 | size === limit → true (code dùng `<=`) | ✅ PASS |
| TC_CLOUDI_29 | size = limit+1 byte → false | ✅ PASS |
| TC_CLOUDI_30 | size = limit-1 byte → true | ✅ PASS |
| TC_CLOUDI_31 | size=0 (empty file) → true | ✅ PASS |
| TC_CLOUDI_32 | maxSizeMB=0, size=1KB → false | ✅ PASS |
| TC_CLOUDI_33 | maxSizeMB=0, size=0 → true (0<=0) | ✅ PASS |
| TC_CLOUDI_34 | maxSizeMB âm → false | ✅ PASS |

#### Nhóm E — isYouTubeUrl (10 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_35 | https://www.youtube.com/watch?v=... → true | ✅ PASS |
| TC_CLOUDI_36 | https://youtube.com/watch?v=x (no www) → true | ✅ PASS |
| TC_CLOUDI_37 | https://youtu.be/... → true | ✅ PASS |
| TC_CLOUDI_38 | http://... (HTTP) → true | ✅ PASS |
| TC_CLOUDI_39 | www.youtube.com/... (no protocol) → true | ✅ PASS |
| TC_CLOUDI_40 | https://vimeo.com/123 → false | ✅ PASS |
| TC_CLOUDI_41 | https://fake-youtube.com/... → false | ✅ PASS |
| TC_CLOUDI_42 | URL rỗng "" → false | ✅ PASS |
| TC_CLOUDI_43 | Non-URL "hello world" → false | ✅ PASS |
| TC_CLOUDI_44 | https://m.youtube.com/... (mobile) → false | ✅ PASS |

#### Nhóm F — extractYouTubeId (7 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_45 | watch?v= URL → "dQw4w9WgXcQ" | ✅ PASS |
| TC_CLOUDI_46 | youtu.be short URL → "dQw4w9WgXcQ" | ✅ PASS |
| TC_CLOUDI_47 | embed URL → "dQw4w9WgXcQ" | ✅ PASS |
| TC_CLOUDI_48 | URL có thêm param &t=30s → chỉ lấy 11 ký tự ID | ✅ PASS |
| TC_CLOUDI_49 | ID không đủ 11 ký tự → null | ✅ PASS |
| TC_CLOUDI_50 | URL không phải YouTube → null | ✅ PASS |
| TC_CLOUDI_51 | URL rỗng "" → null | ✅ PASS |

#### Nhóm G — formatFileSize (9 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_52 | 0 → "0 Bytes" | ✅ PASS |
| TC_CLOUDI_53 | 500 → "500 Bytes" | ✅ PASS |
| TC_CLOUDI_54 | 1024 → "1 KB" | ✅ PASS |
| TC_CLOUDI_55 | 1536 → "1.5 KB" | ✅ PASS |
| TC_CLOUDI_56 | 1048576 → "1 MB" | ✅ PASS |
| TC_CLOUDI_57 | 1073741824 → "1 GB" | ✅ PASS |
| TC_CLOUDI_58 | 1500 → "1.46 KB" (round 2 decimals) | ✅ PASS |
| TC_CLOUDI_59 | số âm → NaN behavior (document) | ✅ PASS |
| TC_CLOUDI_60 | 1e15 → "undefined" (index out of bounds — bug tiềm tàng) | ✅ PASS |

#### Nhóm H — getFileExtension (7 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_61 | "doc.pdf" → "pdf" | ✅ PASS |
| TC_CLOUDI_62 | "archive.tar.gz" → "gz" | ✅ PASS |
| TC_CLOUDI_63 | "no-extension" → "" | ✅ PASS |
| TC_CLOUDI_64 | ".hidden" → "" (unix hidden file) | ✅ PASS |
| TC_CLOUDI_65 | "" → "" | ✅ PASS |
| TC_CLOUDI_66 | "DOC.PDF" → "PDF" (không lowercase) | ✅ PASS |
| TC_CLOUDI_67 | "file." (trailing dot) → "" | ✅ PASS |

#### Nhóm I — getFileIcon (13 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_68 | "a.doc" → "📝" | ✅ PASS |
| TC_CLOUDI_69 | "a.docx" → "📝" | ✅ PASS |
| TC_CLOUDI_70 | "a.ppt" → "📊" | ✅ PASS |
| TC_CLOUDI_70b | "a.pptx" → "📊" | ✅ PASS |
| TC_CLOUDI_71 | "a.xls" → "📈" | ✅ PASS |
| TC_CLOUDI_71b | "a.xlsx" → "📈" | ✅ PASS |
| TC_CLOUDI_72 | "a.txt" → "📃" | ✅ PASS |
| TC_CLOUDI_73 | "a.zip" → "📦" | ✅ PASS |
| TC_CLOUDI_73b | "a.rar" → "📦" | ✅ PASS |
| TC_CLOUDI_74 | "a.pdf" → "📁" (PDF removed) | ✅ PASS |
| TC_CLOUDI_75 | "a.DOCX" → "📝" (toLowerCase) | ✅ PASS |
| TC_CLOUDI_76 | "a.xyz" unknown → "📁" | ✅ PASS |
| TC_CLOUDI_77 | "file" no extension → "📁" | ✅ PASS |

#### Nhóm J — uploadImageToCloudinary (8 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_78 | xhr.open gọi URL chứa "/image/upload" | ✅ PASS |
| TC_CLOUDI_79 | FormData chứa file + upload_preset + folder | ✅ PASS |
| TC_CLOUDI_80 | onProgress callback gọi với percentage 0→100 | ✅ PASS |
| TC_CLOUDI_81 | status 200 → resolve với parsed response | ✅ PASS |
| TC_CLOUDI_82 | status 500 → reject "Upload failed with status: 500" | ✅ PASS |
| TC_CLOUDI_83 | xhr error event → reject "Network error during upload" | ✅ PASS |
| TC_CLOUDI_84 | không truyền onProgress → upload.addEventListener không được gọi | ✅ PASS |
| TC_CLOUDI_85 | env có giá trị → không throw | ✅ PASS |

#### Nhóm K — uploadVideoToCloudinary (3 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_86 | xhr.open gọi URL chứa "/video/upload" | ✅ PASS |
| TC_CLOUDI_87 | FormData có resource_type="video" + folder="elearning/videos" | ✅ PASS |
| TC_CLOUDI_88 | thiếu env cloudName/uploadPreset → throw | ✅ PASS |

#### Nhóm L — uploadFileToCloudinary (3 TC)

| ID | Tiêu đề | Kết quả |
|----|---------|---------|
| TC_CLOUDI_89 | xhr.open gọi URL chứa "/auto/upload" | ✅ PASS |
| TC_CLOUDI_90 | FormData có resource_type="auto" + folder="elearning/materials" | ✅ PASS |
| TC_CLOUDI_91 | upload docx thành công → resolve với secure_url | ✅ PASS |

---

## 3. Coverage Report

### Terminal output

```
---------------|---------|----------|---------|---------|-------------------------------------------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------|---------|----------|---------|---------|-------------------------------------------------------
All files      |   88.65 |    88.67 |     100 |   88.65 |
 cloudinary.ts |   88.65 |    88.67 |     100 |   88.65 | 33-34,104-114,121-122,126,200-201,214-224,231-232,236
---------------|---------|----------|---------|---------|-------------------------------------------------------

=============================== Coverage summary ===============================
Statements   : 88.65% ( 250/282 )
Branches     : 88.67% ( 47/53 )
Functions    : 100%   ( 12/12 )
Lines        : 88.65% ( 250/282 )
================================================================================
```

### Kết quả so với ngưỡng

| Chỉ số | Kết quả | Ngưỡng | Trạng thái |
|--------|---------|--------|-----------|
| Statements | **88.65%** | ≥ 80% | ✅ ĐẠT |
| Branches | **88.67%** | ≥ 70% | ✅ ĐẠT |
| Functions | **100%** | ≥ 90% | ✅ ĐẠT |
| Lines | **88.65%** | ≥ 80% | ✅ ĐẠT |

### Dòng chưa được cover

| Dòng | Lý do |
|------|-------|
| 33-34 | Nhánh `if (!cloudName \|\| !uploadPreset)` trong `uploadImageToCloudinary` — không thể trigger vì có hardcoded fallback |
| 104-114 | Nhánh `onProgress` khi `!event.lengthComputable` trong `uploadVideoToCloudinary` |
| 121-122 | Nhánh `xhr.status !== 200` trong `uploadVideoToCloudinary` |
| 126 | Nhánh `xhr error` trong `uploadVideoToCloudinary` |
| 200-201 | Nhánh `if (!cloudName \|\| !uploadPreset)` trong `uploadFileToCloudinary` — hardcoded fallback |
| 214-224 | Nhánh `onProgress` khi `!event.lengthComputable` trong `uploadFileToCloudinary` |
| 231-232 | Nhánh `xhr.status !== 200` trong `uploadFileToCloudinary` |
| 236 | Nhánh `xhr error` trong `uploadFileToCloudinary` |

---

## 4. HTML Coverage Report

HTML report được sinh tự động tại: `test/STT23/coverage/index.html`

### Cấu trúc thư mục coverage

```
test/STT23/coverage/
├── index.html                          ← Trang tổng quan (mở cái này)
├── lcov.info                           ← Dữ liệu thô cho CI
├── elearning-frontend/
│   └── src/
│       └── utils/
│           └── cloudinary.ts.html      ← Chi tiết từng dòng
└── ...
```

### Cách mở HTML

```bash
# Mở trực tiếp (Windows)
start test/STT23/coverage/index.html

# Hoặc serve qua HTTP (ổn định hơn)
node test/serve-coverage.js 8000 23
# Truy cập: http://localhost:8000/index.html
```

### Giao diện HTML — Trang tổng quan (index.html)

```
┌─────────────────────────────────────────────────────────────────┐
│  All files                                                      │
│                                                                 │
│  Statements  88.65%  ████████████████████░░░  250/282          │
│  Branches    88.67%  ████████████████████░░░   47/53           │
│  Functions   100%    █████████████████████████  12/12          │
│  Lines       88.65%  ████████████████████░░░  250/282          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ File            Stmts  Branch  Funcs  Lines  Uncovered │    │
│  │ utils/                                                 │    │
│  │   cloudinary.ts 88.65  88.67   100    88.65  33-34,... │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Giao diện HTML — Trang chi tiết (cloudinary.ts.html)

```
  Màu xanh  = dòng được test (covered)     → phần lớn file
  Màu đỏ    = dòng chưa được test          → dòng 33-34, 104-114, ...
  Màu vàng  = nhánh chỉ test một phần      → các if/else có 1 nhánh chưa cover

  Cột bên trái = số lần dòng được thực thi
```

---

## 5. Bảng tổng hợp nhóm test

| Nhóm | Tên | Số TC | Kết quả |
|------|-----|-------|---------|
| A | isValidImageFile | 10 | ✅ 10/10 PASS |
| B | isValidVideoFile | 7 | ✅ 7/7 PASS |
| C | isValidDocumentFile | 10 | ✅ 10/10 PASS |
| D | isValidFileSize | 7 | ✅ 7/7 PASS |
| E | isYouTubeUrl | 10 | ✅ 10/10 PASS |
| F | extractYouTubeId | 7 | ✅ 7/7 PASS |
| G | formatFileSize | 9 | ✅ 9/9 PASS |
| H | getFileExtension | 7 | ✅ 7/7 PASS |
| I | getFileIcon | 13 | ✅ 13/13 PASS |
| J | uploadImageToCloudinary | 8 | ✅ 8/8 PASS |
| K | uploadVideoToCloudinary | 3 | ✅ 3/3 PASS |
| L | uploadFileToCloudinary | 3 | ✅ 3/3 PASS |
| **Tổng** | | **94** | **✅ 94/94 PASS** |

---

## 6. Ghi chú kỹ thuật

### TC_CLOUDI_10 — MIME normalization
File API trong Node.js (jsdom/Node) normalize MIME type về lowercase khi tạo `File` object. Do đó `new File([...], 'a.jpg', { type: 'IMAGE/JPEG' })` → `file.type === 'image/jpeg'` → `isValidImageFile` trả `true`. Đây là hành vi của runtime, không phải lỗi source code.

### TC_CLOUDI_25 — PDF bị comment out
`application/pdf` đã bị xóa khỏi whitelist `isValidDocumentFile`. Test này ghim hành vi để tránh ai đó bật lại mà không review.

### TC_CLOUDI_59 — formatFileSize với số âm
`Math.log(-1) = NaN` → `i = NaN` → `sizes[NaN] = undefined` → output chứa `"NaN"`. Đây là edge case chưa được guard trong source.

### TC_CLOUDI_60 — formatFileSize với 1e15
`Math.floor(Math.log(1e15) / Math.log(1024)) = 5` nhưng `sizes` chỉ có index 0-3 → `sizes[5] = undefined` → output `"909.49 undefined"`. Bug tiềm tàng khi file > 1TB.

### TC_CLOUDI_85 — uploadImageToCloudinary với env
`uploadImageToCloudinary` có hardcoded fallback `|| "dyhzdbw0z"` và `|| "elearning"` nên không thể trigger `throw` bằng cách xóa env. Test được điều chỉnh để verify rằng khi env có giá trị, function hoạt động bình thường.

---

## 7. Checklist

- [x] Đọc xong file `.claude/STT23_utils_cloudinary.md`
- [x] Tạo `test/STT23/` và file test
- [x] Tất cả TC trong kế hoạch đã được implement (ID khớp)
- [x] `npx jest --config STT23/jest.config.23.js` → **0 failed**
- [x] `npx jest --config STT23/jest.coverage.23.js` → HTML report sinh ra trong `STT23/coverage/`
- [x] HTML overview rõ 4 chỉ số: Stmts / Branch / Funcs / Lines
- [x] Tất cả thresholds đạt (Stmts ≥ 80%, Branch ≥ 70%, Funcs ≥ 90%, Lines ≥ 80%)
