"""
FR28 — Zoom Meeting Management (Frontend Teacher)
5 automated test cases: 004, 005, 006, 007 (known bug), 014
"""
import pytest
from pages.frontend.zoom_meeting_page import ZoomMeetingPage
from pages.frontend.frontend_login_page import FrontendLoginPage
from config.config import get, FRONTEND_URL


# ID của khóa học do teacher1 tạo (lấy từ DB seed; điều chỉnh nếu cần)
TEACHER1_COURSE_ID = 1


@pytest.mark.fr28
class TestFR28ZoomMeeting:

    def test_FR_028_004_create_zoom_meeting_valid(self, teacher_driver, db):
        """FR_028_004: Tạo Zoom Meeting hợp lệ → xuất hiện trong danh sách + DB có record."""
        page = ZoomMeetingPage(teacher_driver)
        page.open_for_course(TEACHER1_COURSE_ID)

        if not page.is_present(*ZoomMeetingPage.CREATE_BTN, timeout=5):
            pytest.skip("Không tìm thấy nút Tạo Meeting — kiểm tra course_id hoặc UI")

        title = "Auto_Selenium_Meeting_001"
        # Dọn DB trước
        db.delete_zoom_meeting_by_title(title)

        page.click_create()
        page.fill_form(
            title=title,
            link="https://zoom.us/j/1234567890",
            password="abc123",
            duration=60,
            datetime_str="2027-12-24T17:00"
        )
        page.submit()

        assert page.is_toast_shown(timeout=6), "Không có thông báo tạo meeting thành công"

        # DB verify
        count = db.count_zoom_meetings_by_title(title)
        assert count > 0, f"Zoom meeting '{title}' không có trong DB sau khi tạo"

        # Rollback
        db.delete_zoom_meeting_by_title(title)

    def test_FR_028_005_empty_title_validation(self, teacher_driver):
        """FR_028_005: Tiêu đề trống → lỗi validation, không tạo meeting."""
        page = ZoomMeetingPage(teacher_driver)
        page.open_for_course(TEACHER1_COURSE_ID)

        if not page.is_present(*ZoomMeetingPage.CREATE_BTN, timeout=5):
            pytest.skip("Không tìm thấy nút Tạo Meeting")

        page.click_create()
        page.fill_form(title="", link="https://zoom.us/j/123", duration=60)
        page.submit()

        errors = page.get_errors()
        modal_open = page.is_present(*ZoomMeetingPage.MODAL, timeout=2)
        assert len(errors) > 0 or modal_open, \
            "Không có cảnh báo khi tiêu đề trống"

    def test_FR_028_006_invalid_link_validation(self, teacher_driver):
        """FR_028_006: Link không hợp lệ → lỗi định dạng URL."""
        page = ZoomMeetingPage(teacher_driver)
        page.open_for_course(TEACHER1_COURSE_ID)

        if not page.is_present(*ZoomMeetingPage.CREATE_BTN, timeout=5):
            pytest.skip("Không tìm thấy nút Tạo Meeting")

        page.click_create()
        page.fill_form(title="Test Meeting", link="not-a-valid-url", duration=60)
        page.submit()

        errors = page.get_errors()
        modal_open = page.is_present(*ZoomMeetingPage.MODAL, timeout=2)
        assert len(errors) > 0 or modal_open, \
            "Không có cảnh báo khi link không hợp lệ"

    @pytest.mark.known_bug
    def test_FR_028_007_past_datetime_should_be_rejected(self, teacher_driver):
        """
        FR_028_007: Thời gian trong quá khứ → kỳ vọng báo lỗi.
        [KNOWN BUG]: Hệ thống hiện tại cho phép tạo với thời gian trong quá khứ (không validate).
        Test này sẽ FAIL và ghi nhận bug.
        """
        page = ZoomMeetingPage(teacher_driver)
        page.open_for_course(TEACHER1_COURSE_ID)

        if not page.is_present(*ZoomMeetingPage.CREATE_BTN, timeout=5):
            pytest.skip("Không tìm thấy nút Tạo Meeting")

        page.click_create()
        page.fill_form(
            title="Past Meeting Test",
            link="https://zoom.us/j/123",
            duration=60,
            datetime_str="2020-01-01T10:00"  # quá khứ rõ ràng
        )
        page.submit()

        errors = page.get_errors()
        assert len(errors) > 0, \
            "[KNOWN BUG FR_028_007] Hệ thống không chặn thời gian trong quá khứ khi tạo Zoom Meeting"

    @pytest.mark.known_bug
    def test_FR_028_014_student_cannot_create_meeting(self, student_driver):
        """
        FR_028_014: Student không tạo được Zoom Meeting.
        [KNOWN BUG]: Frontend không kiểm tra role ở teacher/dashboard/layout.tsx
        → Student truy cập được trang teacher và thấy nút tạo meeting.
        """
        page = ZoomMeetingPage(student_driver)
        page.open_for_course(TEACHER1_COURSE_ID)

        # Student không có nút "Tạo Meeting" hoặc bị redirect
        url = page.current_url()
        has_create_btn = page.is_present(*ZoomMeetingPage.CREATE_BTN, timeout=4)

        assert not has_create_btn or "login" in url.lower(), \
            "Student thấy nút Tạo Meeting — BUG phân quyền!"
