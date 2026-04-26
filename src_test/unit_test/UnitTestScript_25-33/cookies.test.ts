/**
 * Unit Test Script: cookies.ts
 *
 * Tệp kiểm thử: src/utils/cookies.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 *   1. getCookie(key)                   - Lấy giá trị cookie theo key
 *   2. setCookie(key, value, options?)  - Tạo/cập nhật cookie
 *   3. removeCookie(key)               - Xóa cookie theo key
 *
 * Kỹ thuật mock:
 *   - Mock thư viện js-cookie bằng jest.mock()
 *   - Kiểm tra các hàm wrapper gọi đúng method của js-cookie
 *     với đúng tham số (đúng key, value, options)
 *   - Kiểm tra giá trị trả về được forward chính xác
 */

import Cookies from "js-cookie";
import { getCookie, setCookie, removeCookie } from "@/utils/cookies";

// ================================================================
// Mock thư viện js-cookie
// Thay thế toàn bộ module js-cookie bằng mock functions
// để kiểm soát hành vi và verify các lời gọi
// ================================================================
jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Cast sang mock type để dùng mockReturnValue, toHaveBeenCalledWith
const mockGet = Cookies.get as jest.Mock;
const mockSet = Cookies.set as jest.Mock;
const mockRemove = Cookies.remove as jest.Mock;

// Reset tất cả mock sau mỗi test để tránh ảnh hưởng chéo
afterEach(() => {
  jest.clearAllMocks();
});

// ================================================================
// I. TEST SUITE: getCookie(key)
// Mô tả: Lấy giá trị cookie theo key, wrapper cho Cookies.get()
// ================================================================
describe("getCookie(key)", () => {

  // --- TC_CK_001: Lấy cookie tồn tại ---
  test("TC_CK_001: Lấy cookie tồn tại → trả về giá trị", () => {
    // Input: key = "token"
    // Mock: Cookies.get("token") trả về "abc123"
    // Expected: "abc123"
    mockGet.mockReturnValue("abc123");
    const result = getCookie("token");
    expect(result).toBe("abc123");
    expect(mockGet).toHaveBeenCalledWith("token");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  // --- TC_CK_002: Lấy cookie không tồn tại ---
  test("TC_CK_002: Lấy cookie không tồn tại → trả về undefined", () => {
    // Input: key = "nonexistent"
    // Mock: Cookies.get("nonexistent") trả về undefined
    // Expected: undefined
    mockGet.mockReturnValue(undefined);
    const result = getCookie("nonexistent");
    expect(result).toBeUndefined();
    expect(mockGet).toHaveBeenCalledWith("nonexistent");
  });

  // --- TC_CK_003: Lấy cookie có giá trị rỗng ---
  test("TC_CK_003: Lấy cookie có giá trị rỗng", () => {
    // Input: key = "empty"
    // Mock: Cookies.get("empty") trả về ""
    // Expected: ""
    mockGet.mockReturnValue("");
    const result = getCookie("empty");
    expect(result).toBe("");
    expect(mockGet).toHaveBeenCalledWith("empty");
  });

  // --- TC_CK_004: Lấy cookie có giá trị chứa ký tự đặc biệt ---
  test("TC_CK_004: Lấy cookie có giá trị chứa ký tự đặc biệt", () => {
    // Input: key = "data"
    // Mock: trả về chuỗi JSON
    // Expected: '{"user":"admin","role":"teacher"}'
    const jsonValue = '{"user":"admin","role":"teacher"}';
    mockGet.mockReturnValue(jsonValue);
    const result = getCookie("data");
    expect(result).toBe(jsonValue);
    expect(mockGet).toHaveBeenCalledWith("data");
  });

  // --- TC_CK_005: Lấy cookie có giá trị dài (JWT token) ---
  test("TC_CK_005: Lấy cookie có giá trị dài (JWT token)", () => {
    // Input: key = "jwt"
    // Expected: chuỗi JWT đầy đủ
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.rg2e3_abc";
    mockGet.mockReturnValue(jwt);
    const result = getCookie("jwt");
    expect(result).toBe(jwt);
    expect(mockGet).toHaveBeenCalledWith("jwt");
  });

  // --- TC_CK_006: Key là chuỗi rỗng ---
  test("TC_CK_006: Gọi getCookie với key rỗng", () => {
    // Input: key = ""
    // Expected: gọi Cookies.get("") và trả về kết quả
    mockGet.mockReturnValue(undefined);
    const result = getCookie("");
    expect(result).toBeUndefined();
    expect(mockGet).toHaveBeenCalledWith("");
  });

  // --- TC_CK_007: Verify chỉ gọi Cookies.get đúng 1 lần ---
  test("TC_CK_007: Verify getCookie gọi Cookies.get đúng 1 lần", () => {
    // Input: key = "session"
    // Expected: Cookies.get được gọi chính xác 1 lần
    mockGet.mockReturnValue("session_data");
    getCookie("session");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

// ================================================================
// II. TEST SUITE: setCookie(key, value, options?)
// Mô tả: Tạo/cập nhật cookie, wrapper cho Cookies.set()
// ================================================================
describe("setCookie(key, value, options?)", () => {

  // --- TC_CK_008: Set cookie cơ bản (không options) ---
  test("TC_CK_008: Set cookie cơ bản không có options", () => {
    // Input: key = "token", value = "abc123"
    // Expected: Cookies.set("token", "abc123", undefined)
    setCookie("token", "abc123");
    expect(mockSet).toHaveBeenCalledWith("token", "abc123", undefined);
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  // --- TC_CK_009: Set cookie với expires (số ngày) ---
  test("TC_CK_009: Set cookie với expires = 7 ngày", () => {
    // Input: key = "token", value = "abc", options = { expires: 7 }
    // Expected: Cookies.set gọi với options.expires = 7
    setCookie("token", "abc", { expires: 7 });
    expect(mockSet).toHaveBeenCalledWith("token", "abc", { expires: 7 });
  });

  // --- TC_CK_010: Set cookie với path ---
  test("TC_CK_010: Set cookie với path = '/'", () => {
    // Input: options = { path: "/" }
    // Expected: Cookies.set gọi với options.path = "/"
    setCookie("lang", "vi", { path: "/" });
    expect(mockSet).toHaveBeenCalledWith("lang", "vi", { path: "/" });
  });

  // --- TC_CK_011: Set cookie với nhiều options ---
  test("TC_CK_011: Set cookie với expires + path + secure", () => {
    // Input: options đầy đủ
    const options = { expires: 30, path: "/", secure: true };
    setCookie("session", "xyz", options);
    expect(mockSet).toHaveBeenCalledWith("session", "xyz", options);
  });

  // --- TC_CK_012: Set cookie với giá trị rỗng ---
  test("TC_CK_012: Set cookie với giá trị rỗng", () => {
    // Input: key = "empty", value = ""
    // Expected: Cookies.set("empty", "", undefined)
    setCookie("empty", "");
    expect(mockSet).toHaveBeenCalledWith("empty", "", undefined);
  });

  // --- TC_CK_013: Set cookie với giá trị chứa ký tự đặc biệt ---
  test("TC_CK_013: Set cookie với giá trị JSON", () => {
    // Input: value = '{"role":"admin"}'
    const jsonValue = '{"role":"admin"}';
    setCookie("userData", jsonValue);
    expect(mockSet).toHaveBeenCalledWith("userData", jsonValue, undefined);
  });

  // --- TC_CK_014: Set cookie với sameSite ---
  test("TC_CK_014: Set cookie với sameSite = 'lax'", () => {
    // Input: options = { sameSite: "lax" }
    setCookie("csrf", "token123", { sameSite: "lax" });
    expect(mockSet).toHaveBeenCalledWith("csrf", "token123", { sameSite: "lax" });
  });

  // --- TC_CK_015: Verify setCookie trả về giá trị từ Cookies.set ---
  test("TC_CK_015: Verify setCookie forward return value từ Cookies.set", () => {
    // Cookies.set trả về string | undefined
    mockSet.mockReturnValue("returned_value");
    const result = setCookie("key", "val");
    expect(result).toBe("returned_value");
  });
});

// ================================================================
// III. TEST SUITE: removeCookie(key)
// Mô tả: Xóa cookie theo key, wrapper cho Cookies.remove()
// ================================================================
describe("removeCookie(key)", () => {

  // --- TC_CK_016: Xóa cookie tồn tại ---
  test("TC_CK_016: Xóa cookie tồn tại", () => {
    // Input: key = "token"
    // Expected: Cookies.remove("token") được gọi
    removeCookie("token");
    expect(mockRemove).toHaveBeenCalledWith("token");
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  // --- TC_CK_017: Xóa cookie không tồn tại (không lỗi) ---
  test("TC_CK_017: Xóa cookie không tồn tại (không throw error)", () => {
    // Input: key = "nonexistent"
    // Expected: không throw error, gọi Cookies.remove bình thường
    expect(() => removeCookie("nonexistent")).not.toThrow();
    expect(mockRemove).toHaveBeenCalledWith("nonexistent");
  });

  // --- TC_CK_018: Xóa cookie với key rỗng ---
  test("TC_CK_018: Xóa cookie với key rỗng", () => {
    // Input: key = ""
    // Expected: Cookies.remove("") được gọi
    removeCookie("");
    expect(mockRemove).toHaveBeenCalledWith("");
  });

  // --- TC_CK_019: Verify removeCookie chỉ gọi Cookies.remove 1 lần ---
  test("TC_CK_019: Verify removeCookie gọi Cookies.remove đúng 1 lần", () => {
    removeCookie("session");
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  // --- TC_CK_020: Xóa nhiều cookie liên tiếp ---
  test("TC_CK_020: Xóa nhiều cookie liên tiếp", () => {
    // Gọi removeCookie 3 lần với key khác nhau
    removeCookie("token");
    removeCookie("session");
    removeCookie("user");
    expect(mockRemove).toHaveBeenCalledTimes(3);
    expect(mockRemove).toHaveBeenNthCalledWith(1, "token");
    expect(mockRemove).toHaveBeenNthCalledWith(2, "session");
    expect(mockRemove).toHaveBeenNthCalledWith(3, "user");
  });
});
