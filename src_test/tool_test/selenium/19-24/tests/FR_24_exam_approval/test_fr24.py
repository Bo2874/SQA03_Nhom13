"""FR_24 — Exam approval (Admin) system tests.

26 test cases sourced from sheet FR_24 in ss_test_13.xlsx.

============================================================================
ROOT CAUSE — entire feature is INACTIVE
============================================================================
The exam-approval feature is NOT wired into the running admin SPA:

  1. App.tsx (src_code/elearning-admin/src/App.tsx) registers ONLY these
     authenticated routes:
        /                  → Dashboard
        /teachers          → TeacherManagement
        /courses           → CourseApproval
        /courses/:id       → CourseDetail
        *                  → <Navigate to="/" replace />
     There is NO /exams or /exams/:id route. Any direct navigation to
     /exams or /exams/:id is caught by the wildcard and redirected to /.

  2. MainLayout.tsx menuItems (L42-58) contains only Dashboard, Quản Lý
     Giáo Viên, Duyệt Khóa Học. There is NO "Duyệt Bài Kiểm Tra" entry
     in the sidebar — TC steps that say "click vào mục Duyệt Bài Kiểm
     Tra trên thanh trình đơn" cannot be performed.

  3. ExamApproval.tsx and ExamDetail.tsx exist as orphan files but they
     are never imported by App.tsx. They use `mockExams` from
     `../data/mockData` (no real backend connection — `handleApprove`
     and `handleRejectSubmit` only mutate local React state with
     setTimeout shims, no API calls).

Because the route literally cannot be reached and the sidebar entry does
not exist, EVERY TC in FR_24 is Inactive per the project convention
(feature/UI element required by the steps does not exist → pytest.skip).
This matches sheet gốc's verdict: all 26 TCs marked Inactive with note
"Hiện mới chỉ có giao diện Mockup, chưa cài đặt logic".

Each test below first proves the feature is missing (probe assertion),
then issues a Vietnamese-friendly skip reason explaining what was
expected, what was found, and where in the source the gap is.
"""
import time
import uuid

import pytest
from selenium.webdriver.common.by import By

from config import settings
from pages.admin_teacher_page import AdminLoginPage
from pages.login_page import LoginPage
from utils.csv_reader import load_csv
from utils.db_helper import seed_user


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_24_exam_approval_management.csv")}


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _admin_login(driver, db_conn, password="Admin123"):
    email = _unique_email()
    seed_user(
        db_conn, email=email, password_plain=password,
        full_name="AdminFR24", role="ADMIN",
    )
    AdminLoginPage(driver).open().login(email, password)
    # Wait until off /login (defensive)
    end = time.time() + 15
    while time.time() < end and "/login" in driver.current_url:
        time.sleep(0.3)
    return email


def _probe_exam_route_missing(driver, path="/exams"):
    """Navigate to the given admin path and report what happened.

    Returns a dict with the URL after navigation, whether it landed on
    the ExamApproval page, and a snippet of the body for the skip Note.
    """
    target = f"{settings.BASE_URL_ADMIN}{path}"
    driver.get(target)
    time.sleep(2)
    final_url = driver.current_url
    body = driver.find_element(By.TAG_NAME, "body").text
    has_exam_title = "Duyệt Bài Kiểm Tra" in body
    return {
        "target": target,
        "final_url": final_url,
        "has_exam_title": has_exam_title,
        "body_snippet": body[:200],
    }


def _sidebar_has_exam_link(driver):
    """Check whether the admin sidebar exposes an 'exam approval' menu
    item. Returns the matched anchor element list."""
    return driver.find_elements(
        By.XPATH,
        "//*[contains(., 'Duyệt Bài Kiểm Tra') or "
        "contains(., 'Duyệt Bài Thi') or "
        "contains(., 'Quản Lý Bài Kiểm Tra')]"
        "[self::a or self::li or self::span]",
    )


# Common skip-Note prefix used in every TC, so the teacher-facing report
# states the missing-feature root cause once.
_INACTIVE_PREFIX = (
    "Inactive: Tính năng duyệt bài kiểm tra (admin) chưa được tích hợp "
    "vào ứng dụng thực thi. App.tsx (elearning-admin) không khai báo "
    "route /exams hay /exams/:id; route catch-all '*' chuyển hướng về '/'. "
    "MainLayout.tsx cũng không có mục 'Duyệt Bài Kiểm Tra' trong thanh "
    "menu. ExamApproval.tsx tồn tại như mã mồ côi (mockData, không gọi "
    "backend). "
)


@pytest.fixture
def admin_session(driver, db_conn, cleanup_test_users):
    """Log in as admin and prove /exams is missing once per test."""
    _admin_login(driver, db_conn)
    proof = _probe_exam_route_missing(driver, "/exams")
    return {"driver": driver, "proof": proof}


# =============================================================================
# Section 1 — Listing / access (FR_024_001 .. FR_024_009)
# =============================================================================

class TestListingAccess:
    def test_FR_024_001_default_filter_pending_only(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"], (
            "Sanity: ExamApproval page surfaced — feature might have been "
            "added since this test was authored. Re-evaluate verdict."
        )
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không thể kiểm tra danh sách mặc định vì khi truy cập "
            f"{proof['target']} hệ thống redirect về {proof['final_url']} "
            "(Dashboard) thay vì hiển thị bảng bài thi chờ duyệt."
        )

    def test_FR_024_002_table_layout_and_column_titles(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"], "Feature unexpectedly present."
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không tồn tại trang 'Duyệt Bài Kiểm Tra' để kiểm tra "
            "tiêu đề trang và các cột (Tên Bài Kiểm Tra, Thời Gian Thi, "
            "Độ Dài, Số Câu, Ngày Nộp, Trạng Thái, Thao Tác)."
        )

    def test_FR_024_003_unauthenticated_blocked(self, driver):
        # Open in a fresh (logged-out) state and try /exams directly.
        driver.delete_all_cookies()
        driver.get(f"{settings.BASE_URL_ADMIN}/exams")
        time.sleep(2)
        url_after = driver.current_url
        # Even unauthenticated, the route protection sends to /login.
        # That is the SAME behavior as any unknown URL, not specific to
        # /exams. The TC's intent (block unauthenticated access to exam
        # approval) cannot be validated because the page itself does
        # not exist.
        pytest.skip(
            _INACTIVE_PREFIX
            + f"Khi chưa đăng nhập, truy cập /exams chuyển hướng về "
            f"{url_after} (login). Tuy nhiên đây là hành vi mặc định cho "
            "mọi route bảo vệ, không phải xác nhận có chặn riêng cho "
            "trang duyệt bài thi — vì trang đó không hề được route."
        )

    def test_FR_024_004_navigate_from_sidebar(self, admin_session):
        d = admin_session["driver"]
        d.get(f"{settings.BASE_URL_ADMIN}/")
        time.sleep(2)
        links = _sidebar_has_exam_link(d)
        assert len(links) == 0, (
            "Sanity: a sidebar entry for exam approval was found — "
            "feature might exist now. Re-evaluate verdict."
        )
        pytest.skip(
            _INACTIVE_PREFIX
            + "Sidebar admin chỉ có Dashboard, Quản Lý Giáo Viên, Duyệt "
            "Khóa Học. Không có mục 'Duyệt Bài Kiểm Tra' để click — "
            "không thể thực hiện bước điều hướng từ menu."
        )

    def test_FR_024_005_status_filter_visible(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có trang duyệt bài thi nên không kiểm tra được "
            "khu vực bộ lọc trạng thái (Chờ duyệt / Đã duyệt / Đã đóng) "
            "phía trên bảng."
        )

    def test_FR_024_006_status_tag_colors(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có bảng dữ liệu bài thi nên không kiểm tra được "
            "màu nhãn trạng thái (vàng cho Chờ duyệt, xanh lá cho Đã "
            "duyệt, xám cho Đã đóng)."
        )

    def test_FR_024_007_action_buttons_per_status(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có cột 'Thao Tác' để xác minh nút Xem/Duyệt/Từ "
            "chối chỉ hiện đúng với dòng có trạng thái 'Chờ duyệt'."
        )

    def test_FR_024_008_teacher_role_blocked(self, driver, db_conn,
                                             cleanup_test_users):
        # Log in as a TEACHER, then try /exams directly.
        teacher_email = _unique_email()
        seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="TeacherFR24", role="TEACHER",
        )
        # Teachers belong to the FE app, not the admin app. Try admin
        # login form with teacher creds (AuthContext blocks non-admin).
        AdminLoginPage(driver).open().login(teacher_email, "Abc123456")
        time.sleep(3)
        # Even if blocked, still try /exams to prove the route is gone.
        driver.get(f"{settings.BASE_URL_ADMIN}/exams")
        time.sleep(2)
        url_after = driver.current_url
        pytest.skip(
            _INACTIVE_PREFIX
            + f"Đăng nhập role TEACHER và mở /exams → {url_after}. "
            "Không thể kiểm tra cụ thể chính sách phân quyền cho trang "
            "duyệt bài thi vì trang này không được route, mọi tài khoản "
            "đều rơi vào hành vi mặc định (login redirect / dashboard)."
        )

    def test_FR_024_009_view_button_opens_detail(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có bảng dữ liệu nên không có nút 'Xem' để click. "
            "Đồng thời route /exams/:id cũng không tồn tại — không thể "
            "điều hướng tới trang chi tiết."
        )


# =============================================================================
# Section 2 — Approve / Reject (FR_024_010 .. FR_024_018)
# =============================================================================

class TestApproveReject:
    def test_FR_024_010_admin_approves_pending(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có nút 'Duyệt' trong giao diện đang chạy để click. "
            "Lưu ý: ngay cả file ExamApproval.tsx mockup cũng chỉ "
            "setState cục bộ (không gọi API, không persist) — nên dù "
            "có wire route thì cũng không phản ánh được DB thực."
        )

    def test_FR_024_011_reject_modal_requires_reason(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không truy cập được modal 'Từ Chối Bài Kiểm Tra' để "
            "kiểm tra ràng buộc bắt buộc nhập lý do."
        )

    def test_FR_024_012_admin_rejects_with_valid_reason(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có giao diện để mở modal từ chối, nhập lý do và "
            "xác nhận. Không thể kiểm tra trạng thái 'Từ chối' sau khi "
            "submit."
        )

    def test_FR_024_013_reject_modal_placeholder_and_counter(
        self, admin_session
    ):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có TextArea trong modal từ chối để kiểm tra "
            "placeholder hướng dẫn và bộ đếm ký tự (showCount, "
            "maxLength=500)."
        )

    def test_FR_024_014_confirmation_before_approve(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có nút 'Duyệt' để click — không thể quan sát có "
            "hộp thoại xác nhận trước khi duyệt hay không."
        )

    def test_FR_024_015_approve_button_hidden_after_approved(
        self, admin_session
    ):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có bảng danh sách để xác nhận nút 'Duyệt'/'Từ "
            "chối' biến mất với dòng đã duyệt."
        )

    def test_FR_024_016_rejected_label_consistent(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không vào được trang chi tiết /exams/:id và cũng không "
            "có bảng tổng — không thể kiểm tra nhãn 'Từ chối' đồng nhất "
            "tại cả hai trang."
        )

    def test_FR_024_017_clear_reason_on_cancel(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không mở được modal từ chối để gõ nội dung và thử bấm "
            "'Hủy' rồi mở lại."
        )

    def test_FR_024_018_reject_reason_max_500_chars(self, admin_session):
        proof = admin_session["proof"]
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có TextArea trong modal từ chối để dán 500 ký tự "
            "và quan sát maxLength."
        )


# =============================================================================
# Section 3 — Detail page (FR_024_019 .. FR_024_026)
# =============================================================================

class TestExamDetail:
    def test_FR_024_019_direct_url_to_detail(self, driver, db_conn,
                                             cleanup_test_users):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"], "Detail page unexpectedly loaded."
        pytest.skip(
            _INACTIVE_PREFIX
            + f"Truy cập trực tiếp {proof['target']} → "
            f"{proof['final_url']} (Dashboard). Route /exams/:id không "
            "tồn tại trong App.tsx, không thể mở trang chi tiết bài thi."
        )

    def test_FR_024_020_approve_reject_buttons_on_detail(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không vào được trang chi tiết nên không có khu vực chân "
            "trang để kiểm tra hai nút 'Duyệt Bài Kiểm Tra' và 'Từ "
            "Chối'."
        )

    def test_FR_024_021_status_synced_back_to_list(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Cả trang chi tiết lẫn trang danh sách đều không tồn tại "
            "trong app, không thể kiểm tra đồng bộ trạng thái sau khi "
            "duyệt rồi quay lại."
        )

    def test_FR_024_022_rejection_reason_box_on_detail(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không mở được trang chi tiết để kiểm tra hiển thị khung "
            "lý do từ chối."
        )

    def test_FR_024_023_block_reject_without_reason_on_detail(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không vào được trang chi tiết để bấm 'Từ Chối' rồi xác "
            "minh ràng buộc bắt buộc nhập lý do."
        )

    def test_FR_024_024_rejected_tag_red_on_detail(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không vào được trang chi tiết để kiểm tra nhãn 'Từ "
            "chối' có màu đỏ."
        )

    def test_FR_024_025_breadcrumb_back_to_list(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không có trang chi tiết nên không có Breadcrumb để click "
            "quay lại danh sách."
        )

    def test_FR_024_026_summary_statistic_cards(
        self, driver, db_conn, cleanup_test_users
    ):
        _admin_login(driver, db_conn)
        proof = _probe_exam_route_missing(driver, "/exams/1")
        assert not proof["has_exam_title"]
        pytest.skip(
            _INACTIVE_PREFIX
            + "Không vào được trang chi tiết để kiểm tra các thẻ thống "
            "kê tóm tắt (Số câu hỏi, Thời gian, Lượt thi)."
        )
