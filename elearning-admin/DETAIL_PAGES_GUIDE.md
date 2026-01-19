# 📖 Detail Pages Guide - Admin Panel

Hướng dẫn chi tiết về các trang xem chi tiết khóa học và bài kiểm tra trong Admin Panel.

---

## 🎯 Tổng Quan

Admin Panel bây giờ có **2 trang chi tiết** hoàn chỉnh:

1. **Course Detail** (`/courses/:id`) - Xem chi tiết khóa học
2. **Exam Detail** (`/exams/:id`) - Xem chi tiết bài kiểm tra

---

## 📄 Course Detail Page

### URL
```
/courses/:id
Ví dụ: /courses/1
```

### Cách Truy Cập
- Từ trang **Course Approval** (`/courses`)
- Click nút **"Xem"** trên bất kỳ khóa học nào
- Sẽ được chuyển đến trang chi tiết với layout đầy đủ

### Layout & Features

#### 🔝 Header Section
- **Breadcrumb Navigation**: Dashboard → Duyệt Khóa Học → [Tên Khóa Học]
- **Course Title** với status tag (Chờ duyệt / Đã duyệt / Từ chối)
- **Course ID** hiển thị

#### 📑 Tab 1: Tổng Quan
**Nội dung:**
- ✅ **Thumbnail khóa học** (full-width image với preview)
- ✅ **Thống kê khóa học**:
  - Số chương (Chapters)
  - Số bài học (Episodes)
  - Số học viên (Enrollments)
  - Trạng thái hiện tại
- ✅ **Thông tin chi tiết**:
  - Tiêu đề, Môn học, Khối lớp
  - Ngày tạo, Ngày nộp duyệt, Ngày duyệt
- ✅ **Mô tả khóa học** (summary)
- ✅ **Lý do từ chối** (nếu bị từ chối)

**Components sử dụng:**
- `Card`, `Image`, `Statistic`, `Descriptions`, `Row`, `Col`

#### 📚 Tab 2: Nội Dung Khóa Học
**Nội dung:**
- ✅ **Collapse Panel** cho từng chương
- ✅ **Episode List** trong mỗi chương:
  - Số thứ tự (avatar với số)
  - Tiêu đề bài học
  - Mô tả
  - Thời lượng video (clock icon)
  - Tag số câu hỏi (nếu có quiz)
- ✅ **Actions cho mỗi episode**:
  - **"Xem video"** button → Mở video trong tab mới
  - **"Xem bài tập"** button → Mở modal quiz preview
- ✅ **Quiz Preview Modal**:
  - Hiển thị tất cả câu hỏi
  - **Đáp án đúng được highlight màu xanh** với icon ✓
  - Giải thích cho mỗi câu (nếu có)
  - Points cho mỗi câu hỏi

**Components sử dụng:**
- `Collapse`, `Panel`, `List`, `Badge`, `Tag`, `Modal`

**Features đặc biệt:**
- **Expand/Collapse** từng chương
- **Video duration** format: `1800 seconds` → `30 phút`
- **Quiz modal** với correct answers highlighted

#### 👨‍🏫 Tab 3: Thông Tin Giáo Viên
**Nội dung:**
- ✅ **Teacher Profile Card**:
  - Avatar (hoặc placeholder với icon)
  - Họ tên
  - Email, Số điện thoại
  - Role tag
- ✅ **Teacher Statistics**:
  - Số khóa học của giáo viên này
  - Ngày tham gia
  - Trạng thái tài khoản

**Components sử dụng:**
- `Card`, `Image`, `Statistic`, `Space`

#### ⚡ Sticky Action Buttons
**Chỉ hiển thị khi:** Status = `PENDING_REVIEW`

**3 Buttons:**
1. **Duyệt Khóa Học** (Primary, green)
   - Icon: `<CheckCircleOutlined />`
   - Cập nhật status → `APPROVED`
   - Thêm `approvedAt` timestamp
   - Success toast
   - Auto redirect về `/courses` sau 1.5s

2. **Từ Chối** (Danger, red)
   - Icon: `<CloseCircleOutlined />`
   - Mở **Reject Modal**
   - Modal yêu cầu **bắt buộc nhập lý do** (max 500 chars)
   - Validate: Không cho submit nếu lý do trống
   - Cập nhật status → `REJECTED` với `rejectionReason`
   - Success toast
   - Auto redirect về `/courses` sau 1.5s

3. **Quay Lại** (Default)
   - Navigate về `/courses`

**Sticky Position:**
- `<Affix offsetBottom={20}>` - Luôn hiển thị ở bottom khi scroll
- BoxShadow để nổi bật

---

## 📝 Exam Detail Page

### URL
```
/exams/:id
Ví dụ: /exams/1
```

### Cách Truy Cập
- Từ trang **Exam Approval** (`/exams`)
- Click nút **"Xem"** trên bất kỳ bài kiểm tra nào
- Sẽ được chuyển đến trang chi tiết

### Layout & Features

#### 🔝 Header Section
- **Breadcrumb Navigation**: Dashboard → Duyệt Bài Kiểm Tra → [Tên Bài Thi]
- **Exam Title** với status tag
- **Exam ID** hiển thị

#### 📑 Tab 1: Tổng Quan
**Nội dung:**
- ✅ **Status Alert**:
  - 🔵 **Upcoming**: "Bài kiểm tra sắp diễn ra" (X ngày nữa)
  - 🟢 **Ongoing**: "Bài kiểm tra đang diễn ra"
  - 🟠 **Ended**: "Bài kiểm tra đã kết thúc"
- ✅ **Lịch thi (Schedule)**:
  - Thời gian bắt đầu (với icon)
  - Thời gian kết thúc (với icon)
  - 2 cards hiển thị đẹp với `Statistic`
- ✅ **Thông tin bài thi**:
  - Thời lượng (phút)
  - Số câu hỏi
  - Lượt thi (attempts)
  - Trạng thái
- ✅ **Chi tiết**:
  - Tiêu đề, Giáo viên
  - Ngày tạo, Ngày nộp duyệt, Ngày duyệt
- ✅ **Lý do từ chối** (nếu bị từ chối)

**Components sử dụng:**
- `Alert`, `Card`, `Statistic`, `Descriptions`

**Logic đặc biệt:**
```typescript
const timeUntilStart = dayjs(exam.startTime).diff(dayjs(), 'day');
const isUpcoming = dayjs().isBefore(dayjs(exam.startTime));
const isOngoing = dayjs().isAfter(exam.startTime) && dayjs().isBefore(exam.endTime);
const isEnded = dayjs().isAfter(exam.endTime);
```

#### ❓ Tab 2: Câu Hỏi
**Nội dung:**
- ✅ **Filter Dropdown**:
  - Tất cả
  - Trắc nghiệm (MULTIPLE_CHOICE)
  - Đúng/Sai (TRUE_FALSE)
  - Tự luận ngắn (SHORT_ANSWER)
  - Hiển thị số lượng mỗi loại trong ngoặc
- ✅ **Question List**:
  - Card cho mỗi câu hỏi
  - **Header**: Số câu, Loại câu hỏi (tag màu), Điểm số
  - **Content**: Nội dung câu hỏi
  - **Answers**:
    - Đáp án đúng: **Màu xanh background (#f6ffed)** + **Border xanh** + **Icon ✓**
    - Đáp án sai: Background trắng, border mỏng
    - Format: A. [content], B. [content], ...
  - **Explanation**: Alert box màu xanh với icon (nếu có)

**Components sử dụng:**
- `Select`, `List`, `Card`, `Tag`, `Alert`

**Question Type Colors:**
```typescript
MULTIPLE_CHOICE: 'blue'
TRUE_FALSE: 'green'
SHORT_ANSWER: 'orange'
```

#### ⚙️ Tab 3: Cài Đặt
**Nội dung:**
- ✅ **Cài đặt cơ bản** (Read-only):
  - Thời lượng thi
  - Tổng số câu hỏi
  - Điểm tối đa (tổng points của tất cả câu hỏi)
  - Điểm trung bình/câu
- ✅ **Cài đặt nâng cao** (Read-only switches):
  - ✓ Xáo trộn câu hỏi
  - ✓ Xáo trộn đáp án
  - ✗ Cho phép xem lại đáp án
  - ✓ Chế độ chống gian lận
- ✅ **Bảo mật**:
  - ✓ Chặn chuyển tab
  - ✓ Chặn chuột phải
  - ✗ Yêu cầu camera
  - ✓ Ghi log hành vi

**Components sử dụng:**
- `Card`, `Switch`, `Paragraph`, `Divider`

**Note:** Tất cả switches đều `disabled` vì admin chỉ **xem**, không **chỉnh sửa**

#### 📊 Tab 4: Kết Quả
**Nội dung:**
- ✅ **Thống kê chung**:
  - Lượt thi
  - Điểm trung bình
  - Tỷ lệ đạt
  - Điểm cao nhất
- ✅ **Phân bố điểm**:
  - Placeholder với icon chart và text "Chưa có dữ liệu"
  - Sẽ hiển thị biểu đồ khi có học sinh làm bài
- ✅ **Bảng xếp hạng**:
  - Placeholder: "Chưa có học sinh nào hoàn thành"
  - Sẽ hiển thị top students khi có data

**Components sử dụng:**
- `Statistic`, `Card`, `Paragraph` (placeholder)

**Note:** Tab này hiện tại là **placeholder** vì chưa có dữ liệu thực

#### 👨‍🏫 Tab 5: Giáo Viên
**Nội dung:**
- Giống như Course Detail Tab 3
- Teacher profile + statistics

#### ⚡ Sticky Action Buttons
**Giống Course Detail:**
- **Duyệt Bài Kiểm Tra** → Status: `APPROVED`
- **Từ Chối** → Mở modal nhập lý do → Status: `CLOSED` (hoặc `REJECTED`)
- **Quay Lại** → Navigate về `/exams`

---

## 🗂️ Mock Data Structure

### Chapters & Episodes
```typescript
// elearning-admin/src/data/mockData.ts

export const mockChapters: Chapter[] = [
  {
    id: 1,
    courseId: 1, // For Course "Toán Lớp 10"
    title: 'Chương 1: Mệnh đề và Tập hợp',
    description: '...',
    orderIndex: 1,
    episodeCount: 4,
    episodes: [
      {
        id: 1,
        chapterId: 1,
        title: 'Bài 1: Mệnh đề logic',
        description: '...',
        videoUrl: 'https://www.youtube.com/...',
        videoDurationSeconds: 1800, // 30 phút
        orderIndex: 1,
        quizzes: [
          {
            id: 1,
            episodeId: 1,
            title: 'Kiểm tra nhanh: Mệnh đề logic',
            questions: [
              {
                id: 1,
                content: 'Mệnh đề nào sau đây là mệnh đề đúng?',
                type: QuestionType.MULTIPLE_CHOICE,
                points: 10,
                explanation: '2 + 2 = 4 là mệnh đề đúng',
                answers: [
                  { content: '2 + 2 = 5', isCorrect: false },
                  { content: '2 + 2 = 4', isCorrect: true }, // ✓ Highlighted
                  // ...
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
```

### Exam Questions
```typescript
export const mockExamQuestions: Record<number, Question[]> = {
  1: [ // Exam ID 1
    {
      id: 101,
      quizId: 101,
      content: 'Tập xác định của hàm số y = 1/(x-2) là:',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 1,
      explanation: 'Hàm số không xác định tại x = 2.',
      answers: [
        { content: 'R \\ {2}', isCorrect: true }, // ✓ Highlighted
        { content: 'R', isCorrect: false },
        // ...
      ]
    },
    // ... more questions
  ]
};
```

---

## 🎨 UI/UX Features

### 1. Breadcrumb Navigation
- Luôn hiển thị đường dẫn đầy đủ
- Click được để quay lại
- Icons cho mỗi level

### 2. Status Tags
- **Pending Review**: Orange/Gold
- **Approved**: Green
- **Rejected**: Red
- **Published** (Course): Blue
- **Live** (Exam): Blue
- **Closed** (Exam): Gray

### 3. Image Preview
- Ant Design `<Image>` component
- Auto preview khi click
- Zoom in/out, rotate
- Áp dụng cho:
  - Course thumbnails
  - Teacher documents (CCCD, certificates)

### 4. Highlighted Correct Answers
```tsx
<List.Item
  style={{
    backgroundColor: answer.isCorrect ? '#f6ffed' : 'transparent',
    border: answer.isCorrect ? '2px solid #52c41a' : '1px solid #f0f0f0',
    borderRadius: 4,
  }}
>
  {answer.isCorrect && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
  <Text strong={answer.isCorrect}>{answer.content}</Text>
</List.Item>
```

### 5. Affix Sticky Buttons
```tsx
<Affix offsetBottom={20}>
  <Card style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.15)' }}>
    {/* Buttons here */}
  </Card>
</Affix>
```

### 6. Modal Validations
- Reject modal: Bắt buộc nhập lý do
- Show warning toast nếu trống
- Max length: 500 chars với counter

### 7. Loading States
- Button loading khi approve/reject
- Disable buttons khi đang loading
- Simulate API delay: 1000ms

### 8. Auto Redirect
- Sau khi approve/reject thành công
- Delay 1500ms để user đọc success message
- Redirect về list page

---

## 🔄 Workflow

### Course Approval Workflow
```
1. Admin vào /courses
2. Click "Xem" trên khóa học → Navigate to /courses/:id
3. Xem chi tiết trên 3 tabs:
   - Tab 1: Tổng quan, thumbnail, thống kê
   - Tab 2: Nội dung chi tiết (chapters, episodes, quizzes)
   - Tab 3: Thông tin giáo viên
4. Quyết định:
   - Click "Duyệt" → Status: APPROVED → Success → Redirect
   - Click "Từ Chối" → Modal mở → Nhập lý do (required) → Submit → Status: REJECTED → Redirect
5. Quay về /courses (tự động hoặc click "Quay Lại")
```

### Exam Approval Workflow
```
1. Admin vào /exams
2. Click "Xem" trên bài kiểm tra → Navigate to /exams/:id
3. Xem chi tiết trên 5 tabs:
   - Tab 1: Tổng quan, lịch thi, alerts
   - Tab 2: Danh sách câu hỏi chi tiết với đáp án
   - Tab 3: Cài đặt bài thi (read-only)
   - Tab 4: Kết quả và thống kê (placeholder)
   - Tab 5: Thông tin giáo viên
4. Quyết định:
   - Click "Duyệt" → Status: APPROVED → Success → Redirect
   - Click "Từ Chối" → Modal mở → Nhập lý do → Submit → Status: CLOSED → Redirect
5. Quay về /exams
```

---

## 📁 File Structure

```
elearning-admin/
├── src/
│   ├── pages/
│   │   ├── CourseDetail.tsx        # 🆕 Chi tiết khóa học
│   │   ├── CourseApproval.tsx      # ✏️ Updated: handleView navigate
│   │   ├── ExamDetail.tsx          # 🆕 Chi tiết bài kiểm tra
│   │   └── ExamApproval.tsx        # ✏️ Updated: handleView navigate
│   │
│   ├── types/
│   │   └── index.ts                # ✏️ Updated: Added Chapter, Episode, Quiz, Question, Answer
│   │
│   ├── data/
│   │   └── mockData.ts             # ✏️ Updated: Added mockChapters, mockExamQuestions
│   │
│   └── App.tsx                      # ✏️ Updated: Added routes /courses/:id, /exams/:id
│
└── DETAIL_PAGES_GUIDE.md           # 🆕 This file
```

---

## 🚀 Testing Checklist

### Course Detail Page
- [ ] Navigate from /courses → Click "Xem" → Vào được /courses/1
- [ ] Breadcrumb hiển thị và click được
- [ ] Tab 1: Thumbnail, statistics, descriptions hiển thị đầy đủ
- [ ] Tab 2: Collapse chapters hoạt động
- [ ] Tab 2: Episode list hiển thị với video duration
- [ ] Tab 2: Click "Xem video" → Mở tab mới
- [ ] Tab 2: Click "Xem bài tập" → Modal quiz mở
- [ ] Tab 2: Trong modal, đáp án đúng được highlight màu xanh với icon ✓
- [ ] Tab 3: Teacher profile và stats hiển thị
- [ ] Sticky buttons hiển thị khi status = PENDING_REVIEW
- [ ] Click "Duyệt" → Success toast → Status updated → Redirect
- [ ] Click "Từ Chối" → Modal mở
- [ ] Modal: Submit khi lý do trống → Warning toast
- [ ] Modal: Nhập lý do → Submit → Success → Status REJECTED → Redirect
- [ ] Click "Quay Lại" → Navigate về /courses

### Exam Detail Page
- [ ] Navigate from /exams → Click "Xem" → Vào được /exams/1
- [ ] Breadcrumb hiển thị và click được
- [ ] Tab 1: Alert hiển thị đúng trạng thái (upcoming/ongoing/ended)
- [ ] Tab 1: Lịch thi, statistics hiển thị đầy đủ
- [ ] Tab 2: Filter dropdown hoạt động
- [ ] Tab 2: Question list hiển thị với type tags và points
- [ ] Tab 2: Đáp án đúng được highlight màu xanh + border + icon ✓
- [ ] Tab 2: Explanation hiển thị trong Alert box
- [ ] Tab 3: Settings và switches hiển thị (all disabled)
- [ ] Tab 4: Placeholder statistics và charts hiển thị
- [ ] Tab 5: Teacher profile và stats hiển thị
- [ ] Sticky buttons hoạt động giống Course Detail
- [ ] Approve/Reject workflow hoạt động đúng

---

## 💡 Pro Tips

### 1. Để Test Với Data Khác
Sửa file `src/data/mockData.ts`:
- Thêm chapters cho course khác (courseId 2, 3, 4)
- Thêm exam questions cho exam khác (examId 2, 3, 4, 5)

### 2. Thêm Video Thật
Thay `videoUrl` bằng YouTube video thật:
```typescript
videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
```

### 3. Thêm Nhiều Quizzes
Một episode có thể có nhiều quizzes:
```typescript
quizzes: [
  { id: 1, title: 'Quiz 1', questions: [...] },
  { id: 2, title: 'Quiz 2', questions: [...] },
]
```

### 4. Custom Status Colors
Sửa trong `getStatusTag()` function:
```typescript
const statusConfig = {
  [CourseStatus.PENDING_REVIEW]: { color: 'orange', text: 'Chờ duyệt' },
  // ... change colors here
};
```

---

## 🔗 Related Files

- `ADMIN_PANEL_GUIDE.md` - Overview toàn bộ admin panel
- `QUICKSTART.md` - Quick start guide
- `README.md` - Full documentation

---

## 📝 Notes

### Mock Data Persistence
- Mock data được lưu trong memory (useState)
- Khi refresh page, data sẽ reset về initial state
- Sau này khi integrate API, data sẽ persistent qua backend

### API Integration
Khi backend sẵn sàng, chỉ cần thay mock data bằng API calls:

```typescript
// Before (Mock)
const [course, setCourse] = useState<Course | null>(null);
useEffect(() => {
  const courseData = mockCourses.find((c) => c.id === Number(id));
  setCourse(courseData);
}, [id]);

// After (Real API)
useEffect(() => {
  fetch(`http://localhost:3000/api/v1/courses/${id}`)
    .then(res => res.json())
    .then(data => setCourse(data.result));
}, [id]);
```

---

**🎉 Detail pages đã hoàn thiện! Bây giờ admin có thể xem chi tiết đầy đủ trước khi duyệt!**
