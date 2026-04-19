/**
 * Unit Test Script: getParams.ts
 *
 * Tệp kiểm thử: src/utils/getParams.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Hàm được kiểm thử:
 *   getParams(param: string): string | null
 *   - Lấy giá trị query parameter từ URL (window.location.search)
 *   - Trả về null nếu param không tồn tại
 *   - Trả về null nếu window undefined (môi trường SSR)
 *
 * Kỹ thuật mock:
 *   - Chạy trong Node environment (window = undefined mặc định)
 *   - Tự tạo global.window với location.search để giả lập browser
 *   - Reset module cache trước mỗi test để hàm đọc lại typeof window
 */

// ================================================================
// Setup: Mock window.location.search trong Node environment
// Trong Node, window không tồn tại → ta tự tạo/xóa global.window
// ================================================================

// Lưu reference window gốc (undefined trong Node)
const originalWindow = (global as any).window;

/**
 * Giả lập browser environment bằng cách tạo global.window
 * với location.search chứa query string mong muốn
 */
function mockBrowserWithSearch(search: string) {
  (global as any).window = {
    location: { search },
  };
}

/**
 * Xóa global.window để giả lập môi trường Server (SSR)
 */
function mockSSR() {
  delete (global as any).window;
}

/**
 * Load lại module getParams (reset cache) để hàm kiểm tra
 * typeof window tại thời điểm gọi, không dùng giá trị cached
 */
function loadGetParams() {
  jest.resetModules();
  return require("@/utils/getParams").getParams;
}

// Khôi phục trạng thái gốc sau mỗi test
afterEach(() => {
  if (originalWindow !== undefined) {
    (global as any).window = originalWindow;
  } else {
    delete (global as any).window;
  }
  jest.resetModules();
});

// ================================================================
// I. TEST SUITE: Truy xuất tham số URL thành công
// ================================================================
describe("getParams(param) - Truy xuất tham số URL", () => {

  // --- TC_GP_001: Lấy 1 param duy nhất ---
  test("TC_GP_001: Lấy param 'token' khi URL có 1 param", () => {
    // URL: ?token=abc123 → param "token" → "abc123"
    mockBrowserWithSearch("?token=abc123");
    const getParams = loadGetParams();
    expect(getParams("token")).toBe("abc123");
  });

  // --- TC_GP_002: Lấy param giữa nhiều params ---
  test("TC_GP_002: Lấy param 'page' khi URL có nhiều params", () => {
    // URL: ?keyword=react&page=2&limit=10 → param "page" → "2"
    mockBrowserWithSearch("?keyword=react&page=2&limit=10");
    const getParams = loadGetParams();
    expect(getParams("page")).toBe("2");
  });

  // --- TC_GP_003: Lấy param đầu tiên ---
  test("TC_GP_003: Lấy param đầu tiên 'keyword'", () => {
    // URL: ?keyword=react&page=2 → param "keyword" → "react"
    mockBrowserWithSearch("?keyword=react&page=2");
    const getParams = loadGetParams();
    expect(getParams("keyword")).toBe("react");
  });

  // --- TC_GP_004: Lấy param cuối cùng ---
  test("TC_GP_004: Lấy param cuối cùng 'limit'", () => {
    // URL: ?keyword=react&page=2&limit=10 → param "limit" → "10"
    mockBrowserWithSearch("?keyword=react&page=2&limit=10");
    const getParams = loadGetParams();
    expect(getParams("limit")).toBe("10");
  });

  // --- TC_GP_005: Ký tự encode (%40 = @) ---
  test("TC_GP_005: Lấy param có ký tự encode (%40 → @)", () => {
    // URL: ?email=test%40gmail.com → "test@gmail.com"
    mockBrowserWithSearch("?email=test%40gmail.com");
    const getParams = loadGetParams();
    expect(getParams("email")).toBe("test@gmail.com");
  });

  // --- TC_GP_006: Khoảng trắng encode (%20) ---
  test("TC_GP_006: Lấy param có khoảng trắng encode (%20)", () => {
    // URL: ?name=Nguyen%20Van%20A → "Nguyen Van A"
    mockBrowserWithSearch("?name=Nguyen%20Van%20A");
    const getParams = loadGetParams();
    expect(getParams("name")).toBe("Nguyen Van A");
  });

  // --- TC_GP_007: Param tồn tại, giá trị rỗng ---
  test("TC_GP_007: Param tồn tại nhưng giá trị rỗng (?token=)", () => {
    // URL: ?token= → "" (chuỗi rỗng, KHÔNG phải null)
    mockBrowserWithSearch("?token=");
    const getParams = loadGetParams();
    expect(getParams("token")).toBe("");
  });

  // --- TC_GP_008: Param chỉ key, không có = ---
  test("TC_GP_008: Param không có giá trị (?debug)", () => {
    // URL: ?debug → "" (URLSearchParams trả "" cho key không value)
    mockBrowserWithSearch("?debug");
    const getParams = loadGetParams();
    expect(getParams("debug")).toBe("");
  });

  // --- TC_GP_009: Giá trị số ---
  test("TC_GP_009: Param có giá trị số (?id=42)", () => {
    // URL: ?id=42 → "42" (string, không phải number)
    mockBrowserWithSearch("?id=42");
    const getParams = loadGetParams();
    expect(getParams("id")).toBe("42");
  });

  // --- TC_GP_010: Giá trị dài (JWT token) ---
  test("TC_GP_010: Param có giá trị dài (JWT token)", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123xyz";
    mockBrowserWithSearch(`?token=${jwt}`);
    const getParams = loadGetParams();
    expect(getParams("token")).toBe(jwt);
  });
});

// ================================================================
// II. TEST SUITE: Param không tồn tại → null
// ================================================================
describe("getParams(param) - Param không tồn tại", () => {

  // --- TC_GP_011: Key không tồn tại ---
  test("TC_GP_011: Param không tồn tại → null", () => {
    // URL: ?page=1 → param "token" → null
    mockBrowserWithSearch("?page=1");
    const getParams = loadGetParams();
    expect(getParams("token")).toBeNull();
  });

  // --- TC_GP_012: URL không có query string ---
  test("TC_GP_012: URL không có query string → null", () => {
    // URL: (rỗng) → param "token" → null
    mockBrowserWithSearch("");
    const getParams = loadGetParams();
    expect(getParams("token")).toBeNull();
  });

  // --- TC_GP_013: Phân biệt hoa/thường ---
  test("TC_GP_013: Param phân biệt HOA/thường (case-sensitive)", () => {
    // URL: ?Token=abc → param "token" (thường) → null
    mockBrowserWithSearch("?Token=abc");
    const getParams = loadGetParams();
    expect(getParams("token")).toBeNull();
  });

  // --- TC_GP_014: Input rỗng ---
  test("TC_GP_014: Input param là chuỗi rỗng → null", () => {
    // URL: ?token=abc → param "" → null
    mockBrowserWithSearch("?token=abc");
    const getParams = loadGetParams();
    expect(getParams("")).toBeNull();
  });
});

// ================================================================
// III. TEST SUITE: Môi trường server (SSR) → null
// ================================================================
describe("getParams(param) - Môi trường server (SSR)", () => {

  // --- TC_GP_015: window undefined → null ---
  test("TC_GP_015: Trả về null khi window undefined (SSR)", () => {
    // Giả lập SSR: không có window → hàm trả về null
    mockSSR();
    const getParams = loadGetParams();
    expect(getParams("token")).toBeNull();
  });
});
