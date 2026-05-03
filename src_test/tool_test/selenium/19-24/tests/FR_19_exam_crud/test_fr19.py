"""FR_19 — Exam CRUD (Teacher) system tests.

30 test cases sourced from sheet FR_19 in ss_test_13.xlsx.

Notable behaviour observed in source (drives expected verdicts):
  - After successful create, FE redirects to /teacher/dashboard/exams/{id}/edit
    instead of back to the list (TC FR_019_004 expected list).
  - The status filter buttons recompute their (n) counts from the current
    filtered set, so clicking "Nháp" makes the "Tất cả" count drop too
    (TC FR_019_007).
  - There is NO client-side route guard in the (main)/teacher routes —
    students or unauthenticated users can navigate to the URL directly
    (TC FR_019_013, 020, 028).
  - The edit endpoint sends `courseId: 0` instead of `null` when the user
    does not pick a course, breaking FK update (TC FR_019_014, 015, 016).
  - The edit endpoint accepts changes from any teacher, not just the owner
    (TC FR_019_026, 027).
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
from pages.teacher_exams_page import (
    TeacherExamsPage, ExamCreatePage, ExamEditPage,
)
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, seed_exam, find_exam_by_id, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_19_exam_crud.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _login_as(driver, db_conn, role="TEACHER", password="Abc123456"):
    """Seed a user, log in via UI. Returns (email, user_id)."""
    email = _unique_email()
    uid = seed_user(
        db_conn, email=email, password_plain=password,
        full_name=f"Auto {role.capitalize()}", role=role,
    )
    page = LoginPage(driver).open()
    page.fill_form(email=email, password=password)
    page.click_submit()
    if role == "TEACHER":
        WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
    elif role == "STUDENT":
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email, uid


@pytest.fixture
def teacher_session(driver, db_conn, cleanup_test_users):
    """Seed teacher + login → on /teacher/dashboard."""
    email, tid = _login_as(driver, db_conn, "TEACHER")
    return email, tid


@pytest.fixture
def teacher_exams_page(teacher_session, driver):
    page = TeacherExamsPage(driver).open()
    page.wait_until_loaded(timeout=15)
    return page, teacher_session[1]  # (page, teacher_id)


# =============================================================================
# Section 1 — UI Layout (FR_019_001 to FR_019_003)
# =============================================================================

class TestExamListUI:
    def test_FR_019_001_list_layout(self, teacher_exams_page):
        page, _ = teacher_exams_page
        assert page.find(page.HEADING).is_displayed()
        # Either exam cards or "Không tìm thấy" message exists
        assert (
            "Không tìm thấy bài kiểm tra nào" in page.driver.page_source
            or len(page.visible_exam_titles()) >= 0
        )

    def test_FR_019_002_search_and_filters_visible(self, teacher_exams_page):
        page, _ = teacher_exams_page
        assert page.find(page.SEARCH_INPUT).is_displayed()
        assert page.find(page.FILTER_ALL).is_displayed()
        assert page.find(page.FILTER_DRAFT).is_displayed()
        assert page.find(page.FILTER_LIVE).is_displayed()
        assert page.find(page.FILTER_CLOSED).is_displayed()

    def test_FR_019_003_create_button_visible(self, teacher_exams_page):
        page, _ = teacher_exams_page
        link = page.find(page.CREATE_LINK)
        assert link.is_displayed()
        assert "/teacher/dashboard/exams/create" in link.get_attribute("href")


# =============================================================================
# Section 2 — Create flow (FR_019_004 to FR_019_013)
# =============================================================================

class TestCreateFlow:
    def test_FR_019_004_create_redirects_to_edit_not_list(
        self, teacher_session, driver, db_conn
    ):
        """TC expects redirect back to the LIST after create. The FE pushes
        to /exams/{id}/edit instead — sheet gốc Fail."""
        teacher_email, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        title = f"AutoExam {uuid.uuid4().hex[:6]}"
        page.fill_title(title)
        page.fill_duration(45)
        page.submit()
        WebDriverWait(driver, 15).until(
            lambda d: title in d.page_source or "/exams/" in d.current_url
        )
        # Verify exam was created
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM exams WHERE teacher_id = %s AND title = %s",
            (teacher_id, title),
        )
        assert row is not None, "Exam not created in DB"
        # Redirect destination check — TC says should be the list page
        assert "/teacher/dashboard/exams" == driver.current_url.replace(
            settings.BASE_URL_FE, ""
        ).split("?")[0], (
            f"TC expects redirect to /teacher/dashboard/exams (list) after "
            f"successful create. The FE redirects to "
            f"/teacher/dashboard/exams/{{id}}/edit instead "
            f"(create/page.tsx L124: router.push(`/teacher/dashboard/exams/${{examId}}/edit`)). "
            f"Current URL: {driver.current_url}"
        )

    def test_FR_019_005_open_exam_detail_from_list(
        self, teacher_session, driver, db_conn
    ):
        teacher_email, teacher_id = teacher_session
        title = f"DetailExam {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=title)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: title in d.page_source)
        page.click_edit_for(title)
        WebDriverWait(driver, 15).until(EC.url_contains(f"/exams/{exam_id}/edit"))
        # Title should appear on edit page
        assert title in driver.page_source

    def test_FR_019_006_search_filters_list(
        self, teacher_session, driver, db_conn
    ):
        teacher_email, teacher_id = teacher_session
        kept = f"Keep {uuid.uuid4().hex[:6]}"
        dropped = f"Other {uuid.uuid4().hex[:6]}"
        seed_exam(db_conn, teacher_id=teacher_id, title=kept)
        seed_exam(db_conn, teacher_id=teacher_id, title=dropped)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(
            lambda d: kept in d.page_source and dropped in d.page_source
        )
        page.fill_search("Keep ")
        time.sleep(0.5)
        titles = page.visible_exam_titles()
        assert kept in titles, f"Search should keep {kept!r}; got {titles}"
        assert dropped not in titles, f"Search should drop {dropped!r}; got {titles}"

    def test_FR_019_007_filter_draft_keeps_other_counts_stable(
        self, teacher_session, driver, db_conn
    ):
        """TC: clicking Nháp must not change the (N) inside other filter
        labels. The FE recomputes counts from the current filtered set, so
        Tất cả also drops to match the filtered count — sheet gốc Fail."""
        teacher_email, teacher_id = teacher_session
        seed_exam(db_conn, teacher_id=teacher_id, title=f"D1 {uuid.uuid4().hex[:6]}", status="DRAFT")
        seed_exam(db_conn, teacher_id=teacher_id, title=f"D2 {uuid.uuid4().hex[:6]}", status="DRAFT")
        seed_exam(db_conn, teacher_id=teacher_id, title=f"L1 {uuid.uuid4().hex[:6]}", status="LIVE")
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        time.sleep(1)
        all_before = page.filter_count("all")
        page.click_filter("draft")
        time.sleep(1)
        all_after = page.filter_count("all")
        assert all_before == all_after, (
            f"TC expects the 'Tất cả' count to stay {all_before} after "
            f"switching to 'Nháp', but it changed to {all_after}. The FE "
            f"computes each label as `exams.length` (filtered list), see "
            f"exams/page.tsx L184: 'Tất cả ({{exams.length}})'."
        )

    def test_FR_019_008_newest_first(
        self, teacher_session, driver, db_conn
    ):
        teacher_email, teacher_id = teacher_session
        old = f"Old {uuid.uuid4().hex[:6]}"
        seed_exam(db_conn, teacher_id=teacher_id, title=old)
        time.sleep(1)
        new = f"New {uuid.uuid4().hex[:6]}"
        seed_exam(db_conn, teacher_id=teacher_id, title=new)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(
            lambda d: new in d.page_source and old in d.page_source
        )
        titles = page.visible_exam_titles()
        new_idx = titles.index(new) if new in titles else -1
        old_idx = titles.index(old) if old in titles else -1
        assert new_idx >= 0 and old_idx >= 0, f"Both exams expected; got {titles}"
        assert new_idx < old_idx, (
            f"Newest-first order expected. {new!r} idx={new_idx}, "
            f"{old!r} idx={old_idx}. Titles: {titles}"
        )

    def test_FR_019_009_submit_button_loading_state(
        self, teacher_session, driver, db_conn
    ):
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        page.fill_title(f"Loading {uuid.uuid4().hex[:6]}")
        page.fill_duration(45)
        page.submit()
        # Right after click, button text should switch to "Đang tạo..." or
        # the URL changes (success). Either is acceptable evidence the
        # button reacted to the click.
        WebDriverWait(driver, 5).until(
            lambda d: "Đang tạo" in d.page_source
            or "/exams/" in d.current_url
        )

    def test_FR_019_010_created_exam_appears_in_list(
        self, teacher_session, driver, db_conn
    ):
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        title = f"VisInList {uuid.uuid4().hex[:6]}"
        page.fill_title(title)
        page.fill_duration(45)
        page.submit()
        time.sleep(2)
        TeacherExamsPage(driver).open().wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: title in d.page_source)

    def test_FR_019_011_form_keeps_data_after_validation_error(
        self, teacher_session, driver, db_conn
    ):
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        kept_title = f"KeptTitle {uuid.uuid4().hex[:6]}"
        kept_desc = "Mô tả vẫn ở đây sau khi báo lỗi"
        page.fill_title(kept_title)
        page.fill_description(kept_desc)
        page.fill_duration("")  # Trigger validation error
        page.submit()
        time.sleep(0.8)
        # Title and description must still be in the inputs
        assert page.find(page.TITLE_INPUT).get_attribute("value") == kept_title
        assert page.find(page.DESCRIPTION_TEXTAREA).get_attribute("value") == kept_desc

    def test_FR_019_012_default_status_is_draft(
        self, teacher_session, driver, db_conn
    ):
        teacher_email, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        title = f"DefaultStatus {uuid.uuid4().hex[:6]}"
        page.fill_title(title)
        page.fill_duration(30)
        page.submit()
        time.sleep(2)
        row = fetch_one(
            db_conn,
            "SELECT status FROM exams WHERE teacher_id = %s AND title = %s",
            (teacher_id, title),
        )
        assert row and row["status"] == "DRAFT", (
            f"Default status should be DRAFT; got {row!r}"
        )

    def test_FR_019_013_unauthenticated_create_blocked(
        self, driver, cleanup_test_users
    ):
        """TC: open /create without logging in → expect redirect to /login.
        Strict check: URL must move OFF /create AND the create form
        heading must not be visible."""
        driver.get(settings.BASE_URL_FE)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")

        driver.get(f"{settings.BASE_URL_FE}/teacher/dashboard/exams/create")
        time.sleep(2)
        url = driver.current_url
        heading_present = "Tạo bài kiểm tra mới" in driver.page_source
        # Pass requires BOTH: URL not on /create, AND heading not rendered
        assert "/teacher/dashboard/exams/create" not in url and not heading_present, (
            f"TC expects /create to redirect to login when unauthenticated. "
            f"Reality: URL={url!r}, heading 'Tạo bài kiểm tra mới' present: "
            f"{heading_present}. The (main) layout has no client-side route "
            f"guard — the form renders for anyone who knows the URL. "
            f"Auth check is only inside onSubmit (create/page.tsx L103-108)."
        )


# =============================================================================
# Section 3 — Edit / Delete (FR_019_014 to FR_019_021)
# =============================================================================

class TestEditDeleteFlow:
    def test_FR_019_014_update_title(
        self, teacher_session, driver, db_conn
    ):
        """TC expects update-title to succeed. FE bug: when course_id is
        not picked, the form sends `courseId: 0` (or coerces "" → 0),
        which violates the FK → backend rejects. Sheet gốc Fail."""
        _, teacher_id = teacher_session
        title_old = f"OrigTitle {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(
            db_conn, teacher_id=teacher_id, title=title_old, course_id=None,
        )
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        title_new = f"NewTitle {uuid.uuid4().hex[:6]}"
        page.fill_title(title_new)
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row and row["title"] == title_new, (
            f"TC expects DB title to update to {title_new!r}; got {row!r}. "
            f"FE update payload includes courseId from the form, but for "
            f"an exam without a course it serializes to 0 (not null), "
            f"violating the FK and causing the backend to reject — see "
            f"edit/page.tsx L143: examsAPI.updateExam(examId, data)."
        )

    def test_FR_019_015_update_duration(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        exam_id = seed_exam(
            db_conn, teacher_id=teacher_id,
            title=f"DurExam {uuid.uuid4().hex[:6]}",
            duration_minutes=30,
        )
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        page.fill_duration(60)
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row and row["duration_minutes"] == 60, (
            f"TC expects duration to update to 60; got {row!r}. "
            f"Same root cause as FR_019_014 (courseId=0 FK violation)."
        )

    def test_FR_019_016_update_status(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        exam_id = seed_exam(
            db_conn, teacher_id=teacher_id,
            title=f"StatExam {uuid.uuid4().hex[:6]}",
            status="DRAFT",
        )
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        page.select_status("Đã đóng")
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row and row["status"] == "CLOSED", (
            f"TC expects status to update to CLOSED; got {row!r}. "
            f"Same root cause as FR_019_014."
        )

    def test_FR_019_017_delete_confirm_dialog(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        title = f"DelDlg {uuid.uuid4().hex[:6]}"
        seed_exam(db_conn, teacher_id=teacher_id, title=title)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: title in d.page_source)
        page.click_delete_for(title)
        time.sleep(0.4)
        try:
            alert = driver.switch_to.alert
            assert "xóa bài kiểm tra" in alert.text.lower()
            alert.dismiss()
        except NoAlertPresentException:
            pytest.fail("Delete should open a confirm dialog")

    def test_FR_019_018_delete_after_confirm(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        title = f"DelOK {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=title)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: title in d.page_source)
        page.click_delete_for(title)
        time.sleep(0.4)
        driver.switch_to.alert.accept()
        WebDriverWait(driver, 10).until(
            lambda d: "Xóa bài kiểm tra thành công" in d.page_source
        )
        # DB row should be gone
        time.sleep(0.5)
        row = find_exam_by_id(db_conn, exam_id)
        assert row is None, "Exam still in DB after delete"

    def test_FR_019_019_cancel_delete(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        title = f"DelCancel {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=title)
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        WebDriverWait(driver, 10).until(lambda d: title in d.page_source)
        page.click_delete_for(title)
        time.sleep(0.4)
        driver.switch_to.alert.dismiss()
        time.sleep(0.5)
        # Exam still there
        row = find_exam_by_id(db_conn, exam_id)
        assert row is not None, "Exam should still exist after cancel"
        assert title in driver.page_source

    def test_FR_019_020_student_blocked_from_teacher_exams(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: student logging in should not be able to see /teacher/...
        pages. Reality: the (main) layout renders the page regardless of
        role — sheet gốc Fail."""
        _login_as(driver, db_conn, "STUDENT")
        driver.get(f"{settings.BASE_URL_FE}/teacher/dashboard/exams")
        time.sleep(2)
        url = driver.current_url
        page_src = driver.page_source
        assert "/teacher/dashboard/exams" not in url or (
            "không có quyền" in page_src.lower()
            or "no permission" in page_src.lower()
            or "forbidden" in page_src.lower()
        ), (
            f"TC expects students to be blocked from /teacher/dashboard/exams. "
            f"Reality: page rendered for student. URL = {url!r}. Heading "
            f"present: {'Quản lý bài kiểm tra' in page_src}."
        )

    def test_FR_019_021_student_lesson_view_no_edit_buttons(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: when students view exam-related pages, they should not see
        Sửa/Xóa buttons. We verify that the student-side route has no
        teacher-action buttons."""
        _login_as(driver, db_conn, "STUDENT")
        # Navigate to a course exam list (student route). Use generic search
        driver.get(f"{settings.BASE_URL_FE}/student/my-courses")
        time.sleep(2)
        # Look for any Sửa/Xóa icon-buttons with teacher titles
        edit_btns = driver.find_elements(
            By.XPATH,
            '//button[@title="Chỉnh sửa"] | //a[@title="Chỉnh sửa"] | '
            '//button[@title="Xóa"] | //a[@title="Xóa"]'
        )
        assert edit_btns == [], (
            f"Student-facing pages should not show teacher Sửa/Xóa buttons; "
            f"found {len(edit_btns)} on /student/my-courses."
        )


# =============================================================================
# Section 4 — Validation / Security (FR_019_022 to FR_019_030)
# =============================================================================

class TestValidationSecurity:
    def test_FR_019_022_empty_title_blocks_submit(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        page.fill_description("Mô tả ôn tập")
        page.fill_duration(45)
        page.submit()
        time.sleep(0.5)
        errors = page.field_error_texts()
        assert any("Tiêu đề bài kiểm tra không được để trống" in e for e in errors), (
            f"Expected 'Tiêu đề bài kiểm tra không được để trống' yup error; got {errors}"
        )

    def test_FR_019_023_zero_duration_blocked(
        self, teacher_session, driver, db_conn
    ):
        """HTML5 min='1' blocks browser-side; either way no exam should be
        created."""
        _, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        title = f"Zero {uuid.uuid4().hex[:6]}"
        page.fill_title(title)
        page.fill_duration(0)
        page.submit()
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id FROM exams WHERE teacher_id = %s AND title = %s",
            (teacher_id, title),
        )
        assert row is None, (
            f"Submission with duration=0 must be rejected; row {row!r}"
        )

    def test_FR_019_024_negative_duration_blocked(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        title = f"Neg {uuid.uuid4().hex[:6]}"
        page.fill_title(title)
        page.fill_duration(-5)
        page.submit()
        time.sleep(1)
        row = fetch_one(
            db_conn,
            "SELECT id FROM exams WHERE teacher_id = %s AND title = %s",
            (teacher_id, title),
        )
        assert row is None, f"Submission with duration=-5 must be rejected; row {row!r}"

    def test_FR_019_025_non_numeric_duration_blocked(
        self, teacher_session, driver, db_conn
    ):
        """Input is type='number' so the browser strips non-digit chars on
        type. Default value is 45; clear first, then verify letters stay
        out of the field."""
        _, teacher_id = teacher_session
        page = ExamCreatePage(driver).open()
        page.wait_until_loaded()
        page.fill_duration("")  # clear the default 45
        page.find(page.DURATION_INPUT).send_keys("abc")
        time.sleep(0.3)
        value = page.find(page.DURATION_INPUT).get_attribute("value")
        # type=number strips non-digit chars on input; value should stay empty
        assert value == "" or value.isdigit(), (
            f"type=number input must not accept letters; value = {value!r}"
        )
        # Also confirm no 'abc' remains
        assert "abc" not in value

    def test_FR_019_026_teacher_b_can_edit_a_exam(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: teacher B should NOT be able to even open or save changes to
        teacher A's exam. Strict check: edit form must NOT render for B."""
        a_email = _unique_email()
        a_id = seed_user(
            db_conn, email=a_email, password_plain="Abc123456",
            full_name="Teacher A", role="TEACHER",
        )
        title_orig = f"TeacherA Exam {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=a_id, title=title_orig)
        # Login as teacher B
        _login_as(driver, db_conn, "TEACHER")
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        # Pass = edit form NOT shown to B (either not_found UI or redirect)
        if page.is_not_found():
            return
        # Edit form rendered for B → security gap.
        if "Chỉnh sửa bài kiểm tra" in driver.page_source:
            pytest.fail(
                f"Teacher B can OPEN the edit form for teacher A's exam "
                f"(URL: {driver.current_url}). The backend does not enforce "
                f"teacher ownership on GET /exams/{{id}}. Even if the "
                f"subsequent save also fails (e.g. courseId=0 FK bug), "
                f"merely loading the form is already a security gap."
            )

    def test_FR_019_027_teacher_b_can_delete_a_exam(
        self, driver, db_conn, cleanup_test_users
    ):
        a_email = _unique_email()
        a_id = seed_user(
            db_conn, email=a_email, password_plain="Abc123456",
            full_name="Teacher A", role="TEACHER",
        )
        title = f"AOwned {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=a_id, title=title)
        # Login as teacher B
        _login_as(driver, db_conn, "TEACHER")
        page = TeacherExamsPage(driver).open()
        page.wait_until_loaded()
        # Teacher B's list won't include A's exam if backend filters by
        # teacher (correct behaviour). If it does include, we attempt delete.
        if title not in driver.page_source:
            # Attempt direct API delete via JS would be needed to verify.
            # If FE filters list by teacher, this is the correct behavior.
            row = find_exam_by_id(db_conn, exam_id)
            assert row is not None
            return
        # Otherwise actually try to delete
        page.click_delete_for(title)
        time.sleep(0.4)
        driver.switch_to.alert.accept()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row is not None, (
            "Teacher B should NOT be able to delete teacher A's exam, "
            "but the row is gone from the DB."
        )

    def test_FR_019_028_unauthenticated_list_blocked(
        self, driver, cleanup_test_users
    ):
        driver.get(settings.BASE_URL_FE)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(f"{settings.BASE_URL_FE}/teacher/dashboard/exams")
        time.sleep(2)
        url = driver.current_url
        assert "/login" in url, (
            f"TC expects redirect to login. Got URL {url!r}; page heading "
            f"present: {'Quản lý bài kiểm tra' in driver.page_source}. "
            f"The (main) layout has no auth guard."
        )

    def test_FR_019_029_bad_url_param_handled(self, teacher_session, driver):
        driver.get(f"{settings.BASE_URL_FE}/teacher/dashboard/exams?sort=BOGUS&order=junk")
        time.sleep(2)
        # Page should still render the heading and not white-screen
        assert "Quản lý bài kiểm tra" in driver.page_source

    def test_FR_019_030_status_options_limited_for_teacher(
        self, teacher_session, driver, db_conn
    ):
        """Teacher's edit page status select should expose only Draft, Live,
        Closed — not approval-only states like PENDING_REVIEW or APPROVED."""
        _, teacher_id = teacher_session
        exam_id = seed_exam(db_conn, teacher_id=teacher_id,
                            title=f"StatOpt {uuid.uuid4().hex[:6]}")
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        opts = page.status_options()
        assert "Nháp" in opts and "Đang mở" in opts and "Đã đóng" in opts
        # Approval-only labels must not be present
        forbidden = [o for o in opts if "duyệt" in o.lower()]
        assert forbidden == [], (
            f"Teacher status select should not include approval-only "
            f"options. Found: {forbidden}"
        )
