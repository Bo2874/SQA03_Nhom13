"""FR_06 — Course CRUD (Teacher) system tests.

20 test cases sourced from sheet FR_06 in ss_test_13.xlsx.

Notable implementation traits surfaced by these tests:
  - CourseModal.tsx submits via fetch and on success calls native
    `alert()` (L196 update, L209 create) — not a toast. The TC expects
    toast notifications, so success paths fail with a clear root cause.
  - courses/page.tsx delete flow uses native `confirm()` and `alert()`.
  - The thumbnail file input is rendered statically with class="hidden",
    so Selenium's send_keys on the input element drives the upload
    without needing a JS hack.
"""
import time
import uuid
from pathlib import Path

import pytest
from selenium.common.exceptions import NoAlertPresentException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.teacher_courses_page import (
    TeacherCoursesPage,
    CourseModalPage,
    grab_alert_text,
)
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user,
    get_or_create_subject,
    get_or_create_grade_level,
    seed_course,
    fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_06_course_crud.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _accept_any_pending_alert(driver):
    """Defensive: if a prior step left an alert, dismiss it so the next
    step doesn't blow up."""
    try:
        alert = driver.switch_to.alert
        alert.accept()
    except NoAlertPresentException:
        pass


# Tiny valid 1x1 PNG (67 bytes) — used to feed real image bytes to
# Cloudinary's upload endpoint.
_TINY_PNG_BYTES = bytes([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
    0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0,
    1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
])


@pytest.fixture(scope="session")
def seeded_metadata(db_conn_session):
    """Make sure at least one subject and one grade-level exist so
    CourseModal's selects have options to pick."""
    subject_id = get_or_create_subject(db_conn_session, "Toán học")
    grade_id = get_or_create_grade_level(db_conn_session, "Lớp 10")
    return {
        "subject_name": "Toán học",
        "subject_id": subject_id,
        "grade_name": "Lớp 10",
        "grade_id": grade_id,
    }


@pytest.fixture(scope="session")
def db_conn_session():
    """Module-level DB connection for session-scoped seeds."""
    import mysql.connector
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    yield conn
    conn.close()


@pytest.fixture
def teacher_courses_page(driver, db_conn, seeded_metadata, cleanup_test_users):
    """Seed a teacher, log in via UI, navigate to /teacher/dashboard/courses."""
    email = _unique_email()
    password = "Abc123456"
    teacher_id = seed_user(
        db_conn, email=email, password_plain=password,
        full_name="CourseTeacher", role="TEACHER",
    )
    page = LoginPage(driver).open()
    page.fill_form(email=email, password=password)
    page.click_submit()
    WebDriverWait(driver, 15).until(
        EC.url_contains("/teacher/dashboard")
    )
    courses = TeacherCoursesPage(driver)
    courses.open()
    courses.wait_until_loaded(timeout=15)
    return courses, teacher_id


@pytest.fixture
def tiny_jpg(tmp_path):
    p = tmp_path / "tiny.jpg"
    # Tiny valid 1x1 white JPEG (about 281 bytes — known-good)
    jpg_bytes = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    ])
    # Use a real PNG saved with .jpg ext won't work because Cloudinary
    # validates content. Use the tiny PNG bytes saved with .png extension
    # instead — see tiny_png fixture for the upload happy-path.
    p.write_bytes(jpg_bytes)
    return str(p.resolve())


@pytest.fixture
def tiny_png(tmp_path):
    p = tmp_path / "tiny.png"
    p.write_bytes(_TINY_PNG_BYTES)
    return str(p.resolve())


@pytest.fixture
def big_jpg(tmp_path):
    """A 6 MB file with .jpg extension — passes the type check by extension
    but trips the 5 MB size validator."""
    p = tmp_path / "big.jpg"
    p.write_bytes(b"\x00" * (6 * 1024 * 1024))
    return str(p.resolve())


@pytest.fixture
def pdf_file(tmp_path):
    p = tmp_path / "notes.pdf"
    p.write_bytes(b"%PDF-1.4\n%dummy" + b"\x00" * 200)
    return str(p.resolve())


# =============================================================================
# Section 1 — UI/UX (FR_006_001 to FR_006_002)
# =============================================================================

class TestCreateModalUI:
    def test_FR_006_001_modal_layout(self, teacher_courses_page):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        assert modal.is_visible(), "Create-course modal did not open"
        assert "Tạo khóa học mới" in modal.heading_text()
        # Cancel + submit buttons present
        assert page.driver.find_element(*modal.CANCEL_BUTTON).is_displayed()
        submit = page.driver.find_element(*modal.SUBMIT_BUTTON)
        assert "Tạo khóa học" in submit.text

    def test_FR_006_002_placeholders(self, teacher_courses_page):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        assert modal.is_visible()
        assert modal.title_placeholder() == "Ví dụ: Toán hình học không gian - Lớp 11"
        assert modal.summary_placeholder() == "Mô tả ngắn gọn về nội dung khóa học..."
        assert modal.subject_first_option_text() == "Chọn môn học"
        assert modal.grade_first_option_text() == "Chọn lớp"


# =============================================================================
# Section 2 — Create flow (FR_006_003 to FR_006_009)
# =============================================================================

class TestCreateFlow:
    def test_FR_006_003_create_success_uses_alert_not_toast(
        self, teacher_courses_page, db_conn, seeded_metadata
    ):
        """TC expects a toast notification 'Tạo khóa học thành công!' on
        success. CourseModal.tsx L209 calls native window.alert() instead.
        The bug is a UX deviation — we surface it as a Fail."""
        page, teacher_id = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        assert modal.is_visible()
        unique_title = f"AutoTest Course {uuid.uuid4().hex[:6]}"
        modal.fill_title(unique_title)
        modal.select_subject(seeded_metadata["subject_name"])
        modal.select_grade(seeded_metadata["grade_name"])
        modal.submit()

        alert_text = grab_alert_text(page.driver, timeout=8)
        # Whichever path: ensure DB has the new course (so we know save
        # actually worked), then assert against the TC's expected delivery.
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id, title FROM courses WHERE teacher_id = %s AND title = %s",
            (teacher_id, unique_title),
        )
        assert row is not None, "Course was not saved in DB"

        assert alert_text is None, (
            f"TC expects toast notification 'Tạo khóa học thành công!' but "
            f"got native browser alert: {alert_text!r}. CourseModal.tsx L209 "
            f"calls window.alert() instead of toast.success(). The course "
            f"was created in DB, but the success delivery channel is wrong."
        )

    def test_FR_006_004_empty_title(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.select_subject(seeded_metadata["subject_name"])
        modal.select_grade(seeded_metadata["grade_name"])
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Tiêu đề không được để trống" in e for e in errors), (
            f"Expected 'Tiêu đề không được để trống'; got {errors}"
        )

    def test_FR_006_005_title_too_short(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_title("ABCD")  # 4 chars
        modal.select_subject(seeded_metadata["subject_name"])
        modal.select_grade(seeded_metadata["grade_name"])
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("ít nhất 5 ký tự" in e for e in errors), (
            f"Expected 'Tiêu đề phải có ít nhất 5 ký tự'; got {errors}"
        )

    def test_FR_006_006_title_too_long(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_title("X" * 201)  # 201 chars
        modal.select_subject(seeded_metadata["subject_name"])
        modal.select_grade(seeded_metadata["grade_name"])
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("không được vượt quá 200 ký tự" in e for e in errors), (
            f"Expected 'Tiêu đề không được vượt quá 200 ký tự'; got {errors}"
        )

    def test_FR_006_007_no_subject(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_title("Valid title here")
        # don't select subject
        modal.select_grade(seeded_metadata["grade_name"])
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Vui lòng chọn môn học" in e for e in errors), (
            f"Expected 'Vui lòng chọn môn học'; got {errors}"
        )

    def test_FR_006_008_no_grade(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_title("Valid title here")
        modal.select_subject(seeded_metadata["subject_name"])
        # don't select grade
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Vui lòng chọn lớp" in e for e in errors), (
            f"Expected 'Vui lòng chọn lớp'; got {errors}"
        )

    def test_FR_006_009_summary_too_long(self, teacher_courses_page, seeded_metadata):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_title("Valid title here")
        modal.select_subject(seeded_metadata["subject_name"])
        modal.select_grade(seeded_metadata["grade_name"])
        modal.fill_summary("A" * 1001)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Mô tả không được vượt quá 1000 ký tự" in e for e in errors), (
            f"Expected 'Mô tả không được vượt quá 1000 ký tự'; got {errors}"
        )


# =============================================================================
# Section 3 — Thumbnail upload (FR_006_010 to FR_006_015)
# =============================================================================

class TestThumbnailUpload:
    def test_FR_006_010_upload_valid_jpg_shows_success_toast(
        self, teacher_courses_page, tiny_png
    ):
        """TC: upload a valid <5MB image, expect 'Upload ảnh thành công!'.
        We use a tiny real PNG so Cloudinary's content validation accepts it.
        The FE handler `isValidImageFile` accepts both JPG and PNG."""
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.upload_file(tiny_png)
        WebDriverWait(page.driver, 15).until(
            lambda d: "Upload ảnh thành công" in d.page_source
        )

    def test_FR_006_011_upload_png(self, teacher_courses_page, tiny_png):
        """Same handler accepts PNG/GIF/WebP — FR_006_011 specifically
        verifies PNG. Reuse the same path."""
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.upload_file(tiny_png)
        WebDriverWait(page.driver, 15).until(
            lambda d: "Upload ảnh thành công" in d.page_source
        )

    def test_FR_006_012_upload_pdf_rejected(
        self, teacher_courses_page, pdf_file
    ):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.upload_file(pdf_file)
        WebDriverWait(page.driver, 5).until(
            lambda d: "Vui lòng chọn file ảnh hợp lệ" in d.page_source
        )

    def test_FR_006_013_upload_oversize_rejected(
        self, teacher_courses_page, big_jpg
    ):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.upload_file(big_jpg)
        WebDriverWait(page.driver, 5).until(
            lambda d: "không được vượt quá 5MB" in d.page_source
        )

    def test_FR_006_014_url_input_shows_preview(self, teacher_courses_page):
        """TC: type an image URL and see the preview render."""
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.fill_thumbnail_url(
            "https://res.cloudinary.com/demo/image/upload/sample.jpg"
        )
        time.sleep(1)
        assert modal.preview_visible(), (
            "Expected the thumbnail preview to render after entering an "
            "image URL, but no preview <img> appeared."
        )

    def test_FR_006_015_remove_uploaded_image(
        self, teacher_courses_page, tiny_png
    ):
        page, _ = teacher_courses_page
        page.click_create()
        modal = CourseModalPage(page.driver)
        modal.is_visible()
        modal.upload_file(tiny_png)
        WebDriverWait(page.driver, 15).until(
            lambda d: "Upload ảnh thành công" in d.page_source
        )
        assert modal.preview_visible()
        modal.remove_thumbnail()
        time.sleep(0.5)
        assert not modal.preview_visible(), (
            "Preview should disappear after clicking the remove (X) button."
        )


# =============================================================================
# Section 4 — Course list (FR_006_016)
# =============================================================================

class TestCourseList:
    def test_FR_006_016_list_displays_teachers_courses(
        self, driver, db_conn, seeded_metadata, cleanup_test_users
    ):
        # Seed teacher + 1 course directly (skip the UI create flow)
        email = _unique_email()
        password = "Abc123456"
        teacher_id = seed_user(
            db_conn, email=email, password_plain=password,
            full_name="ListTester", role="TEACHER",
        )
        course_title = f"AutoSeeded {uuid.uuid4().hex[:6]}"
        seed_course(
            db_conn, teacher_id=teacher_id,
            subject_id=seeded_metadata["subject_id"],
            grade_level_id=seeded_metadata["grade_id"],
            title=course_title,
        )
        # Login + go to teacher's courses page
        login = LoginPage(driver).open()
        login.fill_form(email=email, password=password)
        login.click_submit()
        WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
        TeacherCoursesPage(driver).open().wait_until_loaded()
        WebDriverWait(driver, 10).until(
            lambda d: course_title in d.page_source
        )


# =============================================================================
# Section 5 — Edit (FR_006_017, FR_006_018)
# =============================================================================

class TestEditCourse:
    def _seed_and_open(self, driver, db_conn, seeded_metadata):
        email = _unique_email()
        password = "Abc123456"
        teacher_id = seed_user(
            db_conn, email=email, password_plain=password,
            full_name="EditTester", role="TEACHER",
        )
        course_title = f"EditMe {uuid.uuid4().hex[:6]}"
        course_id = seed_course(
            db_conn, teacher_id=teacher_id,
            subject_id=seeded_metadata["subject_id"],
            grade_level_id=seeded_metadata["grade_id"],
            title=course_title,
        )
        login = LoginPage(driver).open()
        login.fill_form(email=email, password=password)
        login.click_submit()
        WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
        page = TeacherCoursesPage(driver)
        page.open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: course_title in d.page_source)
        return page, teacher_id, course_id, course_title

    def test_FR_006_017_update_uses_alert_not_toast(
        self, driver, db_conn, seeded_metadata, cleanup_test_users
    ):
        """TC expects toast 'Cập nhật khóa học thành công!'. CourseModal.tsx
        L196 uses alert() — that's a Fail."""
        page, teacher_id, course_id, course_title = self._seed_and_open(
            driver, db_conn, seeded_metadata
        )
        edit_btn = page.find_edit_button_for(course_title)
        driver.execute_script("arguments[0].click();", edit_btn)
        modal = CourseModalPage(driver)
        assert modal.is_visible(), "Edit modal did not open"
        new_title = f"Updated {uuid.uuid4().hex[:6]}"
        modal.fill_title(new_title)
        modal.submit()

        alert_text = grab_alert_text(driver, timeout=8)
        # Confirm DB updated
        time.sleep(1)
        row = fetch_one(
            db_conn, "SELECT title FROM courses WHERE id = %s", (course_id,)
        )
        assert row and row["title"] == new_title, (
            f"DB not updated; row = {row!r}"
        )

        assert alert_text is None, (
            f"TC expects toast 'Cập nhật khóa học thành công!' but got "
            f"native alert: {alert_text!r}. CourseModal.tsx L196 calls "
            f"window.alert() on update success."
        )

    def test_FR_006_018_cancel_edit(
        self, driver, db_conn, seeded_metadata, cleanup_test_users
    ):
        page, _, course_id, course_title = self._seed_and_open(
            driver, db_conn, seeded_metadata
        )
        edit_btn = page.find_edit_button_for(course_title)
        driver.execute_script("arguments[0].click();", edit_btn)
        modal = CourseModalPage(driver)
        assert modal.is_visible()
        modal.fill_title(course_title + " (changed)")
        modal.cancel()
        time.sleep(0.5)
        # Modal should close + DB unchanged
        assert not modal.is_visible(timeout=2), "Modal did not close after Cancel"
        row = fetch_one(
            db_conn, "SELECT title FROM courses WHERE id = %s", (course_id,)
        )
        assert row["title"] == course_title, (
            f"Cancel should not save; DB title = {row['title']!r}"
        )


# =============================================================================
# Section 6 — Delete (FR_006_019, FR_006_020)
# =============================================================================

class TestDeleteCourse:
    def _seed_and_open(self, driver, db_conn, seeded_metadata):
        email = _unique_email()
        password = "Abc123456"
        teacher_id = seed_user(
            db_conn, email=email, password_plain=password,
            full_name="DelTester", role="TEACHER",
        )
        course_title = f"DeleteMe {uuid.uuid4().hex[:6]}"
        course_id = seed_course(
            db_conn, teacher_id=teacher_id,
            subject_id=seeded_metadata["subject_id"],
            grade_level_id=seeded_metadata["grade_id"],
            title=course_title,
        )
        login = LoginPage(driver).open()
        login.fill_form(email=email, password=password)
        login.click_submit()
        WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
        page = TeacherCoursesPage(driver)
        page.open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: course_title in d.page_source)
        return page, course_id, course_title

    def test_FR_006_019_delete_uses_native_confirm_and_alert(
        self, driver, db_conn, seeded_metadata, cleanup_test_users
    ):
        """TC expects a styled confirm dialog and a toast 'Xóa khóa học
        thành công!'. courses/page.tsx L113 uses confirm() and L117 uses
        alert() — both native browser dialogs, not in-app UI. Fail."""
        page, course_id, course_title = self._seed_and_open(
            driver, db_conn, seeded_metadata
        )
        del_btn = page.find_delete_button_for(course_title)
        driver.execute_script("arguments[0].click();", del_btn)
        # Expect native confirm; accept it
        time.sleep(0.3)
        try:
            confirm_alert = driver.switch_to.alert
            confirm_text = confirm_alert.text
            confirm_alert.accept()
        except NoAlertPresentException:
            confirm_text = None
        # Then expect native success alert
        success_text = grab_alert_text(driver, timeout=8)

        # Verify deletion happened
        time.sleep(1)
        row = fetch_one(
            db_conn, "SELECT id FROM courses WHERE id = %s", (course_id,)
        )
        assert row is None, "Course was not deleted from DB"

        # The native confirm IS the bug per TC — we expected an in-app
        # confirmation modal/toast, not window.confirm + window.alert.
        assert confirm_text is None and success_text is None, (
            f"TC expects an in-app confirm modal and a toast for delete "
            f"success. The page calls native window.confirm() (text seen: "
            f"{confirm_text!r}) and window.alert() (text seen: "
            f"{success_text!r}) instead — see courses/page.tsx L113 and L117."
        )

    def test_FR_006_020_cancel_delete(
        self, driver, db_conn, seeded_metadata, cleanup_test_users
    ):
        page, course_id, course_title = self._seed_and_open(
            driver, db_conn, seeded_metadata
        )
        del_btn = page.find_delete_button_for(course_title)
        driver.execute_script("arguments[0].click();", del_btn)
        time.sleep(0.3)
        try:
            confirm_alert = driver.switch_to.alert
            confirm_alert.dismiss()
        except NoAlertPresentException:
            pass
        time.sleep(1)
        # Course must still exist
        row = fetch_one(
            db_conn, "SELECT id FROM courses WHERE id = %s", (course_id,)
        )
        assert row is not None, "Course was deleted even though confirm was canceled"
