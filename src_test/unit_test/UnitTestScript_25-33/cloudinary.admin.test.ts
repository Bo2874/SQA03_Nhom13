/**
 * Unit Test Script: cloudinary.ts (Admin Panel)
 *
 * Tệp kiểm thử: src/utils/cloudinary.ts (elearning-admin)
 * Framework: Jest + ts-jest
 * Tác giả: Nhóm 13 - SQA03
 *
 * Các hàm được kiểm thử:
 *   1. formatFileSize(bytes)            - Format bytes → chuỗi dễ đọc
 *   2. isValidImageFile(file)           - Kiểm tra file có phải ảnh hợp lệ
 *   3. isValidFileSize(file, maxSizeMB) - Kiểm tra kích thước file
 *
 * Lưu ý: uploadImageToCloudinary dùng import.meta.env (Vite-specific)
 * không thể import trực tiếp trong Jest. Hàm này cần test bằng
 * Integration test hoặc E2E test với Vite environment.
 *
 * Kỹ thuật: 3 pure functions đã tách ra fileValidation.ts
 * để import bình thường trong Jest (không dính import.meta.env)
 */

import {
  formatFileSize,
  isValidImageFile,
  isValidFileSize,
} from "../utils/fileValidation";

// ================================================================
// I. TEST SUITE: formatFileSize(bytes)
// Mô tả: Chuyển đổi bytes → chuỗi dễ đọc (Bytes, KB, MB, GB)
// ================================================================
describe("formatFileSize(bytes)", () => {

  // --- TC_CL_001: 0 bytes ---
  test("TC_CL_001: 0 bytes → '0 Bytes'", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  // --- TC_CL_002: < 1KB ---
  test("TC_CL_002: 500 bytes → '500 Bytes'", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
  });

  // --- TC_CL_003: Đúng 1 KB ---
  test("TC_CL_003: 1024 bytes → '1 KB'", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  // --- TC_CL_004: KB lẻ ---
  test("TC_CL_004: 1536 bytes → '1.5 KB'", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  // --- TC_CL_005: 1 MB ---
  test("TC_CL_005: 1048576 bytes → '1 MB'", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  // --- TC_CL_006: 5 MB ---
  test("TC_CL_006: 5MB → '5 MB'", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });

  // --- TC_CL_007: 2.5 MB ---
  test("TC_CL_007: 2.5MB → '2.5 MB'", () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });

  // --- TC_CL_008: 1 GB ---
  test("TC_CL_008: 1GB → '1 GB'", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  // --- TC_CL_009: 1 byte ---
  test("TC_CL_009: 1 byte → '1 Bytes'", () => {
    expect(formatFileSize(1)).toBe("1 Bytes");
  });

  // --- TC_CL_010: 100 MB ---
  test("TC_CL_010: 100 MB → '100 MB'", () => {
    expect(formatFileSize(100 * 1024 * 1024)).toBe("100 MB");
  });
});

// ================================================================
// II. TEST SUITE: isValidImageFile(file)
// Mô tả: Whitelist - image/jpeg, image/jpg, image/png, image/gif, image/webp
// ================================================================
describe("isValidImageFile(file)", () => {

  // --- TC_CL_011: JPEG → true ---
  test("TC_CL_011: File JPEG → true", () => {
    expect(isValidImageFile({ type: "image/jpeg" } as File)).toBe(true);
  });

  // --- TC_CL_012: JPG → true ---
  test("TC_CL_012: File JPG → true", () => {
    expect(isValidImageFile({ type: "image/jpg" } as File)).toBe(true);
  });

  // --- TC_CL_013: PNG → true ---
  test("TC_CL_013: File PNG → true", () => {
    expect(isValidImageFile({ type: "image/png" } as File)).toBe(true);
  });

  // --- TC_CL_014: GIF → true ---
  test("TC_CL_014: File GIF → true", () => {
    expect(isValidImageFile({ type: "image/gif" } as File)).toBe(true);
  });

  // --- TC_CL_015: WebP → true ---
  test("TC_CL_015: File WebP → true", () => {
    expect(isValidImageFile({ type: "image/webp" } as File)).toBe(true);
  });

  // --- TC_CL_016: PDF → false ---
  test("TC_CL_016: File PDF → false", () => {
    expect(isValidImageFile({ type: "application/pdf" } as File)).toBe(false);
  });

  // --- TC_CL_017: MP4 → false ---
  test("TC_CL_017: File MP4 → false", () => {
    expect(isValidImageFile({ type: "video/mp4" } as File)).toBe(false);
  });

  // --- TC_CL_018: DOCX → false ---
  test("TC_CL_018: File DOCX → false", () => {
    expect(isValidImageFile({ type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } as File)).toBe(false);
  });

  // --- TC_CL_019: SVG → false (không trong whitelist) ---
  test("TC_CL_019: File SVG → false (không trong whitelist)", () => {
    expect(isValidImageFile({ type: "image/svg+xml" } as File)).toBe(false);
  });

  // --- TC_CL_020: type rỗng → false ---
  test("TC_CL_020: File type rỗng → false", () => {
    expect(isValidImageFile({ type: "" } as File)).toBe(false);
  });

  // --- TC_CL_021: BMP → false ---
  test("TC_CL_021: File BMP → false (không trong whitelist)", () => {
    expect(isValidImageFile({ type: "image/bmp" } as File)).toBe(false);
  });
});

// ================================================================
// III. TEST SUITE: isValidFileSize(file, maxSizeMB)
// Mô tả: file.size <= maxSizeMB * 1024 * 1024
// ================================================================
describe("isValidFileSize(file, maxSizeMB)", () => {

  // --- TC_CL_022: Nhỏ hơn max → true ---
  test("TC_CL_022: 2MB < 5MB → true", () => {
    expect(isValidFileSize({ size: 2 * 1024 * 1024 } as File, 5)).toBe(true);
  });

  // --- TC_CL_023: Bằng max → true ---
  test("TC_CL_023: 5MB = 5MB → true (biên bằng)", () => {
    expect(isValidFileSize({ size: 5 * 1024 * 1024 } as File, 5)).toBe(true);
  });

  // --- TC_CL_024: Lớn hơn max → false ---
  test("TC_CL_024: 8MB > 5MB → false", () => {
    expect(isValidFileSize({ size: 8 * 1024 * 1024 } as File, 5)).toBe(false);
  });

  // --- TC_CL_025: 0 bytes → true ---
  test("TC_CL_025: 0 bytes, max 5MB → true", () => {
    expect(isValidFileSize({ size: 0 } as File, 5)).toBe(true);
  });

  // --- TC_CL_026: Vượt 1 byte → false ---
  test("TC_CL_026: 5MB + 1 byte > 5MB → false (biên trên)", () => {
    expect(isValidFileSize({ size: 5 * 1024 * 1024 + 1 } as File, 5)).toBe(false);
  });

  // --- TC_CL_027: Max 10MB ---
  test("TC_CL_027: 9MB < 10MB → true", () => {
    expect(isValidFileSize({ size: 9 * 1024 * 1024 } as File, 10)).toBe(true);
  });

  // --- TC_CL_028: Max 100MB (video) ---
  test("TC_CL_028: 50MB < 100MB → true", () => {
    expect(isValidFileSize({ size: 50 * 1024 * 1024 } as File, 100)).toBe(true);
  });

  // --- TC_CL_029: 150MB > 100MB → false ---
  test("TC_CL_029: 150MB > 100MB → false", () => {
    expect(isValidFileSize({ size: 150 * 1024 * 1024 } as File, 100)).toBe(false);
  });

  // --- TC_CL_030: Max 1MB, file 500KB ---
  test("TC_CL_030: 500KB < 1MB → true", () => {
    expect(isValidFileSize({ size: 500 * 1024 } as File, 1)).toBe(true);
  });
});

// ================================================================
// IV. uploadImageToCloudinary — Không thể unit test trong Jest
// ================================================================
describe("uploadImageToCloudinary (ghi nhận)", () => {

  // --- TC_CL_031: Ghi nhận hàm cần integration test ---
  test("TC_CL_031: uploadImageToCloudinary cần Integration/E2E test", () => {
    // Hàm uploadImageToCloudinary sử dụng:
    // - import.meta.env (Vite-specific, Jest không hỗ trợ)
    // - XMLHttpRequest (cần browser hoặc jsdom)
    // - Cloudinary API endpoint (cần network)
    // → Cần test bằng Vitest (hỗ trợ import.meta) hoặc E2E test
    expect(true).toBe(true);
  });
});
