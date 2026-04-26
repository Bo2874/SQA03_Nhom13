/**
 * Unit Test Script: http.ts (Admin Panel)
 *
 * Tệp kiểm thử: src/api/httpInterceptors.ts (tách từ http.ts)
 * Framework: Jest + ts-jest (jsdom environment)
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 *   1. responseSuccessHandler(response)  - Trả response nguyên vẹn
 *   2. responseErrorHandler(error)       - Xử lý lỗi: 401 redirect, extract message
 *
 * Config gốc http.ts (kiểm tra gián tiếp):
 *   - baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
 *   - timeout: 30000
 *   - headers: { 'Content-Type': 'application/json' }
 *   - withCredentials: true
 *
 * Kỹ thuật:
 *   - Interceptor logic tách ra httpInterceptors.ts (không có import.meta.env)
 *   - Import trực tiếp, không cần mock
 *   - jsdom environment cho window.location
 *
 */

// Chạy trong Node env — mock window thủ công cho 401 test
const { responseSuccessHandler, responseErrorHandler } = require("../api/httpInterceptors");

// ================================================================
// I. TEST SUITE: responseSuccessHandler
// Mô tả: Trả response nguyên vẹn (khác frontend: không extract .data)
// ================================================================
describe("responseSuccessHandler(response)", () => {

  // --- TC_HT_001: Trả response nguyên vẹn ---
  test("TC_HT_001: Trả về full response (không extract .data)", () => {
    // Input: response { status, data, headers }
    // Expected: trả lại chính response đó
    const response = {
      status: 200,
      data: { message: "OK", result: [{ id: 1 }] },
      headers: {},
    };
    const result = responseSuccessHandler(response);
    expect(result).toBe(response);
  });

  // --- TC_HT_002: Response 201 ---
  test("TC_HT_002: Response 201 Created → trả nguyên vẹn", () => {
    const response = { status: 201, data: { result: { id: 99 } } };
    expect(responseSuccessHandler(response).status).toBe(201);
  });

  // --- TC_HT_003: Response data null ---
  test("TC_HT_003: Response data null → trả nguyên vẹn", () => {
    const response = { status: 204, data: null };
    expect(responseSuccessHandler(response).data).toBeNull();
  });
});

// ================================================================
// II. TEST SUITE: responseErrorHandler — 401 Redirect
// Mô tả: 401 → redirect window.location.href = '/login' + reject
// ================================================================
describe("responseErrorHandler - 401 Redirect", () => {

  // --- TC_HT_004: 401 → gán window.location.href = '/login' ---
  test("TC_HT_004: HTTP 401 → gán window.location.href = '/login'", async () => {
    // Mock window.location trong Node env
    const mockLocation = { href: "" };
    (global as any).window = { location: mockLocation };

    const error = {
      response: { status: 401, data: { message: "Unauthorized" } },
      message: "401",
    };
    try {
      await responseErrorHandler(error);
    } catch (e) {}
    expect(mockLocation.href).toBe("/login");

    delete (global as any).window;
  });

  // --- TC_HT_005: 401 → reject Error ---
  test("TC_HT_005: 401 → Promise.reject(Error)", async () => {
    (global as any).window = { location: { href: "" } };
    const error = {
      response: { status: 401, data: { message: "Token expired" } },
      message: "Unauthorized",
    };
    await expect(responseErrorHandler(error)).rejects.toBeInstanceOf(Error);
    delete (global as any).window;
  });

  // --- TC_HT_006: 401 extract message từ data ---
  test("TC_HT_006: 401 extract message 'Phiên hết hạn'", async () => {
    (global as any).window = { location: { href: "" } };
    const error = {
      response: { status: 401, data: { message: "Phiên hết hạn" } },
      message: "Unauthorized",
    };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Phiên hết hạn");
    }
    delete (global as any).window;
  });
});

// ================================================================
// III. TEST SUITE: responseErrorHandler — Other Errors
// ================================================================
describe("responseErrorHandler - Other Errors", () => {

  // --- TC_HT_007: Backend message ---
  test("TC_HT_007: Error data.message → dùng message đó", async () => {
    const error = {
      response: { status: 400, data: { message: "Email đã tồn tại" } },
      message: "Bad Request",
    };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Email đã tồn tại");
    }
  });

  // --- TC_HT_008: Không có data.message → dùng error.message ---
  test("TC_HT_008: Không data.message → error.message", async () => {
    const error = {
      response: { status: 500, data: {} },
      message: "Internal Server Error",
    };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Internal Server Error");
    }
  });

  // --- TC_HT_009: Không có gì → fallback 'Có lỗi xảy ra' ---
  test("TC_HT_009: Không message → 'Có lỗi xảy ra'", async () => {
    const error = {};
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Có lỗi xảy ra");
    }
  });

  // --- TC_HT_010: 403 KHÔNG redirect ---
  test("TC_HT_010: HTTP 403 → KHÔNG redirect /login", async () => {
    const mockLocation = { href: "" };
    (global as any).window = { location: mockLocation };
    const error = {
      response: { status: 403, data: { message: "Forbidden" } },
      message: "Forbidden",
    };
    try {
      await responseErrorHandler(error);
    } catch (e) {}
    // 403 không trigger redirect (chỉ 401)
    expect(mockLocation.href).not.toBe("/login");
    delete (global as any).window;
  });

  // --- TC_HT_011: 404 ---
  test("TC_HT_011: HTTP 404 message", async () => {
    const error = {
      response: { status: 404, data: { message: "Không tìm thấy" } },
      message: "Not Found",
    };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Không tìm thấy");
    }
  });

  // --- TC_HT_012: Network error (no response) ---
  test("TC_HT_012: Network error → error.message", async () => {
    const error = { message: "Network Error" };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Network Error");
    }
  });

  // --- TC_HT_013: Reject luôn là Error instance ---
  test("TC_HT_013: Reject luôn là Error instance", async () => {
    const error = { response: { status: 500, data: {} }, message: "err" };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  // --- TC_HT_014: Error chỉ có response.data.message (không có error.message) ---
  test("TC_HT_014: Chỉ có data.message, không có error.message", async () => {
    const error = {
      response: { status: 422, data: { message: "Dữ liệu không hợp lệ" } },
    };
    try {
      await responseErrorHandler(error);
    } catch (e: any) {
      expect(e.message).toBe("Dữ liệu không hợp lệ");
    }
  });
});
