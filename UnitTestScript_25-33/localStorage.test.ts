/**
 * Unit Test Script: localStorage.ts
 *
 * Tệp kiểm thử: src/utils/localStorage.ts
 * Framework: Jest + ts-jest (jsdom environment)
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 *   1. getLocalStorage(key)        - Lấy và JSON.parse giá trị từ localStorage
 *   2. setLocalStorage(key, value) - JSON.stringify và lưu vào localStorage
 *   3. removeLocalStorage(key)     - Xóa item khỏi localStorage
 *
 * Đặc điểm source code cần lưu ý:
 *   - getLocalStorage: dùng JSON.parse → có thể throw nếu value không phải JSON hợp lệ
 *   - getLocalStorage: trả về null nếu key không tồn tại (value = null → falsy → return null)
 *   - getLocalStorage: trả về null nếu value là chuỗi rỗng "" (falsy → return null)
 *   - setLocalStorage: dùng JSON.stringify → hỗ trợ object, array, number, boolean, string
 *
 * @jest-environment jsdom
 */

import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from "@/utils/localStorage";

// ================================================================
// Setup: Xóa sạch localStorage trước mỗi test
// jsdom cung cấp localStorage API sẵn, không cần mock
// ================================================================
beforeEach(() => {
  localStorage.clear();
});

// ================================================================
// I. TEST SUITE: getLocalStorage(key)
// Mô tả: Lấy giá trị từ localStorage, tự động JSON.parse
// Logic: value = localStorage.getItem(key)
//        return value ? JSON.parse(value) : null
// ================================================================
describe("getLocalStorage(key)", () => {

  // --- TC_LS_001: Lấy giá trị string đã lưu ---
  test("TC_LS_001: Lấy giá trị string đã lưu", () => {
    // Setup: lưu chuỗi JSON vào localStorage
    // Input: key = "name"
    // Expected: "Nguyen Van A"
    localStorage.setItem("name", JSON.stringify("Nguyen Van A"));
    const result = getLocalStorage("name");
    expect(result).toBe("Nguyen Van A");
  });

  // --- TC_LS_002: Lấy giá trị object đã lưu ---
  test("TC_LS_002: Lấy giá trị object đã lưu", () => {
    // Input: key = "user"
    // Expected: { id: 1, name: "Admin", role: "TEACHER" }
    const user = { id: 1, name: "Admin", role: "TEACHER" };
    localStorage.setItem("user", JSON.stringify(user));
    const result = getLocalStorage("user");
    expect(result).toEqual(user);
  });

  // --- TC_LS_003: Lấy giá trị array đã lưu ---
  test("TC_LS_003: Lấy giá trị array đã lưu", () => {
    // Input: key = "courses"
    // Expected: [1, 2, 3]
    const courses = [1, 2, 3];
    localStorage.setItem("courses", JSON.stringify(courses));
    const result = getLocalStorage("courses");
    expect(result).toEqual(courses);
  });

  // --- TC_LS_004: Lấy giá trị number đã lưu ---
  test("TC_LS_004: Lấy giá trị number đã lưu", () => {
    // Input: key = "count"
    // Expected: 42
    localStorage.setItem("count", JSON.stringify(42));
    const result = getLocalStorage("count");
    expect(result).toBe(42);
  });

  // --- TC_LS_005: Lấy giá trị boolean đã lưu ---
  test("TC_LS_005: Lấy giá trị boolean đã lưu", () => {
    // Input: key = "isLoggedIn"
    // Expected: true
    localStorage.setItem("isLoggedIn", JSON.stringify(true));
    const result = getLocalStorage("isLoggedIn");
    expect(result).toBe(true);
  });

  // --- TC_LS_006: Lấy key không tồn tại → null ---
  test("TC_LS_006: Lấy key không tồn tại → trả về null", () => {
    // Input: key = "nonexistent" (chưa setItem)
    // Expected: null (localStorage.getItem trả về null → falsy → return null)
    const result = getLocalStorage("nonexistent");
    expect(result).toBeNull();
  });

  // --- TC_LS_007: Lấy giá trị null đã lưu ---
  test("TC_LS_007: Lấy giá trị null đã lưu (JSON 'null')", () => {
    // Input: key = "empty"
    // localStorage chứa chuỗi "null" (JSON.stringify(null))
    // Expected: null (JSON.parse("null") = null, nhưng "null" là truthy → JSON.parse → null)
    localStorage.setItem("empty", JSON.stringify(null));
    const result = getLocalStorage("empty");
    expect(result).toBeNull();
  });

  // --- TC_LS_008: Lấy giá trị 0 đã lưu ---
  test("TC_LS_008: Lấy giá trị 0 (số 0 là falsy nhưng JSON '0' là truthy)", () => {
    // Input: key = "zero"
    // localStorage chứa chuỗi "0"
    // Expected: 0 (chuỗi "0" truthy → JSON.parse("0") = 0)
    localStorage.setItem("zero", JSON.stringify(0));
    const result = getLocalStorage("zero");
    expect(result).toBe(0);
  });

  // --- TC_LS_009: Lấy giá trị false đã lưu ---
  test("TC_LS_009: Lấy giá trị false (boolean false)", () => {
    // localStorage chứa chuỗi "false" (truthy) → JSON.parse → false
    localStorage.setItem("flag", JSON.stringify(false));
    const result = getLocalStorage("flag");
    expect(result).toBe(false);
  });

  // --- TC_LS_010: Lấy object lồng nhau phức tạp ---
  test("TC_LS_010: Lấy object lồng nhau phức tạp", () => {
    const complex = {
      user: { id: 1, name: "Test" },
      courses: [{ id: 10, title: "Toán" }],
      settings: { theme: "dark", lang: "vi" },
    };
    localStorage.setItem("appState", JSON.stringify(complex));
    const result = getLocalStorage("appState");
    expect(result).toEqual(complex);
  });

  // --- TC_LS_011: Lấy giá trị chuỗi rỗng đã lưu ---
  test("TC_LS_011: Giá trị chuỗi rỗng → trả về null (vì '' là falsy)", () => {
    // Bug tiềm ẩn: nếu ai đó setItem trực tiếp (không qua setLocalStorage)
    // với value = "" → getLocalStorage trả về null thay vì ""
    // Vì code: return value ? JSON.parse(value) : null
    // "" là falsy → return null
    localStorage.setItem("emptyStr", "");
    const result = getLocalStorage("emptyStr");
    expect(result).toBeNull();
  });
});

// ================================================================
// II. TEST SUITE: setLocalStorage(key, value)
// Mô tả: JSON.stringify value rồi lưu vào localStorage
// ================================================================
describe("setLocalStorage(key, value)", () => {

  // --- TC_LS_012: Lưu string ---
  test("TC_LS_012: Lưu giá trị string", () => {
    // Input: key = "token", value = "abc123"
    // Expected: localStorage chứa '"abc123"' (JSON stringify thêm dấu nháy)
    setLocalStorage("token", "abc123");
    expect(localStorage.getItem("token")).toBe('"abc123"');
  });

  // --- TC_LS_013: Lưu object ---
  test("TC_LS_013: Lưu giá trị object", () => {
    // Input: value = { id: 1, role: "STUDENT" }
    const user = { id: 1, role: "STUDENT" };
    setLocalStorage("user", user);
    expect(localStorage.getItem("user")).toBe(JSON.stringify(user));
  });

  // --- TC_LS_014: Lưu array ---
  test("TC_LS_014: Lưu giá trị array", () => {
    const arr = [1, "two", { three: 3 }];
    setLocalStorage("list", arr);
    expect(localStorage.getItem("list")).toBe(JSON.stringify(arr));
  });

  // --- TC_LS_015: Lưu number ---
  test("TC_LS_015: Lưu giá trị number", () => {
    setLocalStorage("count", 99);
    expect(localStorage.getItem("count")).toBe("99");
  });

  // --- TC_LS_016: Lưu boolean ---
  test("TC_LS_016: Lưu giá trị boolean true", () => {
    setLocalStorage("active", true);
    expect(localStorage.getItem("active")).toBe("true");
  });

  // --- TC_LS_017: Lưu null ---
  test("TC_LS_017: Lưu giá trị null", () => {
    setLocalStorage("nothing", null);
    expect(localStorage.getItem("nothing")).toBe("null");
  });

  // --- TC_LS_018: Ghi đè giá trị cũ ---
  test("TC_LS_018: Ghi đè giá trị cũ bằng giá trị mới", () => {
    setLocalStorage("key", "old");
    setLocalStorage("key", "new");
    expect(localStorage.getItem("key")).toBe('"new"');
  });

  // --- TC_LS_019: Lưu chuỗi rỗng ---
  test("TC_LS_019: Lưu chuỗi rỗng", () => {
    setLocalStorage("empty", "");
    expect(localStorage.getItem("empty")).toBe('""');
  });
});

// ================================================================
// III. TEST SUITE: removeLocalStorage(key)
// Mô tả: Xóa item khỏi localStorage theo key
// ================================================================
describe("removeLocalStorage(key)", () => {

  // --- TC_LS_020: Xóa key tồn tại ---
  test("TC_LS_020: Xóa key tồn tại", () => {
    // Setup: lưu giá trị trước
    localStorage.setItem("token", '"abc"');
    // Act: xóa
    removeLocalStorage("token");
    // Assert: key không còn
    expect(localStorage.getItem("token")).toBeNull();
  });

  // --- TC_LS_021: Xóa key không tồn tại (không lỗi) ---
  test("TC_LS_021: Xóa key không tồn tại → không throw error", () => {
    expect(() => removeLocalStorage("nonexistent")).not.toThrow();
  });

  // --- TC_LS_022: Xóa key rỗng ---
  test("TC_LS_022: Xóa key rỗng → không lỗi", () => {
    expect(() => removeLocalStorage("")).not.toThrow();
  });

  // --- TC_LS_023: Xóa 1 key không ảnh hưởng key khác ---
  test("TC_LS_023: Xóa 1 key không ảnh hưởng key khác", () => {
    localStorage.setItem("a", '"1"');
    localStorage.setItem("b", '"2"');
    removeLocalStorage("a");
    expect(localStorage.getItem("a")).toBeNull();
    expect(localStorage.getItem("b")).toBe('"2"');
  });
});

// ================================================================
// IV. TEST SUITE: Tích hợp set → get → remove
// Mô tả: Kiểm tra luồng hoàn chỉnh set → get → remove
// ================================================================
describe("Tích hợp: set → get → remove", () => {

  // --- TC_LS_024: Luồng hoàn chỉnh với object ---
  test("TC_LS_024: set object → get object → remove → get null", () => {
    const data = { email: "test@gmail.com", role: "ADMIN" };
    // Set
    setLocalStorage("user", data);
    // Get
    expect(getLocalStorage("user")).toEqual(data);
    // Remove
    removeLocalStorage("user");
    // Verify removed
    expect(getLocalStorage("user")).toBeNull();
  });

  // --- TC_LS_025: Ghi đè rồi đọc lại ---
  test("TC_LS_025: set → ghi đè → get → trả về giá trị mới", () => {
    setLocalStorage("lang", "en");
    setLocalStorage("lang", "vi");
    expect(getLocalStorage("lang")).toBe("vi");
  });
});
