"""
FR29 — Teacher Profile Viewing (Frontend)
4 automated test cases: 003 (known bug), 004, 006, 009
"""
import pytest
from pages.frontend.teacher_profile_page import TeacherProfilePage
from config.config import get, FRONTEND_URL


# ID của giáo viên "tuan nguyen" (id=13 theo DB dump)
TUAN_NGUYEN_ID = 13


@pytest.mark.fr29
class TestFR29TeacherProfileViewing:

    @pytest.mark.known_bug
    def test_FR_029_003_back_button_navigates_to_teacher_search(self, driver):
        """
        FR_029_003: Nút Quay lại từ trang hồ sơ giáo viên → về trang tìm kiếm giáo viên.
        [KNOWN BUG]: Hệ thống quay về trang tìm kiếm chung thay vì teacher search.
        """
        page = TeacherProfilePage(driver)
        # Mở trang tìm kiếm giáo viên rồi vào hồ sơ
        page.open_search()
        page.open_by_id(TUAN_NGUYEN_ID)

        if not page.is_present(*TeacherProfilePage.BACK_BUTTON, timeout=4):
            pytest.skip("Không tìm thấy nút Quay lại trên trang hồ sơ giáo viên")

        page.click_back()
        url = page.current_url()

        # Kỳ vọng: URL chứa "teacher" hoặc "teachers" hoặc query teacher
        assert page.current_url_contains_teachers(), \
            f"[KNOWN BUG FR_029_003] Nút Quay lại chuyển đến '{url}' thay vì trang tìm kiếm giáo viên"

    def test_FR_029_004_guest_can_view_teacher_profile(self, driver):
        """FR_029_004: Guest chưa đăng nhập xem được hồ sơ giáo viên."""
        page = TeacherProfilePage(driver)
        page.open_by_id(TUAN_NGUYEN_ID)

        url = page.current_url()
        # Không bị redirect về login
        assert "login" not in url.lower(), \
            f"Guest bị redirect về login khi xem hồ sơ giáo viên: {url}"

        name = page.get_teacher_name()
        assert name, "Không hiển thị tên giáo viên cho Guest"

    def test_FR_029_006_course_count_matches_db(self, driver, db):
        """FR_029_006: Số khóa học trên hồ sơ giáo viên khớp với DB (chỉ PUBLISHED)."""
        page = TeacherProfilePage(driver)
        page.open_by_id(TUAN_NGUYEN_ID)

        ui_count = page.get_course_count_from_page()
        db_count  = db.count_published_courses_by_teacher(TUAN_NGUYEN_ID)

        if ui_count is None:
            # Fallback: đếm card
            ui_count = page.get_course_card_count()

        assert ui_count == db_count, \
            f"Số khóa học không khớp — UI: {ui_count}, DB: {db_count}"

    def test_FR_029_009_invalid_teacher_id_returns_404(self, driver):
        """FR_029_009: URL teacher/99999 (không tồn tại) → 404 hoặc not found."""
        page = TeacherProfilePage(driver)
        page.open_by_id(99999)

        assert page.is_404_or_not_found(), \
            "Trang không hiển thị 404 khi ID giáo viên không tồn tại"
