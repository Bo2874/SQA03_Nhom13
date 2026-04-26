# 🎓 E-Learning Platform

Nền tảng học trực tuyến với NestJS Backend + Next.js Frontend, hỗ trợ vai trò Admin, Teacher, Student.

---

## 📚 Tài liệu

- **[UI_TESTING_MODE.md](./UI_TESTING_MODE.md)** - 🎨 **Test UI không cần Backend** (Đọc đầu tiên!)
- **[QUICKSTART.md](./QUICKSTART.md)** - ⚡ Chạy Backend + Frontend đầy đủ
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - 🔧 Hướng dẫn chi tiết setup Backend
- **[FRONTEND_IMPROVEMENTS.md](./FRONTEND_IMPROVEMENTS.md)** - 📝 Tổng kết cải tiến Frontend

**👉 Muốn test UI ngay? Đọc UI_TESTING_MODE.md!**
**👉 Muốn chạy full stack? Đọc QUICKSTART.md!**

---

## 🚀 Quick Start

### **Option 1: Test UI Only (Không cần Backend)** 🎨

```bash
cd elearning-frontend
npm install
npm run dev
```

Truy cập: `http://localhost:3001`

**Mock Login:**
- Admin: `admin@test.com` / `123456`
- Teacher: `teacher@test.com` / `123456`
- Student: `student@test.com` / `123456`

👉 **Xem chi tiết:** [UI_TESTING_MODE.md](./UI_TESTING_MODE.md)

---

### **Option 2: Full Stack (Backend + Frontend)** ⚙️

#### 1. Prerequisites
```bash
node -v     # >= 18
mysql --version
redis-server --version
```

#### 2. Setup Database
```bash
brew services start mysql
brew services start redis
mysql -u root -e "CREATE DATABASE elearning;"
```

#### 3. Backend
```bash
cd elearning-backend
cp .env.example .env  # Sửa DATABASE_PASSWORD nếu có
npm install
npm run start:dev
npm run seed:users    # Tạo test accounts
```

#### 4. Frontend
```bash
cd elearning-frontend
npm install
npm run dev
```

**URLs:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1

👉 **Xem chi tiết:** [QUICKSTART.md](./QUICKSTART.md)

---

## 🧑‍💻 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elearning.com | admin123 |
| Teacher | teacher@test.com | teacher123 |
| Student | student@test.com | student123 |

---

## ✅ Features

- ✅ **Authentication:** Login, Register, OTP verification
- ✅ **Role-based Access:** Admin, Teacher, Student
- ✅ **Teacher Verification:** Document upload & approval
- ✅ **Course System:** (Backend ready, Frontend in progress)
- ✅ **Protected Routes:** Middleware-based security

---

## 🛠️ Tech Stack

**Backend:** NestJS, TypeScript, MySQL, TypeORM, Redis, JWT
**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, React Hook Form

---

## 📖 Documentation

Chi tiết xem các file:
- `QUICKSTART.md` - Hướng dẫn chạy
- `BACKEND_SETUP.md` - MySQL, Redis, Email setup
- `FRONTEND_IMPROVEMENTS.md` - API integration, Types, Components

---

**Happy Coding!** 🚀
