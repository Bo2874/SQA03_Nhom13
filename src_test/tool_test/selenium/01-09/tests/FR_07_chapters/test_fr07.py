"""FR_07 — Chapter management (Teacher) system tests.

17 test cases sourced from sheet FR_07 in ss_test_13.xlsx.

Implementation notes (relevant to results):
  - ChapterModal calls native alert() on create (L86) and update (L82)
    success — TC expects toast notification, so those success-path TCs
    fail with a clear root-cause Note.
  - The chapter delete flow on courses/[id]/page.tsx uses native
    confirm() (L95) and alert() (L99) — same alert-vs-toast deviation.
  - Chapters CASCADE-delete from Course; Episodes CASCADE-delete from
    Chapter (entity decorators set onDelete: 'CASCADE').
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
from pages.teacher_course_detail_page import (
    TeacherCourseDetailPage, ChapterModalPage
)
from pages.teacher_courses_page import grab_alert_text
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user,
    get_or_create_subject,
    get_or_create_grade_level,
    seed_course,
    seed_chapter,
    seed_episode,
    fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_07_chapter_management.csv")}


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
def course_with_teacher(driver, db_conn, metadata_ids, cleanup_test_users):
    """Seed a teacher + DRAFT course, log in via UI, navigate to the
    course detail page on the Chapters tab. Yields (page, teacher_id,
    course_id, course_title)."""
    email = _unique_email()
    password = "Abc123456"
    teacher_id = seed_user(
        db_conn, email=email, password_plain=password,
        full_name="ChapterTeacher", role="TEACHER",
    )
    course_title = f"Course {uuid.uuid4().hex[:6]}"
    course_id = seed_course(
        db_conn, teacher_id=teacher_id,
        subject_id=metadata_ids["subject_id"],
        grade_level_id=metadata_ids["grade_id"],
        title=course_title,
    )
    login = LoginPage(driver).open()
    login.fill_form(email=email, password=password)
    login.click_submit()
    WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
    page = TeacherCourseDetailPage(driver, course_id=course_id)
    page.open()
    page.wait_until_loaded()
    page.goto_chapters_tab()
    return page, teacher_id, course_id, course_title


# =============================================================================
# Section 1 — UI/UX (FR_007_001 to FR_007_003)
# =============================================================================

class TestChapterModalUI:
    def test_FR_007_001_course_detail_shows_add_chapter(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        assert page.add_chapter_button_visible(), (
            "Expected an 'Thêm chương mới' (Add chapter) button on the "
            "course detail Chapters tab for a DRAFT course."
        )

    def test_FR_007_002_modal_layout(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        assert "Thêm chương mới" in modal.heading_text()
        # Cancel + submit buttons present
        assert page.driver.find_element(*modal.CANCEL_BUTTON).is_displayed()
        assert "Tạo chương" in modal.submit_button_text()

    def test_FR_007_003_placeholders(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        assert (
            modal.title_placeholder()
            == "Ví dụ: Chương 1: Đường thẳng và mặt phẳng trong không gian"
        )
        assert modal.order_placeholder() == "1, 2, 3, ..."


# =============================================================================
# Section 2 — Add chapter (FR_007_004 to FR_007_010)
# =============================================================================

class TestAddChapter:
    def test_FR_007_004_create_uses_alert_not_toast(
        self, course_with_teacher, db_conn
    ):
        """TC expects toast 'Tạo chương mới thành công!'. ChapterModal.tsx
        L86 calls window.alert() instead — fail with explanatory note."""
        page, _, course_id, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        title = f"Chương AutoTest {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(1)
        modal.submit()

        alert_text = grab_alert_text(page.driver, timeout=8)
        # Verify DB persisted the chapter so we know save itself worked
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM chapters WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is not None, "Chapter was not saved in DB"
        assert alert_text is None, (
            f"TC expects toast 'Tạo chương mới thành công!' but ChapterModal.tsx "
            f"L86 calls window.alert() instead. Native alert seen: {alert_text!r}. "
            f"Chapter was created in DB; only the success-delivery channel is wrong."
        )

    def test_FR_007_005_empty_title(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_order(1)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("Tiêu đề chương không được để trống" in e for e in errors), (
            f"Expected 'Tiêu đề chương không được để trống'; got {errors}"
        )

    def test_FR_007_006_title_too_short(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("ABCD")
        modal.fill_order(1)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("ít nhất 5 ký tự" in e for e in errors), (
            f"Expected 'Tiêu đề phải có ít nhất 5 ký tự'; got {errors}"
        )

    def test_FR_007_007_title_too_long(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("X" * 201)
        modal.fill_order(1)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("không được vượt quá 200 ký tự" in e for e in errors), (
            f"Expected 'Tiêu đề không được vượt quá 200 ký tự'; got {errors}"
        )

    def test_FR_007_008_order_zero(self, course_with_teacher, db_conn):
        """TC: order = 0 must be rejected. The input has HTML5 `min="1"`,
        so the browser blocks submission before yup can show its Vietnamese
        error message. Either way, the user is prevented from saving — we
        verify nothing was created in DB and the modal is still open."""
        page, _, course_id, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        title = f"Block0 {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(0)
        modal.submit()
        time.sleep(1)
        # Either the inline yup error appears, or the form was simply
        # blocked from submitting — but no chapter must exist in DB.
        row = fetch_one(
            db_conn,
            "SELECT id FROM chapters WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is None, (
            f"Submission with order=0 should be rejected, but a chapter "
            f"row was created in DB: {row!r}"
        )

    def test_FR_007_009_order_negative(self, course_with_teacher, db_conn):
        page, _, course_id, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        title = f"BlockNeg {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.fill_order(-1)
        modal.submit()
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id FROM chapters WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is None, (
            f"Submission with order=-1 should be rejected, but a chapter "
            f"row was created: {row!r}"
        )

    def test_FR_007_010_empty_order(self, course_with_teacher):
        page, _, _, _ = course_with_teacher
        page.click_add_chapter()
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("Valid title here")
        modal.fill_order("")
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        # The yup schema first runs typeError when number can't be coerced,
        # then required when value is missing — accept either as valid blocking.
        assert any(
            "Thứ tự không được để trống" in e
            or "Thứ tự phải là số" in e
            for e in errors
        ), (
            f"Expected an order-required / type error; got {errors}"
        )


# =============================================================================
# Section 3 — Edit chapter (FR_007_011 to FR_007_012)
# =============================================================================

class TestEditChapter:
    def test_FR_007_011_edit_uses_alert_not_toast(
        self, course_with_teacher, db_conn
    ):
        page, _, course_id, _ = course_with_teacher
        chapter_title = f"Edit Me {uuid.uuid4().hex[:6]}"
        chapter_id = seed_chapter(db_conn, course_id=course_id,
                                  title=chapter_title, order=1)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_edit_for(chapter_title)
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        new_title = f"Updated {uuid.uuid4().hex[:6]}"
        modal.fill_title(new_title)
        modal.submit()
        alert_text = grab_alert_text(page.driver, timeout=8)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT title FROM chapters WHERE id = %s", (chapter_id,)
        )
        assert row and row["title"] == new_title, (
            f"DB chapter title not updated; row = {row!r}"
        )
        assert alert_text is None, (
            f"TC expects toast 'Cập nhật chương thành công!' but ChapterModal.tsx "
            f"L82 calls window.alert(). Native alert seen: {alert_text!r}."
        )

    def test_FR_007_012_edit_order(self, course_with_teacher, db_conn):
        page, _, course_id, _ = course_with_teacher
        chapter_title = f"OrderTest {uuid.uuid4().hex[:6]}"
        chapter_id = seed_chapter(db_conn, course_id=course_id,
                                  title=chapter_title, order=1)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_edit_for(chapter_title)
        modal = ChapterModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_order(7)
        modal.submit()
        # Accept the alert if it appears, then verify DB
        grab_alert_text(page.driver, timeout=8)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT `order` FROM chapters WHERE id = %s", (chapter_id,)
        )
        assert row and row["order"] == 7, (
            f"Order not updated in DB; got {row!r}"
        )


# =============================================================================
# Section 4 — Delete chapter (FR_007_013 to FR_007_015)
# =============================================================================

class TestDeleteChapter:
    def _seed_chapter(self, db_conn, course_id, title=None):
        title = title or f"Del {uuid.uuid4().hex[:6]}"
        return seed_chapter(db_conn, course_id=course_id, title=title), title

    def test_FR_007_013_delete_uses_native_confirm_and_alert(
        self, course_with_teacher, db_conn
    ):
        page, _, course_id, _ = course_with_teacher
        chapter_id, chapter_title = self._seed_chapter(db_conn, course_id)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_delete_for(chapter_title)
        time.sleep(0.3)
        try:
            confirm = page.driver.switch_to.alert
            confirm_text = confirm.text
            confirm.accept()
        except NoAlertPresentException:
            confirm_text = None
        success_text = grab_alert_text(page.driver, timeout=8)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT id FROM chapters WHERE id = %s", (chapter_id,)
        )
        assert row is None, "Chapter was not deleted from DB"
        assert confirm_text is None and success_text is None, (
            f"TC expects an in-app confirm modal and a toast for delete success. "
            f"courses/[id]/page.tsx L95 calls window.confirm() (text: "
            f"{confirm_text!r}) and L99 calls window.alert() (text: "
            f"{success_text!r}) — both native browser dialogs."
        )

    def test_FR_007_014_cancel_delete(self, course_with_teacher, db_conn):
        page, _, course_id, _ = course_with_teacher
        chapter_id, chapter_title = self._seed_chapter(db_conn, course_id)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_delete_for(chapter_title)
        time.sleep(0.3)
        try:
            confirm = page.driver.switch_to.alert
            confirm.dismiss()
        except NoAlertPresentException:
            pass
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT id FROM chapters WHERE id = %s", (chapter_id,)
        )
        assert row is not None, (
            "Chapter was deleted even though the user dismissed the confirm dialog."
        )

    def test_FR_007_015_delete_chapter_with_episodes_cascades(
        self, course_with_teacher, db_conn
    ):
        page, _, course_id, _ = course_with_teacher
        chapter_id, chapter_title = self._seed_chapter(db_conn, course_id)
        ep1 = seed_episode(db_conn, chapter_id=chapter_id, title="Ep 1", order=1)
        ep2 = seed_episode(db_conn, chapter_id=chapter_id, title="Ep 2", order=2)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        page.click_delete_for(chapter_title)
        time.sleep(0.3)
        try:
            page.driver.switch_to.alert.accept()  # confirm
        except NoAlertPresentException:
            pass
        grab_alert_text(page.driver, timeout=8)  # accept the success alert
        time.sleep(0.5)
        # Chapter and its episodes should both be gone (CASCADE on chapter side).
        chapter_row = fetch_one(
            db_conn, "SELECT id FROM chapters WHERE id = %s", (chapter_id,)
        )
        ep1_row = fetch_one(
            db_conn, "SELECT id FROM episodes WHERE id = %s", (ep1,)
        )
        ep2_row = fetch_one(
            db_conn, "SELECT id FROM episodes WHERE id = %s", (ep2,)
        )
        assert chapter_row is None, "Chapter not deleted"
        assert ep1_row is None and ep2_row is None, (
            "Episodes should cascade-delete with their chapter; rows still in DB."
        )


# =============================================================================
# Section 5 — Expand / collapse (FR_007_016, FR_007_017)
# =============================================================================

class TestExpandCollapse:
    def test_FR_007_016_expand_chapter(self, course_with_teacher, db_conn):
        page, _, course_id, _ = course_with_teacher
        chapter_title = f"Exp {uuid.uuid4().hex[:6]}"
        chapter_id = seed_chapter(db_conn, course_id=course_id,
                                  title=chapter_title, order=1)
        seed_episode(db_conn, chapter_id=chapter_id, title="LessonOne", order=1)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        # Initially collapsed → episode list area not displayed
        assert not page.episodes_visible_under(chapter_title), (
            "Chapter appeared expanded by default — episode area should be hidden initially."
        )
        page.click_toggle_for(chapter_title)
        time.sleep(0.5)
        WebDriverWait(page.driver, 5).until(
            lambda d: "LessonOne" in d.page_source
        )

    def test_FR_007_017_collapse_chapter(self, course_with_teacher, db_conn):
        page, _, course_id, _ = course_with_teacher
        chapter_title = f"Col {uuid.uuid4().hex[:6]}"
        chapter_id = seed_chapter(db_conn, course_id=course_id,
                                  title=chapter_title, order=1)
        seed_episode(db_conn, chapter_id=chapter_id, title="VisLesson", order=1)
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_chapters_tab()
        WebDriverWait(page.driver, 10).until(
            lambda d: chapter_title in d.page_source
        )
        # Expand first
        page.click_toggle_for(chapter_title)
        WebDriverWait(page.driver, 5).until(
            lambda d: "VisLesson" in d.page_source
        )
        # Then collapse
        page.click_toggle_for(chapter_title)
        time.sleep(0.5)
        # After collapse, the lesson title should NOT be visible
        lesson_els = page.driver.find_elements(
            By.XPATH, f'//h4[normalize-space()="VisLesson"]'
        )
        assert all(not el.is_displayed() for el in lesson_els), (
            "Lesson titles should be hidden after collapsing the chapter."
        )
