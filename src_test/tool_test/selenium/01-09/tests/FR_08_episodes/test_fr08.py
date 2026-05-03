"""FR_08 — Episode (lesson) management system tests.

16 test cases sourced from sheet FR_08 in ss_test_13.xlsx.

Implementation notes (drives expected verdicts):
  - EpisodeModal calls native alert() on create (L192) and update (L188)
    success — TC expects toasts. Same pattern as FR_06/FR_07.
  - The delete flow on courses/[id]/page.tsx uses native confirm() (L120)
    and alert() (L124).
  - The file <input type="file" accept="video/*"> is rendered statically
    (className="hidden"); Selenium can drive it with send_keys.
  - FR_008_006/007 require a real video file uploaded to Cloudinary; we
    do not have a real MP4 in the test fixtures, so those are marked
    Inactive with a clear note (the manual tester verified them by hand).
"""
import time
import uuid

import pytest
from selenium.common.exceptions import NoAlertPresentException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.teacher_course_detail_page import TeacherCourseDetailPage
from pages.episode_modal_page import EpisodeModalPage
from pages.teacher_courses_page import grab_alert_text
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, get_or_create_subject, get_or_create_grade_level,
    seed_course, seed_chapter, seed_episode, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_08_episode_management.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


@pytest.fixture(scope="session")
def db_conn_session():
    import mysql.connector
    conn = mysql.connector.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    yield conn
    conn.close()


@pytest.fixture(scope="session")
def metadata_ids(db_conn_session):
    return {
        "subject_id": get_or_create_subject(db_conn_session, "Toán học"),
        "grade_id": get_or_create_grade_level(db_conn_session, "Lớp 10"),
    }


@pytest.fixture
def chapter_ready(driver, db_conn, metadata_ids, cleanup_test_users):
    """Seed teacher + course + chapter, log in, navigate to course detail
    Chapters tab with the chapter expanded and ready for episode actions."""
    email = _unique_email()
    password = "Abc123456"
    teacher_id = seed_user(
        db_conn, email=email, password_plain=password,
        full_name="EpisodeTeacher", role="TEACHER",
    )
    course_title = f"Course {uuid.uuid4().hex[:6]}"
    course_id = seed_course(
        db_conn, teacher_id=teacher_id,
        subject_id=metadata_ids["subject_id"],
        grade_level_id=metadata_ids["grade_id"],
        title=course_title,
    )
    chapter_title = f"Chapter {uuid.uuid4().hex[:6]}"
    chapter_id = seed_chapter(
        db_conn, course_id=course_id, title=chapter_title, order=1
    )
    login = LoginPage(driver).open()
    login.fill_form(email=email, password=password)
    login.click_submit()
    WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
    page = TeacherCourseDetailPage(driver, course_id=course_id)
    page.open()
    page.wait_until_loaded()
    page.goto_chapters_tab()
    WebDriverWait(driver, 10).until(lambda d: chapter_title in d.page_source)
    page.click_toggle_for(chapter_title)  # expand chapter
    time.sleep(0.5)
    return page, course_id, chapter_id, chapter_title


@pytest.fixture
def big_video(tmp_path):
    """101 MB file with .mp4 extension — passes type check, fails size check."""
    p = tmp_path / "big.mp4"
    p.write_bytes(b"\x00" * (101 * 1024 * 1024))
    return str(p.resolve())


@pytest.fixture
def pdf_file(tmp_path):
    p = tmp_path / "notes.pdf"
    p.write_bytes(b"%PDF-1.4\n" + b"\x00" * 200)
    return str(p.resolve())


# =============================================================================
# Section 1 — UI/UX (FR_008_001, FR_008_002)
# =============================================================================

class TestEpisodeModalUI:
    def test_FR_008_001_modal_layout(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible(), "Episode modal did not open"
        assert "Thêm bài học mới" in modal.heading_text()
        assert "Tạo bài học" in modal.submit_button_text()

    def test_FR_008_002_youtube_upload_toggle(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        # Default mode = youtube → YouTube tab active, URL input visible
        assert modal.youtube_tab_active()
        assert page.driver.find_elements(*modal.YOUTUBE_URL_INPUT), (
            "Default mode should expose YouTube URL input"
        )
        # Switch to Upload File
        modal.click_upload_tab()
        assert modal.upload_tab_active()
        assert page.driver.find_elements(*modal.CHOOSE_VIDEO_BUTTON), (
            "Upload mode should expose 'Chọn video' button"
        )
        # Switch back to YouTube
        modal.click_youtube_tab()
        assert modal.youtube_tab_active()


# =============================================================================
# Section 2 — Add YouTube episode (FR_008_003 to FR_008_005)
# =============================================================================

class TestAddYouTubeEpisode:
    def test_FR_008_003_create_youtube_uses_alert_not_toast(
        self, chapter_ready, db_conn
    ):
        page, _, chapter_id, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        title = f"YouTube Lesson {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(1)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(120)
        modal.submit()
        alert_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id, title FROM episodes WHERE chapter_id = %s AND title = %s",
            (chapter_id, title),
        )
        assert row is not None, "Episode was not saved in DB"
        assert alert_text is None, (
            f"TC expects toast 'Tạo bài học mới thành công!' but EpisodeModal.tsx "
            f"L192 calls window.alert() instead. Native alert seen: {alert_text!r}. "
            f"Episode saved in DB; only the success-delivery channel is wrong."
        )

    def test_FR_008_004_missing_video_url(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("Valid title here")
        modal.fill_order(1)
        # Don't fill URL or upload anything
        modal.fill_duration(120)
        modal.submit()
        # Form-level error toast appears (toast.error in onSubmit when no
        # finalVideoUrl). It's a react-hot-toast notification, so the text
        # surfaces in page_source.
        WebDriverWait(page.driver, 5).until(
            lambda d: "Vui lòng cung cấp URL video hoặc upload file video" in d.page_source
        )

    def test_FR_008_005_invalid_youtube_url(self, chapter_ready, db_conn):
        """The URL input has type='url', so HTML5 validation blocks the
        submission before yup's `.url()` validator fires (yup's specific
        Vietnamese message therefore never appears). Either way, no row
        should be created."""
        page, _, chapter_id, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        title = f"BlockBadURL {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(1)
        modal.fill_youtube_url("not-a-url")
        modal.fill_duration(120)
        modal.submit()
        time.sleep(1)
        # Whether HTML5 or yup blocks the submit, the row must not exist.
        row = fetch_one(
            db_conn,
            "SELECT id FROM episodes WHERE chapter_id = %s AND title = %s",
            (chapter_id, title),
        )
        assert row is None, (
            f"Submission with malformed URL must be rejected; row in DB: {row!r}"
        )


# =============================================================================
# Section 3 — Upload video file (FR_008_006 to FR_008_009)
# =============================================================================

class TestUploadVideo:
    def test_FR_008_006_upload_mp4_success(self, chapter_ready):
        pytest.skip(
            "Inactive: Test cần một file MP4 hợp lệ thật để upload lên "
            "Cloudinary. Tool test environment không có sẵn file MP4 "
            "(embed bytes giả không pass content-validation của Cloudinary). "
            "Manual tester đã verify chức năng này hoạt động (sheet gốc = Pass). "
            "Có thể test thủ công bằng cách dùng video MP4 < 100MB."
        )

    def test_FR_008_007_upload_webm_success(self, chapter_ready):
        pytest.skip(
            "Inactive: Tương tự FR_008_006 — cần file WebM thật để Cloudinary "
            "chấp nhận. Manual tester đã verify (sheet gốc = Pass). Có thể "
            "test thủ công bằng video WebM < 100MB."
        )

    def test_FR_008_008_upload_oversize_rejected(
        self, chapter_ready, big_video
    ):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.click_upload_tab()
        modal.upload_file(big_video)
        WebDriverWait(page.driver, 5).until(
            lambda d: "không được vượt quá 100MB" in d.page_source
        )

    def test_FR_008_009_upload_pdf_rejected(self, chapter_ready, pdf_file):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.click_upload_tab()
        modal.upload_file(pdf_file)
        WebDriverWait(page.driver, 5).until(
            lambda d: "Vui lòng chọn file video hợp lệ" in d.page_source
        )


# =============================================================================
# Section 4 — Form field validation (FR_008_010 to FR_008_014)
# =============================================================================

class TestEpisodeValidation:
    def test_FR_008_010_empty_title(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_order(1)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(120)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Tiêu đề bài học không được để trống" in e for e in errors), (
            f"Expected 'Tiêu đề bài học không được để trống'; got {errors}"
        )

    def test_FR_008_011_title_too_short(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("ABCD")
        modal.fill_order(1)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(120)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("ít nhất 5 ký tự" in e for e in errors), (
            f"Expected 'Tiêu đề phải có ít nhất 5 ký tự'; got {errors}"
        )

    def test_FR_008_012_invalid_order(self, chapter_ready, db_conn):
        """Order = 0 must be rejected. HTML5 min='1' blocks before yup, but
        either way no episode row should be created."""
        page, _, chapter_id, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        title = f"Block0 {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(0)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(120)
        modal.submit()
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id FROM episodes WHERE chapter_id = %s AND title = %s",
            (chapter_id, title),
        )
        assert row is None, (
            f"Submission with order=0 should be rejected; row in DB: {row!r}"
        )

    def test_FR_008_013_empty_duration(self, chapter_ready):
        page, _, _, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("Valid title here")
        modal.fill_order(1)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration("")  # leave empty
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any(
            "Thời lượng video không được để trống" in e
            or "Thời lượng phải là số" in e
            for e in errors
        ), (
            f"Expected duration-required / type error; got {errors}"
        )

    def test_FR_008_014_invalid_duration(self, chapter_ready, db_conn):
        page, _, chapter_id, chapter_title = chapter_ready
        page.click_add_episode_in(chapter_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        title = f"BlockDur {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(1)
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(0)
        modal.submit()
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id FROM episodes WHERE chapter_id = %s AND title = %s",
            (chapter_id, title),
        )
        assert row is None, (
            f"Submission with duration=0 should be rejected; row in DB: {row!r}"
        )


# =============================================================================
# Section 5 — Edit episode (FR_008_015)
# =============================================================================

class TestEditEpisode:
    def test_FR_008_015_edit_uses_alert_not_toast(self, chapter_ready, db_conn):
        page, _, chapter_id, chapter_title = chapter_ready
        ep_title = f"EditMe {uuid.uuid4().hex[:6]}"
        ep_id = seed_episode(
            db_conn, chapter_id=chapter_id, title=ep_title, order=1
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_toggle_for(chapter_title)
        WebDriverWait(page.driver, 10).until(
            lambda d: ep_title in d.page_source
        )
        page.click_edit_episode_for(ep_title)
        modal = EpisodeModalPage(page.driver)
        assert modal.is_visible()
        new_title = f"Updated {uuid.uuid4().hex[:6]}"
        modal.fill_title(new_title)
        # Seeded episode has video_url=NULL; the modal's submit guard
        # ('Vui lòng cung cấp URL...') would block without one.
        modal.fill_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        modal.fill_duration(120)
        modal.submit()
        alert_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT title FROM episodes WHERE id = %s", (ep_id,)
        )
        assert row and row["title"] == new_title, (
            f"DB episode title not updated; row = {row!r}"
        )
        assert alert_text is None, (
            f"TC expects toast 'Cập nhật bài học thành công!' but "
            f"EpisodeModal.tsx L188 calls window.alert(). Native alert seen: "
            f"{alert_text!r}."
        )


# =============================================================================
# Section 6 — Delete episode (FR_008_016)
# =============================================================================

class TestDeleteEpisode:
    def test_FR_008_016_delete_uses_native_confirm_and_alert(
        self, chapter_ready, db_conn
    ):
        page, _, chapter_id, chapter_title = chapter_ready
        ep_title = f"DelMe {uuid.uuid4().hex[:6]}"
        ep_id = seed_episode(
            db_conn, chapter_id=chapter_id, title=ep_title, order=1
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_toggle_for(chapter_title)
        WebDriverWait(page.driver, 10).until(
            lambda d: ep_title in d.page_source
        )
        page.click_delete_episode_for(ep_title)
        time.sleep(0.3)
        try:
            confirm = page.driver.switch_to.alert
            confirm_text = confirm.text
            confirm.accept()
        except NoAlertPresentException:
            confirm_text = None
        success_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT id FROM episodes WHERE id = %s", (ep_id,)
        )
        assert row is None, "Episode was not deleted from DB"
        assert confirm_text is None and success_text is None, (
            f"TC expects an in-app confirm modal and a toast for delete success. "
            f"courses/[id]/page.tsx L120 calls window.confirm() (text: "
            f"{confirm_text!r}) and L124 calls window.alert() (text: "
            f"{success_text!r}) instead."
        )
