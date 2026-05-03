"""
FR27 — Platform Dashboard (Admin Panel)
5 automated test cases: 001, 005, 006, 010, 011
"""
import pytest
from pages.admin.dashboard_page import DashboardPage
from pages.admin.admin_login_page import AdminLoginPage
from pages.frontend.frontend_login_page import FrontendLoginPage
from config.config import get, ADMIN_URL


@pytest.mark.fr27
class TestFR27Dashboard:

    def test_FR_027_001_dashboard_layout_four_stat_cards(self, admin_driver, db):
        """FR_027_001: Dashboard hiển thị đầy đủ 4 thẻ thống kê."""
        page = DashboardPage(admin_driver)
        page.open()
        assert page.is_dashboard_loaded(), "Dashboard không load được (không thấy stat cards)"
        card_count = page.get_stat_card_count()
        # Kỳ vọng ít nhất 4 card: khóa học, học sinh, giáo viên, bài giảng
        assert card_count >= 4, \
            f"Dashboard chỉ có {card_count} stat card, kỳ vọng >= 4"

    def test_FR_027_005_courses_count_matches_db(self, admin_driver, db):
        """FR_027_005: Số khóa học trên dashboard khớp với DB."""
        page = DashboardPage(admin_driver)
        page.open()
        assert page.is_dashboard_loaded(), "Dashboard không load"

        ui_count = page.get_numeric_value_by_keyword("khóa học")
        db_count  = db.count_published_courses()

        assert ui_count is not None, "Không tìm thấy thẻ 'khóa học' trên dashboard"
        assert ui_count == db_count, \
            f"Số khóa học không khớp — UI: {ui_count}, DB: {db_count}"

    def test_FR_027_006_students_count_matches_db(self, admin_driver, db):
        """FR_027_006: Số học viên trên dashboard khớp với DB."""
        page = DashboardPage(admin_driver)
        page.open()
        assert page.is_dashboard_loaded(), "Dashboard không load"

        ui_count = page.get_numeric_value_by_keyword("học viên")
        db_count  = db.count_users_by_role("STUDENT")

        assert ui_count is not None, "Không tìm thấy thẻ 'học viên' trên dashboard"
        assert ui_count == db_count, \
            f"Số học viên không khớp — UI: {ui_count}, DB: {db_count}"

    def test_FR_027_010_student_cannot_access_admin_dashboard(self, driver):
        """FR_027_010: Student đăng nhập frontend → cố vào admin dashboard → bị từ chối."""
        login = FrontendLoginPage(driver)
        login.open()
        login.login(get("student_email"), get("student_password"))

        # Cố vào admin dashboard
        dash = DashboardPage(driver)
        dash.go(ADMIN_URL)

        url = dash.current_url()
        has_dashboard = dash.is_dashboard_loaded()
        is_blocked = "login" in url.lower() or not has_dashboard
        assert is_blocked, \
            f"Student truy cập được admin dashboard — BUG phân quyền! URL: {url}"

    def test_FR_027_011_teacher_cannot_access_admin_dashboard(self, driver):
        """FR_027_011: Teacher đăng nhập frontend → cố vào admin dashboard → bị từ chối."""
        login = FrontendLoginPage(driver)
        login.open()
        login.login(get("teacher_email"), get("teacher_password"))

        dash = DashboardPage(driver)
        dash.go(ADMIN_URL)

        url = dash.current_url()
        has_dashboard = dash.is_dashboard_loaded()
        is_blocked = "login" in url.lower() or not has_dashboard
        assert is_blocked, \
            f"Teacher truy cập được admin dashboard — BUG phân quyền! URL: {url}"
