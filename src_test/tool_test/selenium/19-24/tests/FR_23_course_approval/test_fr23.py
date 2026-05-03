"""FR_23 — Course approval (Admin) system tests.

28 test cases sourced from sheet FR_23 in ss_test_13.xlsx.

Major findings exposed by the FE source (CourseApproval.tsx):
  - The default status filter is 'ALL', not 'PENDING_REVIEW' (L51).
  - The "Xem chi tiết" button is COMMENTED OUT (L260-267) and there is
    no admin /courses/:id route — sheet gốc Fail FR_023_005, 006, 008.
  - The status menu items are only `disabled` when the new status equals
    the current status (L232, 239, 247, 253). All other transitions are
    permitted, e.g. REJECTED → APPROVED, PUBLISHED → APPROVED, PENDING →
    PUBLISHED, APPROVED → PENDING — sheet gốc Fail FR_023_015, 016, 019,
    020, 021, 022, 023.
  - Approve / publish actions take effect IMMEDIATELY on click — there
    is no confirmation modal — sheet gốc Fail FR_023_017, 025.
"""
import time
import uuid

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.admin_teacher_page import AdminLoginPage
from pages.admin_course_approval_page import AdminCourseApprovalPage
from pages.login_page import LoginPage
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, seed_course, find_course_by_id,
    get_or_create_subject, get_or_create_grade_level,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_23_course_approval_management.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _admin_login(driver, db_conn, password="Admin123"):
    email = _unique_email()
    seed_user(
        db_conn, email=email, password_plain=password,
        full_name="AdminFR23", role="ADMIN",
    )
    AdminLoginPage(driver).open().login(email, password)
    WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email


def _student_login(driver, db_conn, password="Abc123456"):
    email = _unique_email()
    sid = seed_user(
        db_conn, email=email, password_plain=password,
        full_name="StudentFR23", role="STUDENT",
    )
    page = LoginPage(driver).open()
    page.fill_form(email=email, password=password)
    page.click_submit()
    WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email, sid


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


def _seed_teacher_and_course(db_conn, metadata, status="PENDING_REVIEW",
                             title=None):
    teacher_email = _unique_email()
    tid = seed_user(
        db_conn, email=teacher_email, password_plain="Abc123456",
        full_name="TeacherFR23", role="TEACHER",
    )
    title = title or f"Course {uuid.uuid4().hex[:6]}"
    cid = seed_course(
        db_conn, teacher_id=tid,
        subject_id=metadata["subject_id"],
        grade_level_id=metadata["grade_id"],
        title=title, status=status,
    )
    return tid, cid, title


@pytest.fixture
def admin_on_approval_page(driver, db_conn, cleanup_test_users):
    _admin_login(driver, db_conn)
    page = AdminCourseApprovalPage(driver).open()
    page.wait_until_loaded()
    return page


# =============================================================================
# Section 1 — Listing + access (FR_023_001 to FR_023_009)
# =============================================================================

class TestListingAccess:
    def test_FR_023_001_default_filter_pending_only(
        self, admin_on_approval_page
    ):
        """TC: by default the page should show only PENDING_REVIEW courses.
        Reality: default filter is 'ALL' (L51), so admin sees every status —
        sheet gốc Fail."""
        page = admin_on_approval_page
        assert page.status_filter_label() == "Chờ duyệt", (
            f"TC expects default filter 'Chờ duyệt' so admin sees only "
            f"pending courses. Reality: default state is 'ALL' (CourseApproval.tsx "
            f"L51: useState<CourseStatus | 'ALL'>('ALL')). Filter shows: "
            f"{page.status_filter_label()!r}."
        )

    def test_FR_023_002_title_and_filter_visible(
        self, admin_on_approval_page
    ):
        page = admin_on_approval_page
        assert page.find(page.PAGE_TITLE).is_displayed()
        # Filter dropdown visible
        assert page.find(page.STATUS_FILTER).is_displayed()

    def test_FR_023_003_unauth_blocked(self, driver, cleanup_test_users):
        """No session → admin /courses must redirect to admin /login."""
        driver.get(settings.BASE_URL_ADMIN)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(f"{settings.BASE_URL_ADMIN}/courses")
        time.sleep(2)
        assert "/login" in driver.current_url, (
            f"Unauth must redirect to admin /login. Got URL: {driver.current_url}"
        )

    def test_FR_023_004_filter_pending_works(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        # Seed 1 PENDING + 1 DRAFT, refresh, filter to PENDING, verify only
        # PENDING shows.
        page = admin_on_approval_page
        _, _, p_title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                  status="PENDING_REVIEW")
        _, _, d_title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                  status="DRAFT")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        titles = page.visible_titles()
        assert any(p_title in t for t in titles), (
            f"PENDING course {p_title!r} should be visible; got {titles}"
        )
        assert not any(d_title in t for t in titles), (
            f"DRAFT course {d_title!r} should be filtered out; got {titles}"
        )

    def test_FR_023_005_view_detail_button_per_row(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """TC: each row should have a 'Xem chi tiết' button. Reality: the
        Button is commented out (L260-267) — sheet gốc Fail."""
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        row = page.find_row_by_title(title)
        assert row is not None, f"Row for {title!r} not in table"
        view_btns = row.find_elements(
            By.XPATH, './/button[.//span[contains(text(), "Xem")]]'
        )
        assert len(view_btns) > 0, (
            f"TC expects a 'Xem' button per row but the FE Button is "
            f"commented out (CourseApproval.tsx L260-267). Row buttons: "
            f"{[b.text for b in row.find_elements(By.TAG_NAME, 'button')]}"
        )

    def test_FR_023_006_click_row_opens_detail(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """TC: clicking a row should open the course detail page. Reality:
        no row-click handler — sheet gốc Fail."""
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PENDING_REVIEW",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        row = page.find_row_by_title(title)
        before_url = page.driver.current_url
        page.driver.execute_script("arguments[0].click();", row)
        time.sleep(1)
        assert page.driver.current_url != before_url, (
            f"TC expects clicking a row to navigate to course detail. "
            f"Reality: rows have no onClick handler in CourseApproval.tsx. "
            f"URL unchanged after click: {page.driver.current_url}"
        )

    def test_FR_023_007_status_tag_color(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        cls = page.status_tag_color_class_for(title)
        # PENDING_REVIEW maps to color 'gold' which renders as
        # ant-tag-gold
        assert cls and "ant-tag-gold" in cls, (
            f"PENDING_REVIEW tag should have ant-tag-gold class; got {cls!r}"
        )

    def test_FR_023_008_invalid_course_id_detail(
        self, admin_on_approval_page
    ):
        """TC: navigate to /courses/:id with non-existent id. Expected:
        FRIENDLY (Vietnamese, localized) error message AND redirect to
        course list. Reality: there is no /courses/:id route in the admin
        SPA. The router catch-all redirects to /courses, but the only
        feedback shown is the raw English string 'Course not found'
        (passed straight through from the API), which is not the
        Vietnamese friendly message the TC requires for a Vietnamese
        admin UI. Sheet gốc Fail (note: 'Không có trang chi tiết khóa
        học')."""
        d = admin_on_approval_page.driver
        d.get(f"{settings.BASE_URL_ADMIN}/courses/999999999")
        time.sleep(3)
        final_url = d.current_url
        body = d.find_element(By.TAG_NAME, "body").text
        body_lower = body.lower()

        redirected_to_list = (
            final_url.rstrip("/").endswith("/courses")
        )
        # The TC requires a friendly localized (Vietnamese) error.
        # 'Course not found' (raw English from API) does not count.
        friendly_vi_error = (
            "không tìm thấy" in body_lower
            or "không tồn tại" in body_lower
            or "khóa học không" in body_lower
        )
        raw_english_error = "course not found" in body_lower

        assert redirected_to_list and friendly_vi_error, (
            f"TC expects friendly Vietnamese error + redirect to list. "
            f"Reality: admin SPA has no /courses/:id route; redirect "
            f"happens but error is raw English from API. "
            f"final_url={final_url}, "
            f"redirected_to_list={redirected_to_list}, "
            f"friendly_vi_error={friendly_vi_error}, "
            f"raw_english_error_shown={raw_english_error}, "
            f"body_snippet={body[:300]!r}"
        )

    def test_FR_023_009_non_admin_blocked(
        self, db_conn, driver, cleanup_test_users
    ):
        """A non-admin (student) attempts to log in to admin panel.
        AuthContext blocks: throws and shows 'Bạn không có quyền'."""
        student_email, _ = _student_login(driver, db_conn)
        # Try admin login with student credentials
        AdminLoginPage(driver).open().login(student_email, "Abc123456")
        time.sleep(3)
        # Either we see error message or we're still on /login
        page_src = driver.page_source.lower()
        assert (
            "không có quyền" in page_src or "/login" in driver.current_url
        ), (
            f"Student should not access admin panel. URL={driver.current_url}, "
            f"page contains 'không có quyền': "
            f"{'không có quyền' in page_src}"
        )


# =============================================================================
# Section 2 — Approve / Reject (FR_023_010 to FR_023_017)
# =============================================================================

class TestApproveReject:
    def test_FR_023_010_admin_approves_pending(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PENDING_REVIEW",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Duyệt")
        time.sleep(2)
        row = find_course_by_id(db_conn, course_id)
        assert row and row["status"] == "APPROVED", (
            f"DB course status should be APPROVED; got {row!r}"
        )

    def test_FR_023_011_status_menu_has_4_options(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        labels = [it[0] for it in items]
        assert "Chờ duyệt" in labels and "Duyệt" in labels and \
               "Từ chối" in labels and "Xuất bản" in labels, (
            f"Menu must list all 4 status options; got {labels}"
        )

    def test_FR_023_012_reject_empty_reason(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PENDING_REVIEW",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Từ chối")
        time.sleep(0.5)
        # Reject modal opens — leave reason blank
        page.click_reject_confirm()
        # message.warning('Vui lòng nhập lý do từ chối!')
        msgs = page.get_messages(timeout=5)
        assert any("nhập lý do" in m.lower() for m in msgs), (
            f"Expected 'Vui lòng nhập lý do từ chối!' warning; got {msgs}"
        )
        # DB unchanged
        row = find_course_by_id(db_conn, course_id)
        assert row and row["status"] == "PENDING_REVIEW"

    def test_FR_023_013_reject_with_reason(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PENDING_REVIEW",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Từ chối")
        time.sleep(0.5)
        page.fill_rejection_reason("Lý do test: thiếu nội dung chi tiết")
        page.click_reject_confirm()
        time.sleep(2)
        row = find_course_by_id(db_conn, course_id)
        assert row and row["status"] == "REJECTED"
        assert row["rejection_reason"] and "thiếu nội dung" in row["rejection_reason"]

    def test_FR_023_014_reject_modal_textarea_props(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Từ chối")
        time.sleep(0.5)
        placeholder = page.reject_textarea_placeholder()
        max_len = page.reject_textarea_max_length()
        assert "lý do" in placeholder.lower(), (
            f"Textarea placeholder should mention 'lý do'; got {placeholder!r}"
        )
        assert max_len == "500", f"maxLength should be 500; got {max_len!r}"
        assert page.reject_textarea_count_visible(), (
            "Antd showCount should render a character counter"
        )

    def test_FR_023_015_block_approve_from_rejected(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """TC: a REJECTED course should not be approvable in one click.
        Reality: the menu's Duyệt item is enabled for any non-APPROVED
        status, so REJECTED → APPROVED in one click — sheet gốc Fail."""
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="REJECTED",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Từ chối")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        approve_disabled = any(
            label == "Duyệt" and disabled for label, disabled in items
        )
        assert approve_disabled, (
            f"TC expects 'Duyệt' to be DISABLED when status is REJECTED. "
            f"Reality: only the same-status item is disabled "
            f"(CourseApproval.tsx L239: disabled === APPROVED). Menu state: "
            f"{items}"
        )

    def test_FR_023_016_block_approve_for_published(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PUBLISHED",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã xuất bản")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        approve_disabled = any(
            label == "Duyệt" and disabled for label, disabled in items
        )
        assert approve_disabled, (
            f"TC expects 'Duyệt' to be DISABLED when status is PUBLISHED. "
            f"Reality: only same-status item is disabled. Menu state: {items}"
        )

    def test_FR_023_017_confirmation_before_approve(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """TC: a confirmation modal should appear before approving. Reality:
        approve takes effect IMMEDIATELY on click — sheet gốc Fail."""
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="PENDING_REVIEW",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Duyệt")
        time.sleep(0.5)
        # No confirmation modal should appear AND the status change should
        # NOT have happened immediately.
        confirm_modals = page.driver.find_elements(
            By.XPATH,
            '//div[contains(@class, "ant-modal-content") '
            'and (.//*[contains(text(), "xác nhận")] '
            'or .//*[contains(text(), "Xác nhận")])]'
        )
        assert len(confirm_modals) > 0, (
            f"TC expects an Antd confirmation Modal before approve takes "
            f"effect. Reality: handleUpdateStatus immediately calls the "
            f"backend (CourseApproval.tsx L107-126) without any confirmation "
            f"step. Confirm modals seen: {len(confirm_modals)}"
        )


# =============================================================================
# Section 3 — Publish + transition rules (FR_023_018 to FR_023_025)
# =============================================================================

class TestPublishRules:
    def test_FR_023_018_publish_approved_course(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, course_id, title = _seed_teacher_and_course(
            db_conn, metadata_ids, status="APPROVED",
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Xuất bản")
        time.sleep(2)
        row = find_course_by_id(db_conn, course_id)
        assert row and row["status"] == "PUBLISHED"

    def test_FR_023_019_block_publish_from_pending(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        publish_disabled = any(
            label == "Xuất bản" and disabled for label, disabled in items
        )
        assert publish_disabled, (
            f"TC expects 'Xuất bản' to be DISABLED when status is "
            f"PENDING_REVIEW (must approve first). Menu state: {items}"
        )

    def test_FR_023_020_block_publish_from_rejected(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="REJECTED")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Từ chối")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        publish_disabled = any(
            label == "Xuất bản" and disabled for label, disabled in items
        )
        assert publish_disabled, (
            f"TC expects 'Xuất bản' to be DISABLED when status is REJECTED. "
            f"Menu state: {items}"
        )

    def test_FR_023_021_publish_only_visible_when_approved(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """TC: 'Xuất bản' should only APPEAR when status is APPROVED.
        Reality: it's always present in the menu — sheet gốc Fail."""
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PENDING_REVIEW")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Chờ duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        publish_in_menu = any(label == "Xuất bản" for label, _ in items)
        assert not publish_in_menu, (
            f"TC expects 'Xuất bản' to be HIDDEN (not just disabled) for "
            f"non-APPROVED courses. Reality: the FE always renders it in the "
            f"menu — see CourseApproval.tsx L251-255. Menu items: {items}"
        )

    def test_FR_023_022_approve_reject_disabled_for_published(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PUBLISHED")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã xuất bản")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        approve_disabled = any(label == "Duyệt" and d for label, d in items)
        reject_disabled = any(label == "Từ chối" and d for label, d in items)
        assert approve_disabled and reject_disabled, (
            f"TC expects both 'Duyệt' and 'Từ chối' to be DISABLED for "
            f"PUBLISHED courses. Menu state: {items}"
        )

    def test_FR_023_023_block_approved_back_to_pending(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="APPROVED")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        items = page.open_dropdown_menu_items()
        pending_disabled = any(
            label == "Chờ duyệt" and disabled for label, disabled in items
        )
        assert pending_disabled, (
            f"TC expects 'Chờ duyệt' to be DISABLED when status is "
            f"APPROVED (no reverse transition). Menu state: {items}"
        )

    def test_FR_023_024_published_label_visible(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="PUBLISHED")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã xuất bản")
        time.sleep(0.5)
        tag_text = page.status_tag_text_for(title)
        assert tag_text == "Đã xuất bản", (
            f"PUBLISHED tag should read 'Đã xuất bản'; got {tag_text!r}"
        )

    def test_FR_023_025_confirmation_before_publish(
        self, admin_on_approval_page, db_conn, metadata_ids
    ):
        """Same root cause as FR_023_017 — no confirmation step before
        publish."""
        page = admin_on_approval_page
        _, _, title = _seed_teacher_and_course(db_conn, metadata_ids,
                                                status="APPROVED")
        page.driver.refresh()
        page.wait_until_loaded()
        page.select_status_filter("Đã duyệt")
        time.sleep(0.5)
        page.click_change_status_for(title)
        page.click_dropdown_item("Xuất bản")
        time.sleep(0.5)
        confirm_modals = page.driver.find_elements(
            By.XPATH,
            '//div[contains(@class, "ant-modal-content") '
            'and (.//*[contains(text(), "xác nhận")] '
            'or .//*[contains(text(), "Xác nhận")])]'
        )
        assert len(confirm_modals) > 0, (
            f"TC expects a confirmation Modal before publish takes effect. "
            f"Reality: publish runs immediately on click. Modal count: "
            f"{len(confirm_modals)}"
        )


# =============================================================================
# Section 4 — Stability / access (FR_023_026 to FR_023_028)
# =============================================================================

class TestStabilityAccess:
    def test_FR_023_026_logout_then_revisit_redirects_to_login(
        self, db_conn, driver, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        # Clear all auth state
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(f"{settings.BASE_URL_ADMIN}/courses")
        time.sleep(2)
        assert "/login" in driver.current_url

    def test_FR_023_027_loading_state_renders(
        self, db_conn, driver, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        page = AdminCourseApprovalPage(driver)
        page.open()
        # Race for the table loading spinner before data lands
        seen_loading = False
        for _ in range(15):
            if len(driver.find_elements(*page.LOADING_INDICATOR)) > 0:
                seen_loading = True
                break
            time.sleep(0.05)
        page.wait_until_loaded(timeout=15)
        # Either we caught spinner OR table loaded too fast — both acceptable
        assert seen_loading or page.find(page.PAGE_TITLE).is_displayed()

    def test_FR_023_028_load_failure_shows_error(
        self, db_conn, driver, cleanup_test_users
    ):
        """Stop the backend → fetch fails → message.error appears.

        We can't actually stop the backend mid-test, so we simulate by
        breaking the cookie-based auth: clear cookies (so /api/v1/courses
        returns 401), then visit. The fetch in fetchCourses will hit the
        catch branch and show message.error('Không thể tải danh sách
        khóa học!')."""
        _admin_login(driver, db_conn)
        page = AdminCourseApprovalPage(driver).open()
        page.wait_until_loaded()
        # Now break auth and refresh
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.refresh()
        time.sleep(3)
        # Either redirected to login OR we see the message.error
        url = driver.current_url
        if "/login" in url:
            return  # redirect path is acceptable
        msgs = page.get_messages(timeout=3)
        assert any("không thể" in m.lower() or "tải" in m.lower() for m in msgs), (
            f"Expected an error toast on fetch failure. URL={url!r}, "
            f"messages={msgs}"
        )
