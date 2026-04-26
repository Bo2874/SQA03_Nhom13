/**
 * Unit Test Script: courses.ts (Admin Panel API)
 *
 * Tệp kiểm thử: src/api/courses.ts (elearning-admin)
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử (coursesAPI object):
 *   1. getCourses(params?)                   - Lấy danh sách khóa học (admin)
 *   2. getCourseById(id)                     - Lấy chi tiết 1 khóa học
 *   3. getCourseChapters(courseId)            - Lấy chapters của khóa học
 *   4. updateCourseByAdmin(courseId, data)    - Cập nhật trạng thái khóa học
 *   5. approveCourse(courseId)               - Duyệt khóa học (convenience)
 *   6. rejectCourse(courseId, reason)        - Từ chối khóa học (convenience)
 *   7. publishCourse(courseId)              - Xuất bản khóa học (convenience)
 *
 * Kỹ thuật mock:
 *   - Mock module '../api/http' (axios instance) vì chứa import.meta.env
 *   - Kiểm tra URL path, HTTP method, params, body đúng
 *   - Kiểm tra response.data được trả về chính xác
 */

// ================================================================
// Mock http module (axios instance)
// Thay http.get/http.put bằng jest.fn() để capture calls
// ================================================================
const mockGet = jest.fn();
const mockPut = jest.fn();

jest.mock("../api/http", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

import coursesAPI from "../api/courses";

// Reset mock sau mỗi test
afterEach(() => {
  jest.clearAllMocks();
});

// ================================================================
// I. TEST SUITE: getCourses(params?)
// Mô tả: Lấy danh sách khóa học, mặc định exclude DRAFT
// ================================================================
describe("coursesAPI.getCourses(params?)", () => {

  // --- TC_CA_001: Gọi không có params ---
  test("TC_CA_001: Gọi không params → thêm status mặc định, GET /api/v1/courses", () => {
    // Expected: GET /api/v1/courses với status default
    mockGet.mockResolvedValue({ data: { message: "OK", result: [] } });
    coursesAPI.getCourses();
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses", {
      params: { status: "PENDING_REVIEW,APPROVED,REJECTED,PUBLISHED" },
    });
  });

  // --- TC_CA_002: Gọi với status cụ thể ---
  test("TC_CA_002: Gọi với status='PENDING_REVIEW' → dùng status truyền vào", () => {
    mockGet.mockResolvedValue({ data: { message: "OK", result: [] } });
    coursesAPI.getCourses({ status: "PENDING_REVIEW" });
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses", {
      params: expect.objectContaining({ status: "PENDING_REVIEW" }),
    });
  });

  // --- TC_CA_003: Gọi với page + limit ---
  test("TC_CA_003: Gọi với page=1, limit=10", () => {
    mockGet.mockResolvedValue({ data: { message: "OK", result: [] } });
    coursesAPI.getCourses({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses", {
      params: expect.objectContaining({ page: 1, limit: 10 }),
    });
  });

  // --- TC_CA_004: Trả về response.data ---
  test("TC_CA_004: Trả về response.data đúng", async () => {
    const mockData = { message: "OK", result: [{ id: 1, title: "Toán 10" }] };
    mockGet.mockResolvedValue({ data: mockData });
    const result = await coursesAPI.getCourses();
    expect(result).toEqual(mockData);
  });

  // --- TC_CA_005: Gọi đúng 1 lần ---
  test("TC_CA_005: http.get được gọi đúng 1 lần", () => {
    mockGet.mockResolvedValue({ data: {} });
    coursesAPI.getCourses();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

// ================================================================
// II. TEST SUITE: getCourseById(id)
// ================================================================
describe("coursesAPI.getCourseById(id)", () => {

  // --- TC_CA_006: URL path đúng ---
  test("TC_CA_006: GET /api/v1/courses/5 → URL path chứa id", () => {
    mockGet.mockResolvedValue({ data: { result: { id: 5 } } });
    coursesAPI.getCourseById(5);
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses/5");
  });

  // --- TC_CA_007: Trả về response.data ---
  test("TC_CA_007: Trả về course detail", async () => {
    const course = { id: 5, title: "Toán lớp 10", status: "PUBLISHED" };
    mockGet.mockResolvedValue({ data: { result: course } });
    const result = await coursesAPI.getCourseById(5);
    expect(result.result).toEqual(course);
  });

  // --- TC_CA_008: ID khác nhau → URL khác nhau ---
  test("TC_CA_008: ID=99 → /api/v1/courses/99", () => {
    mockGet.mockResolvedValue({ data: {} });
    coursesAPI.getCourseById(99);
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses/99");
  });
});

// ================================================================
// III. TEST SUITE: getCourseChapters(courseId)
// ================================================================
describe("coursesAPI.getCourseChapters(courseId)", () => {

  // --- TC_CA_009: URL path đúng ---
  test("TC_CA_009: GET /api/v1/courses/3/chapters", () => {
    mockGet.mockResolvedValue({ data: { result: [] } });
    coursesAPI.getCourseChapters(3);
    expect(mockGet).toHaveBeenCalledWith("/api/v1/courses/3/chapters");
  });

  // --- TC_CA_010: Trả về danh sách chapters ---
  test("TC_CA_010: Trả về array chapters", async () => {
    const chapters = [{ id: 1, title: "Chương 1" }, { id: 2, title: "Chương 2" }];
    mockGet.mockResolvedValue({ data: { result: chapters } });
    const result = await coursesAPI.getCourseChapters(3);
    expect(result.result).toHaveLength(2);
  });
});

// ================================================================
// IV. TEST SUITE: updateCourseByAdmin(courseId, data)
// ================================================================
describe("coursesAPI.updateCourseByAdmin(courseId, data)", () => {

  // --- TC_CA_011: PUT URL đúng ---
  test("TC_CA_011: PUT /api/v1/courses/5/by-admin", () => {
    mockPut.mockResolvedValue({ data: { result: {} } });
    coursesAPI.updateCourseByAdmin(5, { status: "APPROVED" });
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", { status: "APPROVED" });
  });

  // --- TC_CA_012: Gửi rejectionReason khi REJECTED ---
  test("TC_CA_012: REJECTED kèm rejectionReason", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.updateCourseByAdmin(5, {
      status: "REJECTED",
      rejectionReason: "Nội dung chưa đạt",
    });
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", {
      status: "REJECTED",
      rejectionReason: "Nội dung chưa đạt",
    });
  });

  // --- TC_CA_013: Trả về course đã cập nhật ---
  test("TC_CA_013: Trả về course với status mới", async () => {
    const updated = { id: 5, status: "APPROVED" };
    mockPut.mockResolvedValue({ data: { result: updated } });
    const result = await coursesAPI.updateCourseByAdmin(5, { status: "APPROVED" });
    expect(result.result.status).toBe("APPROVED");
  });
});

// ================================================================
// V. TEST SUITE: approveCourse(courseId) — convenience method
// ================================================================
describe("coursesAPI.approveCourse(courseId)", () => {

  // --- TC_CA_014: Gọi updateCourseByAdmin với APPROVED ---
  test("TC_CA_014: approveCourse(5) → PUT status='APPROVED'", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.approveCourse(5);
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", { status: "APPROVED" });
  });

  // --- TC_CA_015: Không gửi rejectionReason ---
  test("TC_CA_015: approveCourse không gửi rejectionReason", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.approveCourse(10);
    const callArgs = mockPut.mock.calls[0][1];
    expect(callArgs.rejectionReason).toBeUndefined();
  });
});

// ================================================================
// VI. TEST SUITE: rejectCourse(courseId, reason)
// ================================================================
describe("coursesAPI.rejectCourse(courseId, reason)", () => {

  // --- TC_CA_016: Gọi với REJECTED + reason ---
  test("TC_CA_016: rejectCourse(5, 'Lý do') → PUT status='REJECTED'", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.rejectCourse(5, "Nội dung không phù hợp");
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", {
      status: "REJECTED",
      rejectionReason: "Nội dung không phù hợp",
    });
  });

  // --- TC_CA_017: Reason rỗng ---
  test("TC_CA_017: rejectCourse với reason rỗng", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.rejectCourse(5, "");
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", {
      status: "REJECTED",
      rejectionReason: "",
    });
  });
});

// ================================================================
// VII. TEST SUITE: publishCourse(courseId) — convenience method
// ================================================================
describe("coursesAPI.publishCourse(courseId)", () => {

  // --- TC_CA_018: Gọi với PUBLISHED ---
  test("TC_CA_018: publishCourse(5) → PUT status='PUBLISHED'", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.publishCourse(5);
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/5/by-admin", { status: "PUBLISHED" });
  });

  // --- TC_CA_019: ID khác → URL khác ---
  test("TC_CA_019: publishCourse(99) → /api/v1/courses/99/by-admin", () => {
    mockPut.mockResolvedValue({ data: {} });
    coursesAPI.publishCourse(99);
    expect(mockPut).toHaveBeenCalledWith("/api/v1/courses/99/by-admin", { status: "PUBLISHED" });
  });
});

// ================================================================
// VIII. TEST SUITE: Error handling
// ================================================================
describe("coursesAPI - Error handling", () => {

  // --- TC_CA_020: getCourses lỗi → reject ---
  test("TC_CA_020: getCourses khi API lỗi → Promise.reject", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    await expect(coursesAPI.getCourses()).rejects.toThrow("Network error");
  });

  // --- TC_CA_021: getCourseById lỗi → reject ---
  test("TC_CA_021: getCourseById khi API lỗi → reject", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    await expect(coursesAPI.getCourseById(999)).rejects.toThrow("Not found");
  });

  // --- TC_CA_022: updateCourseByAdmin lỗi → reject ---
  test("TC_CA_022: updateCourseByAdmin lỗi → reject", async () => {
    mockPut.mockRejectedValue(new Error("Forbidden"));
    await expect(
      coursesAPI.updateCourseByAdmin(5, { status: "APPROVED" })
    ).rejects.toThrow("Forbidden");
  });
});
