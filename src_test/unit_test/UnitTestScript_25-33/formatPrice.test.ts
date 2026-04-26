/**
 * Unit Test Script: formatPrice.ts
 *
 * Tệp kiểm thử: src/utils/formatPrice.ts
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 *   1. formatPrice(price)         - Format số thành chuỗi tiền VNĐ
 *   2. calculateCurrentPrice(price, discount) - Tính giá sau giảm
 *   3. calculateDiscountPrice(price, currentPrice) - Tính số tiền được giảm
 */

import {
  formatPrice,
  calculateCurrentPrice,
  calculateDiscountPrice,
} from "@/utils/formatPrice";

// ================================================================
// I. TEST SUITE: formatPrice(price)
// Mô tả: Chuyển đổi số thành chuỗi tiền tệ Việt Nam (VNĐ)
// Regex: thêm dấu "." ngăn cách hàng nghìn + hậu tố "đ"
// ================================================================
describe("formatPrice(price)", () => {

  // --- TC_FP_001: Giá trị dương bình thường ---
  test("TC_FP_001: Format giá trị dương bình thường (100000)", () => {
    // Input: 100000
    // Expected: "100.000đ"
    const result = formatPrice(100000);
    expect(result).toBe("100.000đ");
  });

  // --- TC_FP_002: Giá trị nhỏ (không cần dấu chấm phân cách) ---
  test("TC_FP_002: Format giá trị nhỏ dưới 1000 (500)", () => {
    // Input: 500
    // Expected: "500đ" (không có dấu chấm)
    const result = formatPrice(500);
    expect(result).toBe("500đ");
  });

  // --- TC_FP_003: Giá trị bằng 0 ---
  test("TC_FP_003: Format giá trị bằng 0", () => {
    // Input: 0
    // Expected: "0đ"
    const result = formatPrice(0);
    expect(result).toBe("0đ");
  });

  // --- TC_FP_004: Giá trị lớn (hàng triệu) ---
  test("TC_FP_004: Format giá trị hàng triệu (1500000)", () => {
    // Input: 1500000
    // Expected: "1.500.000đ"
    const result = formatPrice(1500000);
    expect(result).toBe("1.500.000đ");
  });

  // --- TC_FP_005: Giá trị hàng tỷ ---
  test("TC_FP_005: Format giá trị hàng tỷ (1000000000)", () => {
    // Input: 1000000000
    // Expected: "1.000.000.000đ"
    const result = formatPrice(1000000000);
    expect(result).toBe("1.000.000.000đ");
  });

  // --- TC_FP_006: Giá trị âm ---
  test("TC_FP_006: Format giá trị âm (-50000)", () => {
    // Input: -50000
    // Expected: "-50.000đ"
    const result = formatPrice(-50000);
    expect(result).toBe("-50.000đ");
  });

  // --- TC_FP_007: Giá trị thập phân ---
  test("TC_FP_007: Format giá trị thập phân (1234.56)", () => {
    // Input: 1234.56
    // Expected: "1.234.56đ" (regex chỉ xử lý phần nguyên)
    const result = formatPrice(1234.56);
    expect(result).toBe("1.234.56đ");
  });

  // --- TC_FP_008: Giá trị đúng 1000 (biên) ---
  test("TC_FP_008: Format giá trị biên 1000", () => {
    // Input: 1000
    // Expected: "1.000đ"
    const result = formatPrice(1000);
    expect(result).toBe("1.000đ");
  });

  // --- TC_FP_009: Giá trị 999 (dưới biên 1000) ---
  test("TC_FP_009: Format giá trị 999 (không cần dấu chấm)", () => {
    // Input: 999
    // Expected: "999đ"
    const result = formatPrice(999);
    expect(result).toBe("999đ");
  });

  // --- TC_FP_010: Giá trị 1 ---
  test("TC_FP_010: Format giá trị nhỏ nhất 1", () => {
    // Input: 1
    // Expected: "1đ"
    const result = formatPrice(1);
    expect(result).toBe("1đ");
  });
});

// ================================================================
// II. TEST SUITE: calculateCurrentPrice(price, discount)
// Mô tả: Tính giá hiện tại sau khi áp dụng phần trăm giảm giá
// Công thức: price * (1 - discount / 100), làm tròn 0 chữ số thập phân
// ================================================================
describe("calculateCurrentPrice(price, discount)", () => {

  // --- TC_CCP_001: Giảm giá bình thường 10% ---
  test("TC_CCP_001: Giảm giá 10% cho sản phẩm 100000", () => {
    // Input: price=100000, discount=10
    // Expected: 100000 * (1 - 10/100) = 90000
    const result = calculateCurrentPrice(100000, 10);
    expect(result).toBe(90000);
  });

  // --- TC_CCP_002: Giảm giá 50% ---
  test("TC_CCP_002: Giảm giá 50% cho sản phẩm 200000", () => {
    // Input: price=200000, discount=50
    // Expected: 200000 * 0.5 = 100000
    const result = calculateCurrentPrice(200000, 50);
    expect(result).toBe(100000);
  });

  // --- TC_CCP_003: Giảm giá 0% (không giảm) ---
  test("TC_CCP_003: Giảm giá 0% (giữ nguyên giá)", () => {
    // Input: price=150000, discount=0
    // Expected: 150000 * 1.0 = 150000
    const result = calculateCurrentPrice(150000, 0);
    expect(result).toBe(150000);
  });

  // --- TC_CCP_004: Giảm giá 100% (miễn phí) ---
  test("TC_CCP_004: Giảm giá 100% (miễn phí)", () => {
    // Input: price=100000, discount=100
    // Expected: 100000 * 0 = 0
    const result = calculateCurrentPrice(100000, 100);
    expect(result).toBe(0);
  });

  // --- TC_CCP_005: Giảm giá với kết quả lẻ (cần làm tròn) ---
  test("TC_CCP_005: Giảm giá 15% cho 99000 (kiểm tra làm tròn)", () => {
    // Input: price=99000, discount=15
    // Expected: 99000 * 0.85 = 84150
    const result = calculateCurrentPrice(99000, 15);
    expect(result).toBe(84150);
  });

  // --- TC_CCP_006: Giảm giá 33.33% (phần trăm thập phân) ---
  test("TC_CCP_006: Giảm giá 33.33% cho 300000", () => {
    // Input: price=300000, discount=33.33
    // Expected: 300000 * (1 - 0.3333) = 300000 * 0.6667 = 200010
    const result = calculateCurrentPrice(300000, 33.33);
    expect(result).toBe(200010);
  });

  // --- TC_CCP_007: Giá bằng 0 ---
  test("TC_CCP_007: Giá gốc bằng 0", () => {
    // Input: price=0, discount=50
    // Expected: 0 * 0.5 = 0
    const result = calculateCurrentPrice(0, 50);
    expect(result).toBe(0);
  });

  // --- TC_CCP_008: Giảm giá 1% (biên nhỏ) ---
  test("TC_CCP_008: Giảm giá 1% cho 10000", () => {
    // Input: price=10000, discount=1
    // Expected: 10000 * 0.99 = 9900
    const result = calculateCurrentPrice(10000, 1);
    expect(result).toBe(9900);
  });

  // --- TC_CCP_009: Giảm giá 99% (biên lớn) ---
  test("TC_CCP_009: Giảm giá 99% cho 1000000", () => {
    // Input: price=1000000, discount=99
    // Expected: 1000000 * 0.01 = 10000
    const result = calculateCurrentPrice(1000000, 99);
    expect(result).toBe(10000);
  });

  // --- TC_CCP_010: Giá nhỏ, giảm giá lớn (kiểm tra làm tròn) ---
  test("TC_CCP_010: Giá nhỏ 7 giảm 30% (kiểm tra làm tròn)", () => {
    // Input: price=7, discount=30
    // Expected: 7 * 0.7 = 4.9 → toFixed(0) → parseFloat = 5
    const result = calculateCurrentPrice(7, 30);
    expect(result).toBe(5);
  });
});

// ================================================================
// III. TEST SUITE: calculateDiscountPrice(price, currentPrice)
// Mô tả: Tính số tiền được giảm = giá gốc - giá hiện tại
// Công thức: (price - currentPrice), làm tròn 0 chữ số thập phân
// ================================================================
describe("calculateDiscountPrice(price, currentPrice)", () => {

  // --- TC_CDP_001: Tính tiền giảm bình thường ---
  test("TC_CDP_001: Tính tiền giảm (100000 - 90000)", () => {
    // Input: price=100000, currentPrice=90000
    // Expected: 100000 - 90000 = 10000
    const result = calculateDiscountPrice(100000, 90000);
    expect(result).toBe(10000);
  });

  // --- TC_CDP_002: Không giảm giá (giá gốc = giá hiện tại) ---
  test("TC_CDP_002: Không giảm giá (giá gốc = giá hiện tại)", () => {
    // Input: price=50000, currentPrice=50000
    // Expected: 0
    const result = calculateDiscountPrice(50000, 50000);
    expect(result).toBe(0);
  });

  // --- TC_CDP_003: Giảm 100% (giá hiện tại = 0) ---
  test("TC_CDP_003: Giảm 100% (giá hiện tại = 0)", () => {
    // Input: price=200000, currentPrice=0
    // Expected: 200000
    const result = calculateDiscountPrice(200000, 0);
    expect(result).toBe(200000);
  });

  // --- TC_CDP_004: Giá gốc bằng 0 ---
  test("TC_CDP_004: Giá gốc bằng 0", () => {
    // Input: price=0, currentPrice=0
    // Expected: 0
    const result = calculateDiscountPrice(0, 0);
    expect(result).toBe(0);
  });

  // --- TC_CDP_005: Giá hiện tại > giá gốc (trường hợp bất thường) ---
  test("TC_CDP_005: Giá hiện tại > giá gốc (trả về số âm)", () => {
    // Input: price=50000, currentPrice=70000
    // Expected: 50000 - 70000 = -20000
    const result = calculateDiscountPrice(50000, 70000);
    expect(result).toBe(-20000);
  });

  // --- TC_CDP_006: Giá trị lớn (hàng triệu) ---
  test("TC_CDP_006: Tính tiền giảm cho giá trị lớn", () => {
    // Input: price=5000000, currentPrice=3500000
    // Expected: 1500000
    const result = calculateDiscountPrice(5000000, 3500000);
    expect(result).toBe(1500000);
  });

  // --- TC_CDP_007: Giá trị thập phân (kiểm tra làm tròn) ---
  test("TC_CDP_007: Giá trị thập phân (kiểm tra toFixed(0))", () => {
    // Input: price=100.7, currentPrice=50.3
    // Expected: 100.7 - 50.3 = 50.4 → toFixed(0) → "50" → parseFloat = 50
    const result = calculateDiscountPrice(100.7, 50.3);
    expect(result).toBe(50);
  });
});
