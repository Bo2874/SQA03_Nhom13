# Kế hoạch chuẩn hóa HTML Coverage theo mẫu STT23

## 1) Mục tiêu

Chuẩn hóa toàn bộ giao diện `coverage/index.html` của các STT về đúng layout mặc định giống `test/STT23/coverage/index.html` (All files + bảng File/Statements/Branches/Functions/Lines), không dùng layout custom `custom-report`.

---

## 2) Baseline chuẩn

- **Mẫu chuẩn:** `test/STT23/coverage/index.html`
- **Dấu hiệu đúng chuẩn:**
  - Có `<div class='wrapper'>`
  - Có `<table class="coverage-summary">` mặc định Istanbul
  - Không có marker `GROUP_SUMMARY_START`
  - Không có CSS ẩn `.wrapper, .footer { display: none !important; }`

---

## 3) Hiện trạng (theo kiểm tra nhanh)

### Đang bị custom layout (cần sửa)
- STT17, STT18, STT19, STT21, STT24, STT25, STT26

### Đang giống chuẩn hoặc gần chuẩn
- STT20, STT23

### Chưa có `coverage/index.html` để đánh giá trực tiếp
- STT22, STT27

---

## 4) Cách sửa thống nhất

1. **Ngừng inject custom layout** cho các STT cần chuẩn hóa:
   - Tạm thời bỏ `&& node inject-group-summary.js {N}` khỏi script `coverage:{N}` trong `test/package.json`.
2. Chạy lại coverage để tái sinh HTML mặc định:
   - `npm run coverage:{N}`
3. Verify file HTML:
   - Không còn `GROUP_SUMMARY_START`
   - Giao diện khớp STT23 (wrapper mặc định + bảng coverage chuẩn)
4. Với STT22, STT27 (chưa có HTML):
   - Tạo test/coverage trước, sau đó verify theo tiêu chí chuẩn.

---

## 5) Kế hoạch gom theo đợt (mỗi đợt ~3 STT)

## Đợt 1 (3 STT)
- STT17
- STT18
- STT19

### Việc làm
- Sửa script `coverage:17`, `coverage:18`, `coverage:19` bỏ bước `inject-group-summary`.
- Chạy lại 3 lệnh coverage.
- Kiểm tra UI từng `index.html` so với STT23.

---

## Đợt 2 (3 STT)
- STT21
- STT24
- STT25

### Việc làm
- Sửa script `coverage:21` (nếu có), `coverage:24`, `coverage:25` bỏ bước `inject-group-summary`.
- Chạy lại coverage từng STT.
- Verify giao diện mặc định Istanbul giống STT23.

---

## Đợt 3 (3 STT)
- STT26
- STT22
- STT27

### Việc làm
- STT26: bỏ inject + regenerate coverage.
- STT22, STT27: đảm bảo có test và jest coverage config; chạy coverage để sinh `coverage/index.html` theo chuẩn mặc định.
- Verify đồng nhất giao diện theo STT23.

---

## 6) Danh sách lệnh đề xuất khi thực thi

```bash
cd test

# Đợt 1
npm run coverage:17
npm run coverage:18
npm run coverage:19

# Đợt 2
npm run coverage:21
npm run coverage:24
npm run coverage:25

# Đợt 3
npm run coverage:26
npm run coverage:22
npm run coverage:27
```

Ghi chú: trước khi chạy các lệnh trên, cần sửa `package.json` để các script coverage không gọi `inject-group-summary.js`.

---

## 7) Tiêu chí nghiệm thu cuối

- 100% STT mục tiêu có `test/STT{N}/coverage/index.html` mở được qua `serve-coverage.js`.
- Tất cả các HTML coverage có giao diện mặc định giống STT23.
- Không còn marker `GROUP_SUMMARY_START` trong các file `coverage/index.html` đã chuẩn hóa.
- Không phá vỡ kết quả test/coverage hiện có của từng STT.
