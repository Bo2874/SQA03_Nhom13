# API Test — SQA03_Nhom13

Bộ test API cho dự án E-Learning bằng **Postman + Newman**.

---

## Cấu trúc folder

```
api_test/
├── README.md                                       <- file này
├── ss_api_test_13.xlsx                             <- Excel báo cáo (1 sheet)
├── collection/
│   └── SQA03_Nhom13_API_Test.postman_collection.json  <- import vào Postman
├── environment/
│   └── SQA03_Nhom13_LOCAL.postman_environment.json    <- import vào Postman
├── cleanup/
│   ├── cleanup.sql            <- rollback DB
│   ├── seed-otp.cmd           <- seed OTP vào Redis (Windows)
│   ├── seed-otp.sh            <- seed OTP (bash)
│   ├── _build_collection.py   <- script gen collection (không cần chạy lại)
│   └── _build_excel.py        <- script gen Excel (không cần chạy lại)
├── reports/                   <- HTML report do Newman tạo
├── screenshots/               <- ảnh chụp màn hình DB / bug
└── data/                      <- CSV cho data-driven test (sau này)
```

---

## Yêu cầu môi trường

| | Phiên bản | Cách kiểm tra |
|---|---|---|
| Docker Desktop | bất kỳ | `docker --version` |
| Node.js | >=18 | `node --version` |
| Postman Desktop | 10.x+ | mở app |
| Newman + reporter | 6.x | `newman --version` |

Cài Newman nếu chưa có:
```bash
npm install -g newman newman-reporter-htmlextra
```

---

## Quy trình chạy test (TỪ ĐẦU)

### 1. Khởi động hạ tầng

```bash
cd src_test/tool_test/Tool_TestScript_01-09/infra
docker compose up -d
```

Verify: `docker ps` thấy `elearning-mysql` + `elearning-redis` đều `Up (healthy)`.

### 2. Khởi động backend

```bash
cd src_code/elearning-backend
npm install   # chỉ lần đầu
npm run start:dev
```

Đợi đến khi console hiện `Application is running on: http://localhost:3000`.

### 3. Smoke test

```bash
curl http://localhost:3000/api/v1/subjects
# Expected: {"message":"success","result":[...]}
```

### 4. Seed OTP cho happy-path

Postman không đọc Redis được, nên trước mỗi lần Run Collection cần seed OTP với giá trị cố định:

**Windows:**
```cmd
cleanup\seed-otp.cmd
```

**Bash:**
```bash
bash cleanup/seed-otp.sh
```

Output sẽ là:
```
test_api_register_happy@example.com  =>  999991
test_api_reset_happy@example.com     =>  999992  (reset prefix)
```

### 5. Chạy test

**Cách A — Postman GUI:**
1. Mở Postman → `Import` → chọn cả 2 file:
   - `collection/SQA03_Nhom13_API_Test.postman_collection.json`
   - `environment/SQA03_Nhom13_LOCAL.postman_environment.json`
2. Góc phải chọn environment `SQA03_Nhom13_LOCAL`
3. Click vào collection `SQA03_Nhom13_API_Test` → bấm `Run`
4. Bấm `Run SQA03_Nhom13_API_Test` → xem kết quả

**Cách B — Newman CLI (khuyên dùng vì có HTML report):**
```bash
cd src_test/tool_test/api_test
newman run collection/SQA03_Nhom13_API_Test.postman_collection.json \
  -e environment/SQA03_Nhom13_LOCAL.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export reports/api_report.html
```

→ Mở file `reports/api_report.html` để xem report đẹp.

### 6. Cập nhật Excel

Mở `ss_api_test_13.xlsx`, vào vùng 3 (bảng TC chi tiết, từ dòng 22):
- Cột `Actual_Status`, `Actual_Response`: copy từ Newman/Postman runner
- Cột `Result`: chọn `Pass` / `Fail` / `Blocked` (Data Validation đã set sẵn)
- Vùng 2 (bảng Summary) sẽ tự cập nhật bằng công thức `COUNTIFS`
- Nếu `Fail` → mở vùng 4 (Bug List) ở cuối sheet để ghi bug

### 7. Rollback DB

Sau khi chạy xong, dọn test data:

```bash
docker exec -i elearning-mysql mysql -uroot -p1234 elearning < cleanup/cleanup.sql
```

Hoặc mở MySQL Workbench / DBeaver, paste nội dung `cleanup.sql`, execute.

---

## Mapping module ↔ thành viên (gợi ý)

| Module | Số endpoint | TC dự kiến | Người làm |
|---|---:|---:|---|
| API_01 Auth | 6 | 22 đã làm mẫu | (đã có) |
| API_02 Subjects + Grade Levels | 10 | ~40 | |
| API_03 Courses (CRUD) | 8 | ~35 | |
| API_04 Courses (chapters/episodes) | 10 | ~40 | |
| API_05 Courses (materials/quiz Q&A) | 17 | ~50 | |
| API_06 Enrollments | 8 | ~35 | |
| API_07 Exams + Attempts | 18 | ~60 | |
| API_08 Quiz Attempts | 9 | ~35 | |
| API_09 Users / Zoom / Chatbot | 15 | ~40 | |

---

## Cách thêm module mới (ví dụ API_02)

1. Mở Postman → click chuột phải vào collection → `Add Folder` → tên `02_Subjects`
2. Tạo các request bên trong, đặt tên `API_02_001`, `API_02_002`...
3. Mỗi request:
   - Tab **Body**: nhập JSON body
   - Tab **Tests**: viết script (xem mẫu trong folder `01_Register`)
4. Save collection → Export lại đè lên file `SQA03_Nhom13_API_Test.postman_collection.json`
5. Mở `ss_api_test_13.xlsx`, thêm các dòng mới vào vùng 3 với `Module = API_02 Subjects + Grade Levels`
6. Pattern test script:
   ```javascript
   pm.test("Status 200", function () {
       pm.response.to.have.status(200);
   });
   var j = pm.response.json();
   pm.test("Có message", function () {
       pm.expect(j.message).to.exist;
   });
   // Lưu id để rollback
   pm.environment.set("createdSubjectId", j.result.id);
   ```

---

## Bug đã tìm được

| Bug_ID | TC_ID | Mô tả |
|---|---|---|
| BUG_001 | API_01_015 | request-otp trả 500 thay vì 400 khi email sai format |
| BUG_002 | API_01_016 | request-otp trả 500 thay vì 400 khi body rỗng |

**Đề xuất fix:** thêm `@IsEmail()` validation cho DTO của request-otp (`src/modules/auth/dto/request-otp.dto.ts`).

---

## Troubleshooting

**Container không up:** `docker compose down -v` rồi `docker compose up -d` lại.

**`newman: command not found`:** mở terminal mới (PATH chưa refresh), hoặc dùng full path `"C:\Users\<user>\AppData\Roaming\npm\newman.cmd"`.

**Test API_01_001 fail "Email already exists":** chạy `cleanup.sql` rồi `seed-otp.cmd`, rồi run lại.

**Test API_01_017 (reset password) fail 404:** user `test_api_reset_happy@example.com` chưa tồn tại trong DB. Chạy API_01_001 trước hoặc seed user thủ công.

**Cookie không tự lưu trong Postman:** vào `Settings` → bật `Automatically follow redirects` và `Send cookies`. Postman 10+ mặc định đã bật.
