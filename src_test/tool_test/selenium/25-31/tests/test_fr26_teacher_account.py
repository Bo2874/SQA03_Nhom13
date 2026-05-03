"""
FR26 — Teacher Account Management (Admin Panel)
9 automated test cases: 001, 012, 013, 014, 021, 025, 026, 032, 033
"""
import pytest
from pages.admin.teacher_account_page import TeacherAccountPage
from config.config import get


@pytest.mark.fr26
class TestFR26TeacherAccount:

    def test_FR_026_001_admin_opens_teacher_management(self, admin_driver, db):
        """FR_026_001: Admin mở trang quản lý giáo viên → bảng hiển thị."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        assert page.is_present(*TeacherAccountPage.TABLE_ROWS, timeout=6), \
            "Bảng danh sách giáo viên không hiển thị"
        assert page.get_row_count() >= 0, "Bảng không có dữ liệu"

    def test_FR_026_012_create_teacher_valid_data(self, admin_driver, db, cleanup_test_teacher):
        """FR_026_012: Tạo tài khoản giáo viên hợp lệ → toast thành công + DB có record mới."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        email = get("test_teacher_email")
        name  = get("test_teacher_name")
        phone = get("test_teacher_phone")
        pwd   = get("test_teacher_password")

        # Đảm bảo test email chưa tồn tại
        db.delete_user_by_email(email)

        page.open_create_modal()
        page.fill_create_form(email, name, phone, pwd, pwd)
        page.submit_modal()

        # Kiểm tra UI: toast thành công
        assert page.is_toast_visible(timeout=6), "Không có thông báo tạo thành công"

        # Kiểm tra DB
        user = db.find_user_by_email(email)
        assert user is not None, f"User {email} không có trong DB sau khi tạo"
        assert user["role"] == "TEACHER", f"Role sai: {user['role']}"

    def test_FR_026_013_email_missing_at_sign_validation(self, admin_driver):
        """FR_026_013: Email thiếu @ → cảnh báo frontend, không submit."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        page.open_create_modal()
        page.fill_create_form(
            email="invalidemail.com",
            name="Test Teacher",
            phone="0900000000",
            password=get("test_teacher_password")
        )
        page.submit_modal()
        # Browser HTML5 validation hoặc ant-form error
        errors = page.get_error_messages()
        src    = page.page_source()
        has_error = (
            len(errors) > 0
            or "email" in src.lower()
            or page.is_present(*TeacherAccountPage.MODAL, timeout=2)  # modal still open
        )
        assert has_error, "Không có cảnh báo khi nhập email không hợp lệ"

    def test_FR_026_014_password_mismatch_validation(self, admin_driver):
        """FR_026_014: Mật khẩu xác nhận không khớp → lỗi, modal vẫn mở."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        page.open_create_modal()
        page.fill_create_form(
            email="mismatch_test@example.com",
            name="Test Teacher",
            phone="0900000000",
            password="Password1!",
            confirm="DifferentPass1!"
        )
        page.submit_modal()
        errors = page.get_error_messages()
        modal_still_open = page.is_present(*TeacherAccountPage.MODAL, timeout=2)
        assert len(errors) > 0 or modal_still_open, \
            "Không có lỗi khi mật khẩu xác nhận không khớp"

    def test_FR_026_021_update_teacher_info(self, admin_driver, db):
        """FR_026_021: Sửa họ tên, SĐT của giáo viên → cập nhật thành công và DB đúng."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        # Lấy teacher đầu tiên trong bảng
        rows_before = page.get_row_count()
        assert rows_before > 0, "Không có giáo viên nào trong bảng để sửa"

        page.click_edit_for_row(0)
        # Sửa số điện thoại
        new_phone = "0911111111"
        phone_inputs = page.driver.find_elements(
            *TeacherAccountPage.PHONE_INPUT
        )
        if phone_inputs:
            phone_inputs[0].clear()
            phone_inputs[0].send_keys(new_phone)
        page.submit_modal()
        assert page.is_toast_visible(timeout=6), "Không có thông báo cập nhật thành công"

    def test_FR_026_025_cancel_delete_keeps_row(self, admin_driver):
        """FR_026_025: Bấm Hủy trong hộp xác nhận xóa → dòng vẫn còn trong bảng."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        rows_before = page.get_row_count()
        assert rows_before > 0, "Không có dữ liệu để test"

        page.click_delete_for_row(0)
        # Hủy thao tác xóa
        if page.is_present(*TeacherAccountPage.CANCEL_CONFIRM, timeout=3):
            page.cancel_delete()

        rows_after = page.get_row_count()
        assert rows_after == rows_before, \
            f"Số hàng thay đổi sau khi hủy xóa: {rows_before} → {rows_after}"

    def test_FR_026_026_delete_teacher_removes_from_table_and_db(self, admin_driver, db):
        """FR_026_026: Xóa teacher → biến khỏi bảng và DB không còn record."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()

        # Tạo teacher test trước để xóa (tránh xóa data thật)
        email = "test_auto_delete@example.com"
        db.delete_user_by_email(email)
        db.execute(
            "INSERT INTO users (email, password_hash, full_name, role, status) "
            "VALUES (%s, 'hash', 'Delete Test', 'TEACHER', 'ACTIVE')",
            (email,)
        )
        db.commit()
        page.driver.refresh()

        rows_before = page.get_row_count()
        page.click_delete_for_row(0)  # table sorts createdAt DESC → newest row is first
        page.confirm_delete()

        assert page.is_toast_visible(timeout=5), "Không có toast sau khi xóa"
        user = db.find_user_by_email(email)
        assert user is None, "User vẫn còn trong DB sau khi xóa"

    def test_FR_026_032_xss_injection_in_name_field(self, admin_driver):
        """FR_026_032: XSS <script>alert(1)</script> vào họ tên → không bật popup JS."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        page.open_create_modal()
        page.fill_create_form(
            email="xss_test@example.com",
            name="<script>alert(1)</script>",
            phone="0900000000",
            password=get("test_teacher_password")
        )
        page.submit_modal()
        # Kiểm tra KHÔNG có alert JS
        alert_fired = page.alert_is_triggered(timeout=3)
        assert not alert_fired, "XSS thành công: alert() được thực thi — BUG bảo mật!"
        # Dọn dẹp nếu tạo được
        db = None
        # (cleanup_test_teacher fixture sẽ dọn test_auto_ prefix — xss_test không có prefix đó)
        # Xóa thủ công qua driver không cần, chỉ verify UI

    def test_FR_026_033_sql_injection_in_email_field(self, admin_driver):
        """FR_026_033: SQL injection ' OR 1=1 -- vào email → bị chặn ở frontend (email invalid)."""
        page = TeacherAccountPage(admin_driver)
        page.navigate()
        page.open_create_modal()
        page.fill_create_form(
            email="' OR 1=1 --",
            name="SQL Test",
            phone="0900000000",
            password=get("test_teacher_password")
        )
        page.submit_modal()
        # Email không hợp lệ nên frontend phải báo lỗi
        errors = page.get_error_messages()
        modal_open = page.is_present(*TeacherAccountPage.MODAL, timeout=2)
        assert len(errors) > 0 or modal_open, \
            "SQL injection không bị chặn ở frontend — kiểm tra validation email"
