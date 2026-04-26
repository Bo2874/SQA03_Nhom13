# 🎯 E-Learning Admin Panel

Admin Panel riêng biệt với React + Ant Design để quản lý duyệt giáo viên, khóa học và bài kiểm tra.

---

## 🚀 Quick Start

```bash
cd elearning-admin

# Install dependencies
npm install

# Run development server
npm run dev
```

**URL:** `http://localhost:3002`

---

## ✨ Tính năng

### 1. **Duyệt Giáo Viên** (`/teachers`)
- Xem danh sách giáo viên chờ duyệt
- Xem chi tiết hồ sơ (CCCD, chứng chỉ)
- **Duyệt** hoặc **Từ chối** với lý do
- Hiển thị trạng thái: Chờ duyệt, Đã duyệt, Từ chối

### 2. **Duyệt Khóa Học** (`/courses`)
- Xem danh sách khóa học chờ duyệt
- Xem chi tiết khóa học (thumbnail, mô tả, số chương/bài)
- **Duyệt** hoặc **Từ chối** với lý do
- Hiển thị thông tin: Giáo viên, môn học, khối lớp

### 3. **Duyệt Bài Kiểm Tra** (`/exams`)
- Xem danh sách bài kiểm tra chờ duyệt
- Xem chi tiết bài kiểm tra (thời gian, số câu hỏi)
- **Duyệt** hoặc **Từ chối** với lý do
- Hiển thị lịch thi và độ dài bài thi

### 4. **Dashboard** (`/`)
- Thống kê tổng quan
- Số lượng chờ duyệt
- Biểu đồ và insights

---

## 📁 Cấu trúc Project

```
elearning-admin/
├── src/
│   ├── layouts/
│   │   └── MainLayout.tsx      # Layout với Sidebar
│   ├── pages/
│   │   ├── Dashboard.tsx       # Trang chủ
│   │   ├── TeacherApproval.tsx # Duyệt giáo viên
│   │   ├── CourseApproval.tsx  # Duyệt khóa học
│   │   └── ExamApproval.tsx    # Duyệt bài kiểm tra
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── data/
│   │   └── mockData.ts         # Mock data
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🎨 UI Components

### Table với các cột:
- ✅ Avatar/Thumbnail
- ✅ Thông tin chi tiết
- ✅ Ngày nộp
- ✅ Trạng thái (Tag với màu)
- ✅ Actions (Xem, Duyệt, Từ chối)

### Modals:
- **Chi tiết:** Hiển thị đầy đủ thông tin + documents/images
- **Từ chối:** TextArea bắt buộc nhập lý do (max 500 ký tự)

### Notifications:
- ✅ Toast success khi duyệt
- ✅ Toast error khi có lỗi
- ✅ Warning khi chưa nhập lý do từ chối

---

## 🔧 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design 5** - UI framework
- **React Router 6** - Routing
- **Day.js** - Date formatting

---

## 📊 Mock Data

Hiện tại dùng mock data trong `src/data/mockData.ts`:

- **3 giáo viên** chờ duyệt
- **4 khóa học** chờ duyệt
- **5 bài kiểm tra** chờ duyệt

### Thay đổi data:
Sửa file `mockData.ts` để test với data khác.

---

## 🎯 Workflow

### Duyệt Giáo Viên:

```
1. Admin vào /teachers
2. Click "Xem" để xem chi tiết hồ sơ
   - CCCD mặt trước/sau
   - Chứng chỉ giáo viên
3. Click "Duyệt" → Status: APPROVED
   HOẶC
   Click "Từ chối" → Nhập lý do → Status: REJECTED
```

### Duyệt Khóa Học:

```
1. Admin vào /courses
2. Click "Xem" để xem chi tiết
   - Thumbnail
   - Mô tả
   - Số chương, số bài học
   - Giáo viên
3. Click "Duyệt" → Status: APPROVED
   HOẶC
   Click "Từ chối" → Nhập lý do → Status: REJECTED
```

### Duyệt Bài Kiểm Tra:

```
1. Admin vào /exams
2. Click "Xem" để xem chi tiết
   - Thời gian thi
   - Độ dài bài thi
   - Số câu hỏi
3. Click "Duyệt" → Status: APPROVED → Sẵn sàng mở thi
   HOẶC
   Click "Từ chối" → Nhập lý do → Status: REJECTED
```

---

## 🔗 API Integration (Tương lai)

Khi backend sẵn sàng, thay mock data bằng API calls:

### Teacher Approval
```typescript
// GET /teacher-profiles/pending
const pendingTeachers = await api.get('/teacher-profiles/pending');

// PUT /teacher-profiles/admin/:id
await api.put(`/teacher-profiles/admin/${id}`, {
  status: 'APPROVED' // or 'REJECTED',
  rejectionReason: '...' // if rejected
});
```

### Course Approval
```typescript
// GET /courses/pending
const pendingCourses = await api.get('/courses/pending');

// PUT /courses/:id
await api.put(`/courses/${id}`, {
  status: 'APPROVED', // or 'REJECTED'
  rejectionReason: '...' // if rejected
});
```

### Exam Approval
```typescript
// GET /exams/pending
const pendingExams = await api.get('/exams/pending');

// PUT /exams/:id
await api.put(`/exams/${id}`, {
  status: 'APPROVED', // or 'REJECTED'
  rejectionReason: '...' // if rejected
});
```

---

## 📝 Status Enums

### Teacher Profile Status:
- `PENDING` - Chờ duyệt
- `APPROVED` - Đã duyệt
- `REJECTED` - Từ chối
- `SUSPENDED` - Đình chỉ

### Course Status:
- `DRAFT` - Nháp
- `PENDING_REVIEW` - Chờ duyệt
- `APPROVED` - Đã duyệt
- `REJECTED` - Từ chối
- `PUBLISHED` - Đã xuất bản

### Exam Status:
- `DRAFT` - Nháp
- `PENDING_REVIEW` - Chờ duyệt
- `APPROVED` - Đã duyệt
- `LIVE` - Đang diễn ra
- `CLOSED` - Đã kết thúc

---

## 🎨 Customization

### Thay đổi theme:
Sửa trong `App.tsx` - Ant Design ConfigProvider:

```typescript
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff', // Màu chính
      borderRadius: 6,
    },
  }}
>
```

### Thay đổi port:
Sửa trong `vite.config.ts`:

```typescript
server: {
  port: 3002, // Đổi port khác
}
```

---

## 🐛 Troubleshooting

### Port đã được sử dụng:
```bash
# Đổi port trong vite.config.ts
# Hoặc kill process:
lsof -i :3002
kill -9 <PID>
```

### Dependencies không cài được:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ TODO

- [x] Teacher Approval UI
- [x] Course Approval UI
- [ ] Exam Approval UI (tương tự Course)
- [ ] Dashboard với statistics
- [ ] Real API integration
- [ ] Unit tests
- [ ] E2E tests
- [ ] Deploy config

---

## 📚 Tham khảo

- **Ant Design:** https://ant.design/components/overview/
- **React Router:** https://reactrouter.com/
- **Vite:** https://vitejs.dev/

---

**🎉 Enjoy coding!**
