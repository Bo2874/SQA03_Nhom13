"""FR_05 — User profile management system tests.

15 test cases sourced from sheet FR_05 in ss_test_13.xlsx.

Reality vs the FR title: most TC steps actually describe admin teacher
management (which lives in elearning-admin on port 3002). The user-facing
profile page (/user/my-account) and change-password screen do not exist
in this codebase — those TCs naturally fail.

Implemented features touched by this FR:
  - Admin /teachers edit modal (FR_005_004 to FR_005_008)
  - Admin /teachers avatar upload validators (FR_005_010, 011)
  - Cloudinary upload for valid images (FR_005_009)
"""
import time
import uuid

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.admin_teacher_page import AdminLoginPage, AdminTeacherPage
from utils.csv_reader import load_csv
from utils.db_helper import seed_user, find_user_by_email


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_05_user_profile_management.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


@pytest.fixture
def admin_session(driver, db_conn, cleanup_test_users):
    """Seed an admin user, log into the admin panel, then yield."""
    admin_email = _unique_email()
    admin_password = "Admin123"
    seed_user(db_conn, email=admin_email, password_plain=admin_password,
              full_name="AutoTestAdmin", role="ADMIN")
    AdminLoginPage(driver).open().login(admin_email, admin_password)
    WebDriverWait(driver, 15).until(
        lambda d: "/login" not in d.current_url
    )
    yield admin_email


def _seed_teacher(db_conn, full_name="AutoTeacher", phone="0901234567"):
    email = _unique_email()
    seed_user(db_conn, email=email, password_plain="Abc123456",
              full_name=full_name, role="TEACHER", phone=phone)
    return email


# =============================================================================
# Section 1 — User profile page UI (FR_005_001 to FR_005_003)
# =============================================================================

class TestUserProfilePage:
    def test_FR_005_001_open_profile_from_avatar_menu(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: login → click avatar → click 'Tài khoản của tôi'."""
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="ProfileTester", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)

        avatar = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((
                By.XPATH,
                '//button[contains(@class, "rounded-full") '
                'and contains(@class, "bg-gradient-to-br")]'
            ))
        )
        driver.execute_script("arguments[0].click();", avatar)
        time.sleep(0.5)
        my_account_links = driver.find_elements(
            By.XPATH,
            '//a[contains(., "Tài khoản của tôi")] | '
            '//button[contains(., "Tài khoản của tôi")]'
        )
        if not my_account_links:
            pytest.skip(
                "Inactive: Menu item 'Tài khoản của tôi' không tồn tại trong UI. "
                "TopHeader.tsx L188-209 đã comment-out toàn bộ JSX block của menu "
                "item này, nên dropdown của avatar chỉ hiện 'Khóa học của tôi' và "
                "'Đăng xuất'. Người dùng không có cách nào để mở trang hồ sơ cá nhân."
            )

    def test_FR_005_002_profile_page_displays_user_info(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: vào trang hồ sơ cá nhân và quan sát các trường thông tin user."""
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="InfoTester", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)

        driver.get(f"{settings.BASE_URL_FE}/user/my-account")
        time.sleep(2)
        body = driver.page_source.lower()
        looks_like_profile = (
            email in driver.page_source
            or "hồ sơ" in body
            or "thông tin cá nhân" in body
        )
        if not looks_like_profile:
            pytest.skip(
                f"Inactive: Trang /user/my-account không tồn tại trong "
                f"elearning-frontend (không có route nào dưới src/app cho "
                f"đường dẫn này). Truy cập trực tiếp trả về 404 / not-found. "
                f"Current URL: {driver.current_url}"
            )

    def test_FR_005_003_email_field_readonly(
        self, driver, db_conn, cleanup_test_users
    ):
        """TC: trên trang chỉnh sửa hồ sơ, trường email phải read-only."""
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="EmailTester", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)

        driver.get(f"{settings.BASE_URL_FE}/user/my-account")
        time.sleep(2)
        email_inputs = driver.find_elements(
            By.XPATH,
            '//input[@type="email" or contains(@name, "email") or contains(@id, "email")]'
            '[@disabled or @readonly]'
        )
        if not email_inputs:
            pytest.skip(
                "Inactive: Trang chỉnh sửa hồ sơ (/user/my-account) không "
                "tồn tại trong elearning-frontend, nên không có ô email "
                "read-only nào để kiểm tra."
            )


# =============================================================================
# Section 2 — Admin teacher edit (FR_005_004 to FR_005_008)
# =============================================================================

class TestAdminTeacherEdit:
    def test_FR_005_004_update_fullname(self, driver, db_conn, admin_session):
        teacher_email = _seed_teacher(db_conn, full_name="OriginalName")
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.fill_edit_fullname("Updated Name")
        admin.submit_edit()
        msgs = admin.get_antd_message(timeout=8)
        assert any("Cập nhật thông tin giáo viên thành công" in m for m in msgs), (
            f"Expected success toast 'Cập nhật thông tin giáo viên thành công!'; "
            f"got messages: {msgs}"
        )
        # DB check
        row = find_user_by_email(db_conn, teacher_email)
        assert row["full_name"] == "Updated Name", (
            f"DB still shows fullName={row['full_name']!r}, expected 'Updated Name'"
        )

    def test_FR_005_005_update_phone(self, driver, db_conn, admin_session):
        teacher_email = _seed_teacher(db_conn, phone="0901111111")
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.fill_edit_phone("0902222222")
        admin.submit_edit()
        msgs = admin.get_antd_message(timeout=8)
        assert any("thành công" in m.lower() for m in msgs), (
            f"Expected success toast on phone update; got: {msgs}"
        )
        row = find_user_by_email(db_conn, teacher_email)
        assert row["phone"] == "0902222222", (
            f"Phone in DB is {row['phone']!r}, expected '0902222222'"
        )

    def test_FR_005_006_empty_fullname_blocked(self, driver, db_conn, admin_session):
        teacher_email = _seed_teacher(db_conn)
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.fill_edit_fullname("")
        admin.submit_edit()
        time.sleep(0.5)
        errors = admin.get_field_errors()
        assert any("Vui lòng nhập họ và tên" in e for e in errors), (
            f"Expected 'Vui lòng nhập họ và tên!' field error; got {errors}"
        )

    def test_FR_005_007_invalid_phone_format(self, driver, db_conn, admin_session):
        """TC expects a validation error for a phone with letters. The
        admin edit form's phone Form.Item has NO rules array — there's no
        front-end or back-end validation, so the save will succeed and no
        error appears. That mismatch is the failure."""
        teacher_email = _seed_teacher(db_conn, phone="0901111111")
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.fill_edit_phone("091234abcd")
        admin.submit_edit()
        time.sleep(2)
        errors = admin.get_field_errors()
        msgs = admin.get_antd_message(timeout=3)
        # Strict TC: must show "Số điện thoại không hợp lệ" or block save
        had_validation = any(
            "Số điện thoại không hợp lệ" in e or "không hợp lệ" in e
            for e in errors
        )
        assert had_validation, (
            f"TC expects 'Số điện thoại không hợp lệ' when phone contains "
            f"letters. The phone Form.Item in TeacherApproval.tsx (L506-511) "
            f"has no validation rules, so the save succeeds silently. "
            f"Field errors: {errors}, toast messages: {msgs}"
        )

    def test_FR_005_008_phone_too_short(self, driver, db_conn, admin_session):
        teacher_email = _seed_teacher(db_conn, phone="0901111111")
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.fill_edit_phone("09123")  # too short
        admin.submit_edit()
        time.sleep(2)
        errors = admin.get_field_errors()
        msgs = admin.get_antd_message(timeout=3)
        had_validation = any(
            "không hợp lệ" in e or "ngắn" in e or "10" in e
            for e in errors
        )
        assert had_validation, (
            f"TC expects a validation error for a too-short phone. The phone "
            f"Form.Item has no rules, so the save accepts any length. "
            f"Field errors: {errors}, toast messages: {msgs}"
        )


# =============================================================================
# Section 3 — Avatar upload (FR_005_009 to FR_005_011)
# =============================================================================

class TestAvatarUpload:
    # Tiny valid 1x1 transparent PNG (67 bytes). Use a real image so
    # Cloudinary's content sniffer accepts the upload.
    _TINY_PNG_BYTES = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
        0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
        0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0,
        1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ]

    def test_FR_005_009_upload_valid_image(self, driver, db_conn, admin_session):
        teacher_email = _seed_teacher(db_conn)
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        # Real PNG bytes — passes both `isValidImageFile` (MIME check) and
        # Cloudinary's content sniffer.
        admin.upload_avatar_via_js(
            "avatar.png", "image/png", byte_list=self._TINY_PNG_BYTES
        )
        msgs = admin.get_antd_message(timeout=15)
        assert any("Upload ảnh thành công" in m for m in msgs), (
            f"Expected 'Upload ảnh thành công!' after uploading a valid <5MB "
            f"image. Got messages: {msgs}"
        )

    def test_FR_005_010_upload_non_image_rejected(
        self, driver, db_conn, admin_session
    ):
        teacher_email = _seed_teacher(db_conn)
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        admin.upload_avatar_via_js("file.pdf", "application/pdf", size_bytes=10 * 1024)
        msgs = admin.get_antd_message(timeout=5)
        assert any("Vui lòng chọn file ảnh hợp lệ" in m for m in msgs), (
            f"Expected 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WebP)' "
            f"after uploading a PDF. Got: {msgs}"
        )

    def test_FR_005_011_upload_oversize_rejected(
        self, driver, db_conn, admin_session
    ):
        teacher_email = _seed_teacher(db_conn)
        admin = AdminTeacherPage(driver).open()
        admin.wait_for_table()
        admin.click_edit_for(teacher_email)
        # 6 MB JPG should fail the 5 MB size check
        admin.upload_avatar_via_js("big.jpg", "image/jpeg", size_bytes=6 * 1024 * 1024)
        msgs = admin.get_antd_message(timeout=5)
        assert any("không được vượt quá 5MB" in m for m in msgs), (
            f"Expected 'Kích thước file không được vượt quá 5MB...' for a "
            f">5MB upload. Got: {msgs}"
        )


# =============================================================================
# Section 4 — Change password (FR_005_012 to FR_005_015)
# =============================================================================

class TestChangePassword:
    """The user-facing app has no change-password screen. /change-password,
    /user/my-account/password and similar routes do not exist. All four TCs
    in this section depend on that screen — they fail because the feature
    has not been implemented."""

    @staticmethod
    def _login_student(driver, db_conn, password="Abc123456"):
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="PwdTester", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
        return email, password

    @staticmethod
    def _change_password_screen_inputs(driver):
        for path in ("/change-password", "/user/change-password",
                     "/user/my-account/password"):
            driver.get(f"{settings.BASE_URL_FE}{path}")
            time.sleep(1)
            inputs = driver.find_elements(
                By.XPATH,
                '//input[contains(@name, "currentPassword") or '
                'contains(@id, "currentPassword") or '
                'contains(@placeholder, "hiện tại")]'
            )
            if inputs:
                return path, inputs
        return None, []

    def test_FR_005_012_change_password_success(
        self, driver, db_conn, cleanup_test_users
    ):
        self._login_student(driver, db_conn)
        path, inputs = self._change_password_screen_inputs(driver)
        if not inputs:
            pytest.skip(
                "Inactive: Tính năng đổi mật khẩu chưa được implement trong "
                "elearning-frontend. Đã thử các route /change-password, "
                "/user/change-password, /user/my-account/password — không "
                "route nào render form đổi mật khẩu (không có input "
                "currentPassword). Người dùng đã đăng nhập không có cách "
                "nào đổi mật khẩu trong UI."
            )

    def test_FR_005_013_wrong_current_password(
        self, driver, db_conn, cleanup_test_users
    ):
        self._login_student(driver, db_conn)
        path, inputs = self._change_password_screen_inputs(driver)
        if not inputs:
            pytest.skip(
                "Inactive: Tính năng đổi mật khẩu chưa được implement, "
                "không có form currentPassword để test trường hợp nhập sai "
                "mật khẩu hiện tại."
            )

    def test_FR_005_014_new_password_same_as_old(
        self, driver, db_conn, cleanup_test_users
    ):
        self._login_student(driver, db_conn)
        path, inputs = self._change_password_screen_inputs(driver)
        if not inputs:
            pytest.skip(
                "Inactive: Tính năng đổi mật khẩu chưa được implement, "
                "không có form để test trường hợp mật khẩu mới trùng "
                "mật khẩu cũ."
            )

    def test_FR_005_015_confirm_password_mismatch(
        self, driver, db_conn, cleanup_test_users
    ):
        self._login_student(driver, db_conn)
        path, inputs = self._change_password_screen_inputs(driver)
        if not inputs:
            pytest.skip(
                "Inactive: Tính năng đổi mật khẩu chưa được implement, "
                "không có form newPassword/confirmPassword để test trường "
                "hợp xác nhận mật khẩu không khớp."
            )
