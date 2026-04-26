/**
 * Unit Test Script: axios.ts
 *
 * Tệp kiểm thử: src/config/axios.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Đối tượng kiểm thử:
 *   axiosRequest — Axios instance được cấu hình cho E-Learning app
 *
 * Các khía cạnh cần test:
 *   1. Instance config: baseURL, withCredentials, paramsSerializer
 *   2. Request interceptor: pass-through config
 *   3. Response interceptor (success): trả về response.data
 *   4. Response interceptor (401): reject error
 *   5. Response interceptor (network error): message "Network error..."
 *   6. Response interceptor (other error): trả message từ backend
 *
 * Kỹ thuật mock:
 *   - Mock module axios bằng jest.mock()
 *   - Capture các callback interceptor qua mock interceptors.use()
 *   - Gọi trực tiếp callback để test logic xử lý
 */

import axios, { AxiosError } from "axios";

// ================================================================
// Mock axios module
// Tạo mock instance với interceptors.use() capture callbacks
// ================================================================

// Lưu trữ interceptor callbacks để gọi trực tiếp trong test
let requestFulfilled: Function;
let requestRejected: Function;
let responseFulfilled: Function;
let responseRejected: Function;

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");
  return {
    ...actualAxios,
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn((fulfilled, rejected) => {
            requestFulfilled = fulfilled;
            requestRejected = rejected;
          }),
        },
        response: {
          use: jest.fn((fulfilled, rejected) => {
            responseFulfilled = fulfilled;
            responseRejected = rejected;
          }),
        },
      },
      defaults: {
        baseURL: "http://localhost:3000/api/v1",
        withCredentials: true,
      },
    })),
    isAxiosError: actualAxios.isAxiosError,
  };
});

// Import sau khi mock — sẽ trigger axios.create() và interceptors.use()
import axiosRequest from "@/config/axios";

// ================================================================
// I. TEST SUITE: Cấu hình Axios instance
// ================================================================
describe("Axios instance configuration", () => {

  // --- TC_AX_001: axios.create được gọi với baseURL đúng ---
  test("TC_AX_001: axios.create được gọi với baseURL = 'http://localhost:3000/api/v1'", () => {
    // Expected: axios.create() nhận config chứa baseURL
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "http://localhost:3000/api/v1",
      })
    );
  });

  // --- TC_AX_002: withCredentials = true ---
  test("TC_AX_002: withCredentials = true (gửi cookie tự động)", () => {
    // Expected: config có withCredentials: true để gửi httpOnly cookie
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        withCredentials: true,
      })
    );
  });

  // --- TC_AX_003: paramsSerializer được cấu hình ---
  test("TC_AX_003: paramsSerializer được cấu hình", () => {
    // Expected: config có paramsSerializer.serialize function
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paramsSerializer: expect.objectContaining({
          serialize: expect.any(Function),
        }),
      })
    );
  });

  // --- TC_AX_004: axiosRequest được export ---
  test("TC_AX_004: axiosRequest được export là object", () => {
    expect(axiosRequest).toBeDefined();
    expect(typeof axiosRequest).toBe("object");
  });

  // --- TC_AX_005: Interceptors được đăng ký ---
  test("TC_AX_005: Request và Response interceptors đều được đăng ký", () => {
    // Verify interceptors.use() được gọi
    expect(requestFulfilled).toBeDefined();
    expect(requestRejected).toBeDefined();
    expect(responseFulfilled).toBeDefined();
    expect(responseRejected).toBeDefined();
  });
});

// ================================================================
// II. TEST SUITE: Request Interceptor
// Mô tả: Pass-through — chỉ trả lại config, không thêm header
// ================================================================
describe("Request Interceptor", () => {

  // --- TC_AX_006: Pass-through config ---
  test("TC_AX_006: Request interceptor trả lại config nguyên vẹn", () => {
    // Input: config object bất kỳ
    // Expected: trả lại chính config đó (pass-through)
    const config = {
      url: "/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    const result = requestFulfilled(config);
    expect(result).toEqual(config);
  });

  // --- TC_AX_007: Không thêm Authorization header ---
  test("TC_AX_007: Không thêm Authorization header (dùng cookie)", () => {
    // Backend đọc JWT từ httpOnly cookie, không cần header
    const config = { url: "/courses", headers: {} };
    const result = requestFulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  // --- TC_AX_008: Request error → reject ---
  test("TC_AX_008: Request error → Promise.reject", async () => {
    // Input: error object
    // Expected: Promise.reject(error)
    const error = new Error("Request setup failed");
    await expect(requestRejected(error)).rejects.toThrow("Request setup failed");
  });
});

// ================================================================
// III. TEST SUITE: Response Interceptor — Success
// Mô tả: Trả về response.data (extract từ response wrapper)
// ================================================================
describe("Response Interceptor - Success", () => {

  // --- TC_AX_009: Trả về response.data ---
  test("TC_AX_009: Trả về response.data thay vì full response", () => {
    // Input: full Axios response { data: { message, result } }
    // Expected: chỉ trả { message, result } (response.data)
    const response = {
      status: 200,
      headers: {},
      config: {},
      data: {
        message: "Success",
        result: { id: 1, name: "Course 1" },
      },
    };
    const result = responseFulfilled(response);
    expect(result).toEqual({
      message: "Success",
      result: { id: 1, name: "Course 1" },
    });
  });

  // --- TC_AX_010: Trả về response.data với array result ---
  test("TC_AX_010: Trả về response.data chứa array", () => {
    const response = {
      data: {
        message: "OK",
        result: [{ id: 1 }, { id: 2 }],
      },
    };
    const result = responseFulfilled(response);
    expect(result.result).toHaveLength(2);
  });

  // --- TC_AX_011: Trả về response.data rỗng ---
  test("TC_AX_011: Trả về response.data khi data là null", () => {
    const response = { data: null };
    const result = responseFulfilled(response);
    expect(result).toBeNull();
  });
});

// ================================================================
// IV. TEST SUITE: Response Interceptor — Error 401
// Mô tả: Unauthorized → reject error (không redirect)
// ================================================================
describe("Response Interceptor - Error 401", () => {

  // --- TC_AX_012: 401 → reject error ---
  test("TC_AX_012: HTTP 401 → Promise.reject(error)", async () => {
    // Input: error với status 401
    // Expected: reject mà không crash
    const error = {
      response: { status: 401, data: { message: "Unauthorized" } },
      isAxiosError: true,
    };
    await expect(responseRejected(error)).rejects.toBeDefined();
  });

  // --- TC_AX_013: 401 → reject chính error gốc ---
  test("TC_AX_013: 401 → reject với error gốc (không wrap)", async () => {
    const error = {
      response: { status: 401, data: { message: "Token expired" } },
    };
    try {
      await responseRejected(error);
    } catch (e) {
      // 401 trả về error gốc, không wrap thành new Error()
      expect(e).toBe(error);
    }
  });
});

// ================================================================
// V. TEST SUITE: Response Interceptor — Network Error
// ================================================================
describe("Response Interceptor - Network Error", () => {

  // --- TC_AX_014: Network error → message cụ thể ---
  test("TC_AX_014: Network error → 'Network error. Please check your connection.'", async () => {
    // Input: AxiosError với code ERR_NETWORK
    const error = new AxiosError(
      "Network Error",
      AxiosError.ERR_NETWORK
    );
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("Network error. Please check your connection.");
    }
  });
});

// ================================================================
// VI. TEST SUITE: Response Interceptor — Other Errors
// ================================================================
describe("Response Interceptor - Other Errors", () => {

  // --- TC_AX_015: Error có message từ backend ---
  test("TC_AX_015: Trả về message lỗi từ backend", async () => {
    // Input: error.response.data.message = "Email already exists"
    const error = {
      response: {
        status: 400,
        data: { message: "Email already exists" },
      },
    };
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("Email already exists");
    }
  });

  // --- TC_AX_016: Error không có message → fallback ---
  test("TC_AX_016: Error không có message → 'An error occurred'", async () => {
    // Input: error.response.data không có message
    const error = {
      response: {
        status: 500,
        data: {},
      },
    };
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("An error occurred");
    }
  });

  // --- TC_AX_017: Error không có response (timeout, etc.) ---
  test("TC_AX_017: Error không có response → 'An error occurred'", async () => {
    // Input: error không có response property
    const error = { code: "ECONNABORTED" };
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("An error occurred");
    }
  });

  // --- TC_AX_018: Error 403 Forbidden ---
  test("TC_AX_018: HTTP 403 → trả message từ backend", async () => {
    const error = {
      response: {
        status: 403,
        data: { message: "Access denied" },
      },
    };
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("Access denied");
    }
  });

  // --- TC_AX_019: Error 404 Not Found ---
  test("TC_AX_019: HTTP 404 → trả message từ backend", async () => {
    const error = {
      response: {
        status: 404,
        data: { message: "Course not found" },
      },
    };
    try {
      await responseRejected(error);
    } catch (e: any) {
      expect(e.message).toBe("Course not found");
    }
  });
});

// ================================================================
// VII. TEST SUITE: paramsSerializer
// ================================================================
describe("paramsSerializer", () => {

  // --- TC_AX_020: Verify serialize function tồn tại ---
  test("TC_AX_020: paramsSerializer.serialize là function", () => {
    const createCall = (axios.create as jest.Mock).mock.calls[0][0];
    expect(typeof createCall.paramsSerializer.serialize).toBe("function");
  });

  // --- TC_AX_021: Serialize params cơ bản ---
  test("TC_AX_021: Serialize params đơn giản", () => {
    const createCall = (axios.create as jest.Mock).mock.calls[0][0];
    const serialize = createCall.paramsSerializer.serialize;
    // Input: { page: 1, limit: 10 }
    // Expected: "page=1&limit=10"
    const result = serialize({ page: 1, limit: 10 });
    expect(result).toContain("page=1");
    expect(result).toContain("limit=10");
  });

  // --- TC_AX_022: Serialize array params (indices format) ---
  test("TC_AX_022: Serialize array params với indices format", () => {
    const createCall = (axios.create as jest.Mock).mock.calls[0][0];
    const serialize = createCall.paramsSerializer.serialize;
    // Input: { ids: [1, 2, 3] }
    // Expected: chứa ids[0]=1 (có thể URL-encoded: ids%5B0%5D=1)
    const result = serialize({ ids: [1, 2, 3] });
    const decoded = decodeURIComponent(result);
    expect(decoded).toContain("ids[0]=1");
    expect(decoded).toContain("ids[1]=2");
    expect(decoded).toContain("ids[2]=3");
  });

  // --- TC_AX_023: Serialize nested params (allowDots) ---
  test("TC_AX_023: Serialize nested params với dot notation", () => {
    const createCall = (axios.create as jest.Mock).mock.calls[0][0];
    const serialize = createCall.paramsSerializer.serialize;
    // Input: { filter: { status: "ACTIVE" } }
    // Expected: "filter.status=ACTIVE" (allowDots: true)
    const result = serialize({ filter: { status: "ACTIVE" } });
    expect(result).toContain("filter.status=ACTIVE");
  });
});
