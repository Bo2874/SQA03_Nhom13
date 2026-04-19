/**
 * Unit Test Script: validate.ts
 *
 * Tệp kiểm thử: src/constants/validate.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Kiểm thử 22 validation constants được sử dụng trong yup schema
 * khắp ứng dụng (RegisterForm, LoginForm, ResetPasswordForm, ...).
 *
 * Mục đích:
 *   - Regression test: đảm bảo không ai vô tình thay đổi message
 *   - Verify giá trị chính xác của từng constant
 *   - Verify tính nhất quán (kiểu dữ liệu, ngôn ngữ Tiếng Việt)
 *   - Verify template literal PASSWORD_MIN_LENGTH_MESSAGE liên kết đúng với MIN_PASSWORD_LENGTH
 */

import {
  MIN_PASSWORD_LENGTH,
  EMAIL_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  FIRST_NAME_REQUIRED_MESSAGE,
  LAST_NAME_REQUIRED_MESSAGE,
  FULL_NAME_REQUIRED_MESSAGE,
  CONFIRM_PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_CONFIRMATION_REQUIRED_MESSAGE,
  PASSWORD_CONFIRMATION_MATCH_MESSAGE,
  PHONE_NUMBER_REQUIRED_MESSAGE,
  PHONE_NUMBER_INVALID_MESSAGE,
  ADDRESS_REQUIRED_MESSAGE,
  PROVINCE_REQUIRED_MESSAGE,
  DISTRICT_REQUIRED_MESSAGE,
  WARD_REQUIRED_MESSAGE,
  ZIP_REQUIRED_MESSAGE,
  COUNTRY_REQUIRED_MESSAGE,
  PAYMENT_METHOD_MESSAGE,
  CURRENT_PASSWORD_CONFIRMATION_REQUIRED_MESSAGE,
  USER_AVATAR_URL_REQUIRED_MESSAGE,
} from "@/constants/validate";

// ================================================================
// I. TEST SUITE: MIN_PASSWORD_LENGTH
// Mô tả: Hằng số quy định độ dài tối thiểu mật khẩu
// ================================================================
describe("MIN_PASSWORD_LENGTH", () => {

  // --- TC_VL_001: Giá trị chính xác ---
  test("TC_VL_001: MIN_PASSWORD_LENGTH bằng 6", () => {
    // Expected: 6
    expect(MIN_PASSWORD_LENGTH).toBe(6);
  });

  // --- TC_VL_002: Kiểu dữ liệu là number ---
  test("TC_VL_002: Kiểu dữ liệu là number", () => {
    expect(typeof MIN_PASSWORD_LENGTH).toBe("number");
  });

  // --- TC_VL_003: Giá trị dương ---
  test("TC_VL_003: Giá trị dương (> 0)", () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
  });
});

// ================================================================
// II. TEST SUITE: Email validation messages
// ================================================================
describe("Email validation messages", () => {

  // --- TC_VL_004 ---
  test("TC_VL_004: EMAIL_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(EMAIL_REQUIRED_MESSAGE).toBe("Vui lòng nhập email");
  });

  // --- TC_VL_005 ---
  test("TC_VL_005: EMAIL_INVALID_MESSAGE đúng giá trị", () => {
    expect(EMAIL_INVALID_MESSAGE).toBe("Email không hợp lệ");
  });
});

// ================================================================
// III. TEST SUITE: Password validation messages
// ================================================================
describe("Password validation messages", () => {

  // --- TC_VL_006 ---
  test("TC_VL_006: PASSWORD_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(PASSWORD_REQUIRED_MESSAGE).toBe("Vui lòng nhập mật khẩu");
  });

  // --- TC_VL_007: Template literal sử dụng MIN_PASSWORD_LENGTH ---
  test("TC_VL_007: PASSWORD_MIN_LENGTH_MESSAGE chứa MIN_PASSWORD_LENGTH", () => {
    // Verify template literal: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`
    // Expected: "Mật khẩu phải có ít nhất 6 ký tự"
    expect(PASSWORD_MIN_LENGTH_MESSAGE).toBe("Mật khẩu phải có ít nhất 6 ký tự");
  });

  // --- TC_VL_008: PASSWORD_MIN_LENGTH_MESSAGE đồng bộ với MIN_PASSWORD_LENGTH ---
  test("TC_VL_008: PASSWORD_MIN_LENGTH_MESSAGE đồng bộ với MIN_PASSWORD_LENGTH", () => {
    // Kiểm tra message chứa đúng số từ MIN_PASSWORD_LENGTH
    expect(PASSWORD_MIN_LENGTH_MESSAGE).toContain(String(MIN_PASSWORD_LENGTH));
  });

  // --- TC_VL_009 ---
  test("TC_VL_009: CONFIRM_PASSWORD_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(CONFIRM_PASSWORD_REQUIRED_MESSAGE).toBe("Vui lòng nhập lại mật khẩu");
  });

  // --- TC_VL_010 ---
  test("TC_VL_010: PASSWORD_CONFIRMATION_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(PASSWORD_CONFIRMATION_REQUIRED_MESSAGE).toBe("Vui lòng xác nhận mật khẩu");
  });

  // --- TC_VL_011 ---
  test("TC_VL_011: PASSWORD_CONFIRMATION_MATCH_MESSAGE đúng giá trị", () => {
    expect(PASSWORD_CONFIRMATION_MATCH_MESSAGE).toBe("Mật khẩu không trùng khớp");
  });

  // --- TC_VL_012 ---
  test("TC_VL_012: CURRENT_PASSWORD_CONFIRMATION_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(CURRENT_PASSWORD_CONFIRMATION_REQUIRED_MESSAGE).toBe("Vui lòng nhập mật khẩu hiện tại");
  });
});

// ================================================================
// IV. TEST SUITE: Name validation messages
// ================================================================
describe("Name validation messages", () => {

  // --- TC_VL_013 ---
  test("TC_VL_013: FIRST_NAME_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(FIRST_NAME_REQUIRED_MESSAGE).toBe("Vui lòng nhập tên");
  });

  // --- TC_VL_014 ---
  test("TC_VL_014: LAST_NAME_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(LAST_NAME_REQUIRED_MESSAGE).toBe("Vui lòng nhập họ");
  });

  // --- TC_VL_015 ---
  test("TC_VL_015: FULL_NAME_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(FULL_NAME_REQUIRED_MESSAGE).toBe("Vui lòng nhập họ tên của bạn");
  });
});

// ================================================================
// V. TEST SUITE: Phone validation messages
// ================================================================
describe("Phone validation messages", () => {

  // --- TC_VL_016 ---
  test("TC_VL_016: PHONE_NUMBER_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(PHONE_NUMBER_REQUIRED_MESSAGE).toBe("Vui lòng nhập số điện thoại");
  });

  // --- TC_VL_017 ---
  test("TC_VL_017: PHONE_NUMBER_INVALID_MESSAGE đúng giá trị", () => {
    expect(PHONE_NUMBER_INVALID_MESSAGE).toBe("Số điện thoại không hợp lệ");
  });
});

// ================================================================
// VI. TEST SUITE: Address validation messages
// ================================================================
describe("Address validation messages", () => {

  // --- TC_VL_018 ---
  test("TC_VL_018: ADDRESS_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(ADDRESS_REQUIRED_MESSAGE).toBe("Vui lòng nhập địa chỉ chi tiết");
  });

  // --- TC_VL_019 ---
  test("TC_VL_019: PROVINCE_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(PROVINCE_REQUIRED_MESSAGE).toBe("Vui lòng nhập Tỉnh/Thành phố");
  });

  // --- TC_VL_020 ---
  test("TC_VL_020: DISTRICT_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(DISTRICT_REQUIRED_MESSAGE).toBe("Vui lòng nhập Quận/Huyện");
  });

  // --- TC_VL_021 ---
  test("TC_VL_021: WARD_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(WARD_REQUIRED_MESSAGE).toBe("Vui lòng nhập Phường/Xã");
  });

  // --- TC_VL_022 ---
  test("TC_VL_022: ZIP_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(ZIP_REQUIRED_MESSAGE).toBe("Vui lòng nhập mã zip");
  });

  // --- TC_VL_023 ---
  test("TC_VL_023: COUNTRY_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(COUNTRY_REQUIRED_MESSAGE).toBe("Vui lòng chọn đất nước của bạn");
  });
});

// ================================================================
// VII. TEST SUITE: Other validation messages
// ================================================================
describe("Other validation messages", () => {

  // --- TC_VL_024 ---
  test("TC_VL_024: PAYMENT_METHOD_MESSAGE đúng giá trị", () => {
    expect(PAYMENT_METHOD_MESSAGE).toBe("Vui lòng chọn phương thức thanh toán");
  });

  // --- TC_VL_025 ---
  test("TC_VL_025: USER_AVATAR_URL_REQUIRED_MESSAGE đúng giá trị", () => {
    expect(USER_AVATAR_URL_REQUIRED_MESSAGE).toBe("Vui lòng chọn ảnh");
  });
});

// ================================================================
// VIII. TEST SUITE: Tính nhất quán (Consistency checks)
// Mô tả: Kiểm tra tất cả messages đều là string không rỗng
//         và đều hiển thị bằng Tiếng Việt
// ================================================================
describe("Tính nhất quán của tất cả validation messages", () => {

  // Tập hợp tất cả message constants để test hàng loạt
  const allMessages = {
    EMAIL_REQUIRED_MESSAGE,
    EMAIL_INVALID_MESSAGE,
    PASSWORD_REQUIRED_MESSAGE,
    FIRST_NAME_REQUIRED_MESSAGE,
    LAST_NAME_REQUIRED_MESSAGE,
    FULL_NAME_REQUIRED_MESSAGE,
    CONFIRM_PASSWORD_REQUIRED_MESSAGE,
    PASSWORD_MIN_LENGTH_MESSAGE,
    PASSWORD_CONFIRMATION_REQUIRED_MESSAGE,
    PASSWORD_CONFIRMATION_MATCH_MESSAGE,
    PHONE_NUMBER_REQUIRED_MESSAGE,
    PHONE_NUMBER_INVALID_MESSAGE,
    ADDRESS_REQUIRED_MESSAGE,
    PROVINCE_REQUIRED_MESSAGE,
    DISTRICT_REQUIRED_MESSAGE,
    WARD_REQUIRED_MESSAGE,
    ZIP_REQUIRED_MESSAGE,
    COUNTRY_REQUIRED_MESSAGE,
    PAYMENT_METHOD_MESSAGE,
    CURRENT_PASSWORD_CONFIRMATION_REQUIRED_MESSAGE,
    USER_AVATAR_URL_REQUIRED_MESSAGE,
  };

  // --- TC_VL_026: Tất cả đều là string ---
  test("TC_VL_026: Tất cả messages đều là kiểu string", () => {
    Object.entries(allMessages).forEach(([name, value]) => {
      expect(typeof value).toBe("string");
    });
  });

  // --- TC_VL_027: Không có message rỗng ---
  test("TC_VL_027: Không có message nào là chuỗi rỗng", () => {
    Object.entries(allMessages).forEach(([name, value]) => {
      expect(value.length).toBeGreaterThan(0);
    });
  });

  // --- TC_VL_028: Tất cả đều chứa ký tự Tiếng Việt (có dấu) ---
  test("TC_VL_028: Tất cả messages đều bằng Tiếng Việt (chứa dấu)", () => {
    // Regex kiểm tra có ít nhất 1 ký tự tiếng Việt có dấu
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    Object.entries(allMessages).forEach(([name, value]) => {
      expect(value).toMatch(vietnameseRegex);
    });
  });

  // --- TC_VL_029: Tổng số constants đúng 22 ---
  test("TC_VL_029: Tổng cộng 22 constants (1 number + 21 messages)", () => {
    // 21 messages + 1 MIN_PASSWORD_LENGTH = 22 exports
    expect(Object.keys(allMessages).length).toBe(21); // 21 messages
    expect(MIN_PASSWORD_LENGTH).toBeDefined(); // + 1 number = 22 total
  });
});
