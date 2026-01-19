# 🎓 E-Learning Frontend

Next.js 14 frontend cho nền tảng học trực tuyến.

---

## 🚀 Chạy ngay (Không cần Backend)

```bash
npm install
# hoặc
yarn install

# Chạy dev server
npm run dev
# hoặc
yarn dev
```

Mở: `http://localhost:3001/login`

**Mock Login (Test UI):**
- Admin: `admin@test.com` / `123456`
- Teacher: `teacher@test.com` / `123456`
- Student: `student@test.com` / `123456`

👉 **Chi tiết:** [TEST_UI_CHEATSHEET.md](./TEST_UI_CHEATSHEET.md)

---

## 📚 Documentation

- **[TEST_UI_CHEATSHEET.md](./TEST_UI_CHEATSHEET.md)** - Quick reference cho UI testing
- **[../UI_TESTING_MODE.md](../UI_TESTING_MODE.md)** - Hướng dẫn đầy đủ Mock Mode
- **[../FRONTEND_IMPROVEMENTS.md](../FRONTEND_IMPROVEMENTS.md)** - API integration & changes

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3.4
- **Forms:** React Hook Form + Yup
- **State:** Zustand 4.5
- **HTTP:** Axios 1.6

---

## 📁 Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, Register
│   ├── (main)/            # Home, Courses
│   ├── student/           # Student pages
│   ├── teacher/           # Teacher pages
│   └── admin/             # Admin pages
├── components/
│   ├── ui/                # Reusable components
│   ├── icons/             # SVG icons
│   └── auth/              # Auth components (OtpInput)
├── apis/                  # API integration
│   ├── auth.ts            # Auth endpoints
│   ├── users.ts           # User management
│   ├── teacher-profiles.ts
│   └── courses.ts
├── @types/                # TypeScript types
├── hooks/                 # Custom hooks
├── store/                 # Zustand stores
├── data/                  # Mock data
└── middleware.ts          # Route protection
```

---

## 🎨 Current Mode: Mock Data

Frontend đang chạy ở **Mock Mode** - test UI không cần backend.

### Chuyển sang Real API:

1. Backend running: `http://localhost:3000`
2. File: `src/app/(auth)/login/_component/LoginForm.tsx`
3. Uncomment:
   ```typescript
   // TODO: Uncomment when backend is ready
   const response = await login({ username: email, password });
   ```
4. Comment phần mock

---

## 📦 Scripts

```bash
npm run dev          # Start dev server (port 3001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

---

## 🔗 Environment Variables

File: `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## 📖 Routes

### Public
- `/` - Home
- `/login` - Login
- `/register` - Register
- `/courses` - Browse courses

### Protected
- `/user/*` - User settings
- `/student/*` - Student dashboard
- `/teacher/*` - Teacher dashboard
- `/admin/*` - Admin panel

---

## 💡 Quick Tips

**Mock login:** Email có "admin" → ADMIN, có "teacher" → TEACHER, khác → STUDENT

**Clear data:**
```javascript
localStorage.clear()
```

**Check user:**
```javascript
console.log(localStorage.getItem('user'))
```

---

**Happy Coding!** 🚀
