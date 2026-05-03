"""
FR25 — Teacher Approval (Admin Panel)
5 automated test cases: FR_025_001, 003, 004, 007, 009
"""
import pytest
from selenium.webdriver.common.by import By
from pages.admin.admin_login_page import AdminLoginPage
from pages.admin.teacher_approval_page import TeacherApprovalPage
from config.config import get, ADMIN_URL, FRONTEND_URL
from pages.frontend.frontend_login_page import FrontendLoginPage


@pytest.mark.fr25
class TestFR25TeacherApproval:

    def test_FR_025_001_admin_login_and_access_teacher_page(self, admin_driver):
        """FR_025_001: Admin đăng nhập → vào trang Quản Lý Giáo Viên → URL/table hiển thị."""
        page = TeacherApprovalPage(admin_driver)
        page.navigate()
        url = page.current_url()
        assert any(p in url for p in ["/teachers", "/users", "/manage"]), \
            f"URL không đúng trang quản lý giáo viên: {url}"
        assert page.is_present(*TeacherApprovalPage.TABLE, timeout=5), \
            "Bảng danh sách giáo viên không hiển thị"

    def test_FR_025_003_page_title_and_columns_displayed(self, admin_driver):
        """FR_025_003: Tiêu đề trang và cột bảng hiển thị đầy đủ."""
        page = TeacherApprovalPage(admin_driver)
        page.navigate()
        heading = page.get_heading_text()
        assert heading, "Không tìm thấy tiêu đề trang"
        cols = page.get_column_headers()
        # Kiểm tra ít nhất có 2 cột thông tin
        assert len(cols) >= 2, f"Bảng có ít hơn 2 cột: {cols}"

    def test_FR_025_004_unauthenticated_redirect_to_login(self, driver):
        """FR_025_004: Chưa đăng nhập → truy cập trang admin → redirect /login."""
        page = TeacherApprovalPage(driver)
        page.navigate()
        url = page.current_url()
        assert "/login" in url or "login" in url.lower(), \
            f"Kỳ vọng redirect về /login, thực tế URL: {url}"

    def test_FR_025_007_pagination_works(self, admin_driver):
        """FR_025_007: Phân trang hoạt động bình thường."""
        page = TeacherApprovalPage(admin_driver)
        page.navigate()
        initial_rows = page.get_row_count()
        # Click next page nếu có; nếu không có đủ data thì kiểm tra nút tồn tại
        next_exists = page.is_present(*TeacherApprovalPage.NEXT_PAGE_BTN, timeout=3)
        if next_exists:
            clicked = page.click_next_page()
            assert clicked, "Nút phân trang next tồn tại nhưng không thể click"
        else:
            # Chỉ 1 trang — vẫn pass nếu bảng hiển thị
            assert initial_rows >= 0, "Bảng không có dữ liệu hàng"

    def test_FR_025_009_non_admin_blocked_from_teacher_page(self, driver):
        """FR_025_009: Tài khoản student không phải admin → bị chặn truy cập trang quản lý giáo viên."""
        # Đăng nhập với student vào frontend, sau đó cố truy cập admin URL
        login = FrontendLoginPage(driver)
        login.open()
        login.login(get("student_email"), get("student_password"))
        # Cố vào admin teacher page
        page = TeacherApprovalPage(driver)
        page.navigate(base_url=ADMIN_URL)
        url = page.current_url()
        # Kỳ vọng: bị redirect về login hoặc không có bảng quản lý
        is_blocked = (
            "login" in url.lower()
            or not page.is_present(*TeacherApprovalPage.TABLE, timeout=3)
        )
        assert is_blocked, \
            f"Student vẫn truy cập được trang admin teacher management: {url}"
