# 🎨 UI Testing Cheat Sheet

## ⚡ Super Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:3001/login`

---

## 🔑 Mock Login (Bất kỳ password nào cũng được!)

| Role | Email | Redirect |
|------|-------|----------|
| **Admin** | admin@test.com | `/admin` |
| **Teacher** | teacher@test.com | `/teacher/dashboard` |
| **Student** | student@test.com | `/` (home) |

**Password:** Bất kỳ (>= 6 ký tự), ví dụ: `123456`

---

## 📍 Routes để test

### Public Routes
- `/` - Home page
- `/login` - Login form
- `/register` - Register form
- `/courses` - Browse courses
- `/courses/[id]` - Course detail

### Student Routes (Login với student@test.com)
- `/student/my-courses` - My enrolled courses
- `/student/courses/[id]` - Learning page
- `/student/courses/[id]/lessons/[lessonId]` - Video player
- `/student/search` - Search courses
- `/user/my-account` - Profile

### Teacher Routes (Login với teacher@test.com)
- `/teacher/dashboard` - Dashboard home
- `/teacher/dashboard/courses` - My courses
- `/teacher/dashboard/courses/[id]` - Course detail
- `/teacher/dashboard/exams` - My exams
- `/teacher/verify` - Verification page
- `/user/my-account` - Profile

### Admin Routes (Login với admin@test.com)
- `/admin` - Admin dashboard (nếu có)
- `/user/my-account` - Profile

---

## 🧪 Test Scenarios

### 1. Login Flow
```
1. Vào /login
2. Email: admin@test.com
3. Password: 123456
4. Click "Đăng nhập"
✅ Toast: "Đăng nhập thành công! (Mock Mode)"
✅ Redirect: /admin
```

### 2. Register Flow
```
1. Vào /register
2. Điền form
3. Chọn role: Student/Teacher
4. Click "Đăng ký"
✅ Toast success
✅ Redirect: /login
```

### 3. Protected Routes
```
1. Chưa login
2. Vào /user/my-account
✅ Auto redirect: /login?redirect=/user/my-account
```

### 4. Role-based Pages
```
1. Login as Student
2. Vào /teacher/dashboard
✅ Show access denied hoặc redirect
```

---

## 🗂️ Mock Data Location

```
src/data/
├── courses.ts              # Course listings
├── courses-teacher.ts      # Teacher's courses
├── chapters-episodes.ts    # Course content
├── quizzes.ts             # Quiz data
└── exams.ts               # Exam data
```

**Sửa data ở đây để test UI với data khác!**

---

## 🔧 Quick Commands

### Clear localStorage (Reset login)
```javascript
// Browser Console (F12)
localStorage.clear()
location.reload()
```

### Check current user
```javascript
// Browser Console
console.log(JSON.parse(localStorage.getItem('user')))
```

### Change user role
```javascript
// Browser Console
const user = JSON.parse(localStorage.getItem('user'))
user.role = 'ADMIN'  // hoặc 'TEACHER', 'STUDENT'
localStorage.setItem('user', JSON.stringify(user))
location.reload()
```

---

## 🎯 UI Components to Test

### Forms
- [ ] Login form
- [ ] Register form
- [ ] Profile edit form
- [ ] Course creation form
- [ ] Chapter/Episode forms
- [ ] Quiz builder

### Buttons
- [ ] Primary buttons
- [ ] Secondary buttons
- [ ] Disabled states
- [ ] Loading states

### Inputs
- [ ] Text inputs
- [ ] Password inputs (show/hide)
- [ ] Number inputs
- [ ] Textareas
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Dropdowns/Selects

### Modals
- [ ] Create course modal
- [ ] Edit chapter modal
- [ ] Delete confirmation modal

### Tables
- [ ] Course listing table
- [ ] Student table (admin)
- [ ] Exam results table

### Cards
- [ ] Course cards
- [ ] Video cards
- [ ] Blog cards

### Navigation
- [ ] Header menu
- [ ] Footer links
- [ ] Breadcrumbs
- [ ] Pagination
- [ ] Tabs

---

## 📱 Responsive Testing

### Breakpoints
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

### Chrome DevTools
```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Select device or custom size
```

---

## 🐛 Common Issues

### "Redirect loop"
→ Clear localStorage: `localStorage.clear()`

### "Cannot read property of undefined"
→ Check if user data in localStorage: `localStorage.getItem('user')`

### "Page not found"
→ Check route exists in `src/app/`

### "Middleware blocking page"
→ Check `src/middleware.ts` matcher config

---

## 💡 Pro Tips

1. **Test với email khác nhau:**
   - `admin123@test.com` → ADMIN
   - `teacher456@test.com` → TEACHER
   - `john@example.com` → STUDENT

2. **Mock data trong console:**
   ```javascript
   // Set custom user
   localStorage.setItem('user', JSON.stringify({
     id: 999,
     email: 'custom@test.com',
     full_name: 'Custom User',
     role: 'ADMIN'
   }))
   ```

3. **Test forms nhanh:**
   - Form validation: Bỏ trống → Check error messages
   - Submit loading: Click submit → Check loading state
   - Success/Error: Check toast notifications

4. **Responsive testing:**
   - Mobile menu hamburger
   - Touch gestures (swipe)
   - Orientation (portrait/landscape)

---

## ✅ Checklist

- [ ] npm install thành công
- [ ] npm run dev chạy không lỗi
- [ ] Mở http://localhost:3001
- [ ] Login form hiển thị đúng
- [ ] Mock login với admin/teacher/student
- [ ] Redirect đúng theo role
- [ ] Protected routes hoạt động
- [ ] Logout xóa localStorage
- [ ] Responsive trên mobile
- [ ] Forms validation works
- [ ] Modals open/close
- [ ] Navigation links work

---

**Khi backend sẵn sàng:**

1. Đọc `FRONTEND_IMPROVEMENTS.md`
2. Uncomment real API code trong `LoginForm.tsx`
3. Test với backend thật

---

**Happy Testing!** 🚀
