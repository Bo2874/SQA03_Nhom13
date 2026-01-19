# 🔓 Mock Mode Guide - Test UI Without Backend

Hướng dẫn chi tiết để test toàn bộ UI/UX của E-Learning Frontend mà **KHÔNG CẦN backend** và **KHÔNG CẦN đăng nhập**.

---

## 🎯 Tổng Quan

**Mock Mode** đã được kích hoạt để cho phép bạn:
- ✅ Truy cập tất cả các trang mà không cần đăng nhập
- ✅ Tự động login với mock user data
- ✅ Bypass tất cả authentication checks
- ✅ Test UI/UX của Student, Teacher, và Admin pages
- ✅ Không cần chạy backend API

---

## ⚙️ Cấu Hình Mock Mode

Mock Mode được bật thông qua 3 files chính:

### 1. **Middleware** (`src/middleware.ts`)
```typescript
// ⚠️ MOCK MODE: Set to true to bypass authentication
const MOCK_MODE = true;  // 👈 Đã set = true

export function middleware(request: NextRequest) {
  // 🔓 Skip all authentication checks
  if (MOCK_MODE) {
    return NextResponse.next();
  }
  // ... authentication logic (bị skip khi MOCK_MODE = true)
}
```

**Chức năng:**
- Tắt redirect đến `/login` khi truy cập protected routes
- Cho phép truy cập tự do vào tất cả routes: `/user`, `/student`, `/teacher`, `/admin`

### 2. **Auth Store** (`src/store/useAuthStore.ts`)
```typescript
// ⚠️ MOCK MODE: Set to true to use mock authentication
const MOCK_MODE = true;  // 👈 Đã set = true

const MOCK_TOKENS = {
  token: "mock-access-token-for-testing",
  refreshToken: "mock-refresh-token-for-testing",
};

const initialState = MOCK_MODE ? MOCK_TOKENS : {
  token: "",
  refreshToken: "",
};
```

**Chức năng:**
- Tự động set mock tokens khi app khởi động
- Các API calls sẽ gửi mock token trong Authorization header
- Zustand persist sẽ lưu mock tokens vào localStorage

### 3. **App Store** (`src/store/useAppStore.ts`)
```typescript
// ⚠️ MOCK MODE: Set to true to use mock user data
const MOCK_MODE = true;  // 👈 Đã set = true

const MOCK_USER = {
  _id: "mock-user-id-123",
  email: "teacher@test.com",  // 👈 Đổi email để test roles khác
  phone: "0901234567",
  status: "ACTIVE",
  firstName: "Mock",
  lastName: "User",
};
```

**Chức năng:**
- Tự động set mock user profile khi app khởi động
- User info sẽ hiển thị trên navbar, dashboard, profile page
- Email được dùng để detect role (student/teacher/admin)

---

## 🎭 Test Với Các Roles Khác Nhau

Để test UI của các roles khác nhau, chỉ cần **đổi email** trong `MOCK_USER`:

### 🎓 Test Student Role
```typescript
// src/store/useAppStore.ts
const MOCK_USER = {
  _id: "mock-user-id-123",
  email: "student@test.com",  // 👈 Chứa "student"
  phone: "0901234567",
  status: "ACTIVE",
  firstName: "Student",
  lastName: "Mock",
};
```

**Sau đó:**
1. Clear localStorage: `localStorage.clear()` trong Console
2. Refresh page
3. Vào `/student/*` routes để test student features

### 👨‍🏫 Test Teacher Role
```typescript
// src/store/useAppStore.ts
const MOCK_USER = {
  _id: "mock-user-id-123",
  email: "teacher@test.com",  // 👈 Chứa "teacher"
  phone: "0901234567",
  status: "ACTIVE",
  firstName: "Teacher",
  lastName: "Mock",
};
```

**Sau đó:**
1. Clear localStorage
2. Refresh page
3. Vào `/teacher/*` routes để test teacher features

### 👑 Test Admin Role
```typescript
// src/store/useAppStore.ts
const MOCK_USER = {
  _id: "mock-user-id-123",
  email: "admin@test.com",  // 👈 Chứa "admin"
  phone: "0901234567",
  status: "ACTIVE",
  firstName: "Admin",
  lastName: "Mock",
};
```

**Sau đó:**
1. Clear localStorage
2. Refresh page
3. Vào `/admin/*` routes để test admin features

---

## 🚀 Quick Start

### 1. Khởi động Development Server
```bash
cd elearning-frontend
npm run dev
```

App sẽ chạy tại: `http://localhost:3000`

### 2. Truy Cập Các Routes

**Public Routes** (không cần auth):
- `http://localhost:3000` - Homepage
- `http://localhost:3000/login` - Login page (có thể vào nhưng không cần login)
- `http://localhost:3000/register` - Register page

**Student Routes** (bây giờ có thể vào tự do):
- `http://localhost:3000/student/dashboard` - Student dashboard
- `http://localhost:3000/student/courses` - Student courses
- `http://localhost:3000/student/exams` - Student exams
- `http://localhost:3000/student/profile` - Student profile

**Teacher Routes** (bây giờ có thể vào tự do):
- `http://localhost:3000/teacher/dashboard` - Teacher dashboard
- `http://localhost:3000/teacher/courses` - Manage courses
- `http://localhost:3000/teacher/exams` - Manage exams
- `http://localhost:3000/teacher/students` - View students
- `http://localhost:3000/teacher/profile` - Teacher profile

**User Routes** (general authenticated routes):
- `http://localhost:3000/user/profile` - User profile
- `http://localhost:3000/user/settings` - User settings

**Admin Routes**:
- `http://localhost:3000/admin/dashboard` - Admin dashboard
- `http://localhost:3000/admin/users` - Manage users
- `http://localhost:3000/admin/courses` - Manage courses

### 3. Clear Cache Khi Đổi Role

Khi bạn đổi role trong `MOCK_USER`, cần clear localStorage:

**Cách 1: Console**
```javascript
// Mở Chrome DevTools → Console
localStorage.clear()
location.reload()
```

**Cách 2: Application Tab**
- Mở DevTools → Application → Storage → Local Storage
- Click "Clear All"
- Refresh page

---

## 🔍 Kiểm Tra Mock Mode Đang Hoạt Động

### 1. Check Auth State
Mở Console và chạy:
```javascript
// Check auth tokens
console.log(JSON.parse(localStorage.getItem('auth')))
// Output: { token: "mock-access-token-for-testing", ... }

// Check user profile
console.log(JSON.parse(localStorage.getItem('app')))
// Output: { profile: { email: "teacher@test.com", ... } }
```

### 2. Check Middleware
- Thử truy cập `/teacher/dashboard` trực tiếp
- **KHÔNG** bị redirect về `/login` → Mock mode hoạt động ✅
- **BỊ** redirect về `/login` → Mock mode CHƯA hoạt động ❌

### 3. Check User Info in UI
- Navbar phải hiển thị "Mock User" (hoặc tên bạn set)
- Profile page phải hiển thị email mock user
- Avatar/dropdown menu phải có thông tin mock user

---

## 🐛 Troubleshooting

### Vấn đề 1: Vẫn bị redirect về /login
**Nguyên nhân:** `MOCK_MODE = false` trong `src/middleware.ts`

**Giải pháp:**
```typescript
// src/middleware.ts
const MOCK_MODE = true;  // 👈 Phải là true
```

### Vấn đề 2: Không thấy user info trên navbar
**Nguyên nhân:** localStorage chưa có data hoặc đang cache cũ

**Giải pháp:**
```javascript
// Console
localStorage.clear()
location.reload()
```

### Vấn đề 3: API calls bị lỗi 401/403
**Nguyên nhân:** Backend chưa chạy hoặc đang reject mock token

**Giải pháp:**
- **Option 1:** Tắt API calls trong components (comment out useEffect fetching data)
- **Option 2:** Mock API responses bằng MSW (Mock Service Worker)
- **Option 3:** Chạy backend với authentication disabled

**Tạm thời:** Các trang vẫn render được UI, chỉ data sẽ empty. Đủ để test layout và styling.

### Vấn đề 4: Trang bị crash khi load
**Nguyên nhân:** Component đang expect data từ API

**Giải pháp:**
- Thêm null checks trong components
- Thêm loading states
- Thêm fallback UI khi data === null/undefined

Ví dụ:
```typescript
// Before
const CoursePage = () => {
  const { data } = useCourses(); // data might be undefined
  return <div>{data.courses.map(...)}</div>; // ❌ Crash!
};

// After
const CoursePage = () => {
  const { data, isLoading } = useCourses();

  if (isLoading) return <Loading />;
  if (!data || !data.courses) return <EmptyState />;

  return <div>{data.courses.map(...)}</div>; // ✅ Safe!
};
```

---

## 📋 Testing Checklist

### Navigation & Layout
- [ ] Navbar hiển thị user info (Mock User)
- [ ] Sidebar (nếu có) hiển thị menu items
- [ ] Footer hiển thị đúng
- [ ] Links navigation hoạt động

### Student Pages
- [ ] `/student/dashboard` - Load được và hiển thị layout
- [ ] `/student/courses` - Hiển thị course list (hoặc empty state)
- [ ] `/student/exams` - Hiển thị exam list
- [ ] `/student/profile` - Hiển thị mock user info

### Teacher Pages
- [ ] `/teacher/dashboard` - Load được và hiển thị stats
- [ ] `/teacher/courses` - Hiển thị manage courses UI
- [ ] `/teacher/courses/create` - Form tạo course hiển thị
- [ ] `/teacher/exams` - Hiển thị manage exams UI
- [ ] `/teacher/exams/create` - Form tạo exam hiển thị
- [ ] `/teacher/students` - Hiển thị student list
- [ ] `/teacher/profile` - Hiển thị teacher profile

### User Pages
- [ ] `/user/profile` - Hiển thị profile form
- [ ] `/user/settings` - Hiển thị settings UI

### Forms & Interactions
- [ ] Create course form có validation
- [ ] Create exam form có validation
- [ ] Profile edit form hoạt động
- [ ] Buttons có hover effects
- [ ] Modals mở/đóng được
- [ ] Dropdowns hoạt động

### Responsive Design
- [ ] Mobile view (< 768px) hiển thị đúng
- [ ] Tablet view (768px - 1024px) hiển thị đúng
- [ ] Desktop view (> 1024px) hiển thị đúng

---

## 🔄 Tắt Mock Mode (Khi Backend Đã Sẵn Sàng)

Khi backend đã sẵn sàng, chỉ cần set `MOCK_MODE = false` ở 3 nơi:

### 1. Middleware
```typescript
// src/middleware.ts
const MOCK_MODE = false;  // 👈 Đổi về false
```

### 2. Auth Store
```typescript
// src/store/useAuthStore.ts
const MOCK_MODE = false;  // 👈 Đổi về false
```

### 3. App Store
```typescript
// src/store/useAppStore.ts
const MOCK_MODE = false;  // 👈 Đổi về false
```

Sau đó:
```bash
# Clear localStorage
localStorage.clear()

# Restart dev server
npm run dev
```

App sẽ hoạt động bình thường với authentication thật.

---

## 💡 Pro Tips

### 1. Dùng React DevTools
Install extension để inspect components và props:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### 2. Dùng Redux DevTools (cho Zustand)
Zustand có thể kết hợp với Redux DevTools để debug state:
```typescript
// src/store/useAppStore.ts
export const useAppStore = create<AppState>()(
  devtools(  // 👈 Thêm devtools wrapper
    persist(
      immer((set) => ({
        // ... store logic
      })),
      { name: "app" }
    )
  )
);
```

### 3. Mock API Responses Locally
Nếu muốn test với mock data responses, dùng MSW:
```bash
npm install msw --save-dev
```

Tạo mock handlers cho API endpoints.

### 4. Screenshot Testing
Dùng Percy, Chromatic, hoặc Playwright để capture screenshots của tất cả pages.

---

## 📚 Related Files

- `UI_TESTING_MODE.md` - Quick reference (đã có sẵn)
- `TEST_UI_CHEATSHEET.md` - Quick cheatsheet (đã có sẵn)
- `FRONTEND_IMPROVEMENTS.md` - API integration guide

---

## 🎉 Kết Luận

Với Mock Mode, bạn có thể:
- ✅ Test toàn bộ UI/UX ngay lập tức
- ✅ Không cần setup backend
- ✅ Không cần đăng nhập
- ✅ Switch giữa các roles dễ dàng
- ✅ Focus 100% vào frontend development

**Bắt đầu test ngay:**
```bash
cd elearning-frontend
npm run dev
# Truy cập http://localhost:3000/teacher/dashboard
```

Happy Testing! 🚀
