"""
FR30 — Teacher Profile Update (Frontend Teacher)
16 test cases — toàn bộ INACTIVE (blocked)

Lý do: Không có nút/đường dẫn điều hướng đến trang "Cập nhật hồ sơ" trong UI hiện tại.
Khi Dev bổ sung UI, bỏ @pytest.mark.skip và implement từng test case.
"""
import pytest

BLOCKED_REASON = (
    "Blocker FR30: Không có nút truy cập trang cập nhật hồ sơ giáo viên trong UI. "
    "Dev cần bổ sung navigation (menu/button) vào /teacher/profile/edit."
)


@pytest.mark.fr30
@pytest.mark.skip(reason=BLOCKED_REASON)
class TestFR30TeacherProfileUpdate:

    def test_FR_030_001_profile_page_layout(self, teacher_driver):
        """FR_030_001: Bố cục trang cập nhật hồ sơ: ảnh, họ tên, email, SĐT, mô tả."""
        pass

    def test_FR_030_002_fields_prefilled_with_current_data(self, teacher_driver):
        """FR_030_002: Các trường điền sẵn thông tin hiện tại."""
        pass

    def test_FR_030_003_save_cancel_buttons_visible(self, teacher_driver):
        """FR_030_003: Nút Lưu và Hủy hiển thị rõ ràng."""
        pass

    def test_FR_030_004_update_name_success(self, teacher_driver, db):
        """FR_030_004: Cập nhật họ tên → thành công + DB đúng."""
        pass

    def test_FR_030_005_update_avatar_success(self, teacher_driver, db):
        """FR_030_005: Upload ảnh đại diện → thay thế ảnh cũ thành công."""
        pass

    def test_FR_030_006_update_phone_success(self, teacher_driver, db):
        """FR_030_006: Cập nhật số điện thoại → cập nhật đúng trong DB."""
        pass

    def test_FR_030_007_empty_name_validation(self, teacher_driver):
        """FR_030_007: Họ tên để trống → lỗi, không lưu."""
        pass

    def test_FR_030_008_invalid_avatar_format_rejected(self, teacher_driver):
        """FR_030_008: Upload PDF → bị từ chối, chỉ chấp nhận PNG/JPEG/WEBP."""
        pass

    def test_FR_030_009_oversized_avatar_rejected(self, teacher_driver):
        """FR_030_009: Ảnh >giới hạn dung lượng → bị từ chối."""
        pass

    def test_FR_030_010_invalid_phone_format_rejected(self, teacher_driver):
        """FR_030_010: SĐT chứa chữ cái → lỗi định dạng."""
        pass

    def test_FR_030_011_cancel_does_not_save(self, teacher_driver):
        """FR_030_011: Bấm Hủy → dữ liệu gốc giữ nguyên."""
        pass

    def test_FR_030_012_student_cannot_access_teacher_profile_update(self, student_driver):
        """FR_030_012: Student không truy cập được trang cập nhật hồ sơ giáo viên."""
        pass

    def test_FR_030_013_teacher_a_cannot_edit_teacher_b_profile(self, teacher_driver):
        """FR_030_013: Giáo viên A không sửa được hồ sơ giáo viên B."""
        pass

    def test_FR_030_014_xss_in_name_field_rejected(self, teacher_driver):
        """FR_030_014: XSS vào họ tên → không thực thi script."""
        pass

    def test_FR_030_015_name_too_long_rejected(self, teacher_driver):
        """FR_030_015: Họ tên >300 ký tự → bị cắt hoặc báo lỗi."""
        pass

    def test_FR_030_016_update_reflects_on_public_profile(self, teacher_driver, driver):
        """FR_030_016: Cập nhật họ tên → hiển thị đúng trên trang hồ sơ công khai."""
        pass
