# ⚡ Quick Start - E-Learning Admin Panel

## 🚀 Chạy ngay

```bash
cd elearning-admin

# Install
npm install

# Run
npm run dev
```

Mở: `http://localhost:3002`

---

## 📍 Navigation

- **Dashboard** (`/`) - Tổng quan, thống kê
- **Duyệt Giáo Viên** (`/teachers`) - 3 hồ sơ chờ duyệt
- **Duyệt Khóa Học** (`/courses`) - 4 khóa học chờ duyệt
- **Duyệt Bài Kiểm Tra** (`/exams`) - 5 bài thi chờ duyệt

---

## ✨ Tính năng chính

### 1. Duyệt Giáo Viên
```
1. Vào /teachers
2. Click "Xem" → Xem CCCD + chứng chỉ
3. Click "Duyệt" → Status: APPROVED ✅
   HOẶC
   Click "Từ chối" → Nhập lý do (bắt buộc) → Status: REJECTED ❌
```

### 2. Duyệt Khóa Học
```
1. Vào /courses
2. Click "Xem" → Xem chi tiết khóa học
3. Click "Duyệt" → Khóa học được phê duyệt ✅
   HOẶC
   Click "Từ chối" → Nhập lý do (bắt buộc) → Từ chối ❌
```

### 3. Duyệt Bài Kiểm Tra
```
1. Vào /exams
2. Click "Xem" → Xem thông tin bài thi
3. Click "Duyệt" → Bài thi sẵn sàng mở ✅
   HOẶC
   Click "Từ chối" → Nhập lý do (bắt buộc) → Từ chối ❌
```

---

## 🎨 UI Features

✅ **Sidebar Navigation** với badge count
✅ **Table** với search, filter, pagination
✅ **Modal** xem chi tiết đầy đủ
✅ **Image Preview** cho documents
✅ **Reject Modal** bắt buộc nhập lý do
✅ **Toast Notifications** success/error
✅ **Loading States** khi submit
✅ **Responsive** mobile-friendly

---

## 📊 Mock Data

- `src/data/mockData.ts` - Chứa tất cả mock data
- Có thể sửa để test với data khác
- Status tự động update sau khi duyệt/từ chối

---

## 🔧 Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool siêu nhanh
- **Ant Design 5** - UI components đẹp
- **React Router 6** - Routing
- **Day.js** - Date formatting

---

## 📝 Scripts

```bash
npm run dev      # Development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Lint code
```

---

## 💡 Tips

### Thay đổi port:
```typescript
// vite.config.ts
server: {
  port: 3003, // Đổi port khác
}
```

### Thay đổi theme:
```typescript
// src/App.tsx - ConfigProvider
theme={{
  token: {
    colorPrimary: '#52c41a', // Màu xanh lá
  },
}}
```

### Clear console warnings:
```bash
# Nếu có warning về dependencies
npm install --legacy-peer-deps
```

---

## 🐛 Troubleshooting

### Port bị chiếm:
```bash
lsof -i :3002
kill -9 <PID>
```

### npm install lỗi:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Vite không start:
```bash
# Check Node version (cần >= 16)
node -v

# Nếu < 16, upgrade Node
```

---

## ✅ Checklist Test

- [ ] npm install thành công
- [ ] npm run dev chạy không lỗi
- [ ] Mở http://localhost:3002
- [ ] Dashboard hiển thị statistics
- [ ] Sidebar navigation hoạt động
- [ ] Teacher approval table có 3 rows
- [ ] Course approval table có 4 rows
- [ ] Exam approval table có 5 rows
- [ ] Click "Xem" mở modal chi tiết
- [ ] Click "Duyệt" update status → Success toast
- [ ] Click "Từ chối" mở reject modal
- [ ] Reject modal bắt buộc nhập lý do
- [ ] Submit reject → Status updated → Success toast

---

## 🔗 API Integration (Sau này)

Khi backend sẵn sàng, chỉ cần thay mock data bằng API calls:

```typescript
// Before (Mock)
const [data, setData] = useState(mockTeacherProfiles);

// After (Real API)
useEffect(() => {
  fetch('http://localhost:3000/api/v1/teacher-profiles/pending')
    .then(res => res.json())
    .then(data => setData(data.result));
}, []);
```

---

**🎉 Done! Giờ có thể test UI duyệt giáo viên, khóa học và bài kiểm tra!**
