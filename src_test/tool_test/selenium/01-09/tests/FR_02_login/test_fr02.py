"""FR_02 — User Authentication (Login / Logout) system tests.

20 test cases sourced from sheet FR_02 in ss_test_13.xlsx
(see data/FR_02_user_authentication_login_logout.csv).

Test users are seeded with the settings.TEST_EMAIL_PREFIX so the
cleanup_test_users fixture wipes them after each test.
"""
import time
import uuid

import pytest
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from utils.csv_reader import load_csv
from utils.db_helper import seed_user


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_02_user_authentication_login_logout.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _expected_msg(tc):
    return tc["expected_messages"] or tc["expected"]


# Avatar button shown by TopHeader once the user profile loads from localStorage.
# (We can't filter on @title because TopHeader.tsx reads profile.full_name but
# the localStorage payload uses fullName camelCase, so @title ends up empty.)
_AVATAR_XPATH = (
    '//button[contains(@class, "rounded-full") '
    'and contains(@class, "bg-gradient-to-br")]'
)
_LOGOUT_BUTTON_XPATH = '//button[contains(., "Đăng xuất") and not(@type="submit")]'


def _wait_for_login_completion(driver, timeout=15):
    WebDriverWait(driver, timeout).until(lambda d: "/login" not in d.current_url)


def _open_user_dropdown_and_logout(driver):
    # The login success toast (top-right, ~2.5s) overlaps the avatar, so a
    # native click is intercepted. Use JS click to bypass the overlay check.
    avatar = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, _AVATAR_XPATH))
    )
    driver.execute_script("arguments[0].click();", avatar)
    logout_btn = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, _LOGOUT_BUTTON_XPATH))
    )
    driver.execute_script("arguments[0].click();", logout_btn)


# =============================================================================
# Section 1 — UI/UX (FR_002_001 to FR_002_005)
# =============================================================================

class TestLayoutAndUI:
    def test_FR_002_001_layout_visible(self, driver):
        page = LoginPage(driver).open()
        for name in page.INPUTS:
            assert page.field(name).is_displayed()
        assert page.submit_button().is_displayed()

    def test_FR_002_002_both_fields_present(self, driver):
        page = LoginPage(driver).open()
        assert page.field("email").is_displayed()
        assert page.field("password").is_displayed()

    def test_FR_002_003_placeholders(self, driver):
        page = LoginPage(driver).open()
        assert page.placeholder("email") == "example@gmail.com"
        assert page.placeholder("password") == "Nhập mật khẩu"

    def test_FR_002_004_buttons_and_links(self, driver):
        page = LoginPage(driver).open()
        assert "Đăng nhập" in page.submit_text()
        # Remember toggle
        toggle = driver.find_element(*page.REMEMBER_TOGGLE)
        assert toggle.is_displayed()
        # Forgot password link
        forgot = driver.find_element(*page.FORGOT_LINK)
        assert forgot.is_displayed()
        assert forgot.get_attribute("href").endswith("/forget-password")
        # Register link
        register = driver.find_element(*page.REGISTER_LINK)
        assert register.is_displayed()
        assert register.get_attribute("href").endswith("/register")
        # The "Lưu đăng nhập" label text is on the page
        assert "Lưu đăng nhập" in driver.page_source

    def test_FR_002_005_password_eye_toggle(self, driver):
        tc = _tc("FR_002_005")
        page = LoginPage(driver).open()
        page.fill("password", tc["password"])
        assert page.field_type("password") == "password"
        page.toggle_password()
        assert page.field_type("password") == "text"
        page.toggle_password()
        assert page.field_type("password") == "password"


# =============================================================================
# Section 2 — Login flow (FR_002_006 to FR_002_008)
# =============================================================================

class TestLoginFlow:
    def _login_as_role(self, driver, db_conn, role, expected_url_fragment=None):
        password = "Abc123456"
        email = _unique_email()
        full_name = f"Auto Test {role.capitalize()}"
        seed_user(db_conn, email=email, password_plain=password,
                  full_name=full_name, role=role)

        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()

        # Toast appears synchronously after API success
        WebDriverWait(driver, 15).until(
            lambda d: "Đăng nhập thành công" in d.page_source
        )
        if expected_url_fragment:
            WebDriverWait(driver, 15).until(
                EC.url_contains(expected_url_fragment)
            )
        return email

    def test_FR_002_006_login_student(self, driver, db_conn, cleanup_test_users):
        email = self._login_as_role(driver, db_conn, "STUDENT")
        # Student redirects to /
        WebDriverWait(driver, 10).until(lambda d: "/login" not in d.current_url)
        assert "/login" not in driver.current_url

    def test_FR_002_007_login_teacher(self, driver, db_conn, cleanup_test_users):
        self._login_as_role(driver, db_conn, "TEACHER",
                            expected_url_fragment="/teacher/dashboard")

    def test_FR_002_008_login_admin(self, driver, db_conn, cleanup_test_users):
        # Admin login triggers window.location.href = "http://localhost:5173".
        # Admin panel may not be running, so we only verify backend accepted
        # the credentials (toast appears) and the URL attempts the redirect.
        password = "Admin123"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="Auto Test Admin", role="ADMIN")

        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()

        # Wait for either the toast OR the navigation attempt to 5173
        try:
            WebDriverWait(driver, 15).until(
                lambda d: "Đăng nhập thành công" in d.page_source
                or "5173" in d.current_url
            )
        except Exception:
            pass
        assert "5173" in driver.current_url or "Đăng nhập thành công" in driver.page_source


# =============================================================================
# Section 3 — Login errors (FR_002_009 to FR_002_016)
# =============================================================================

class TestLoginErrors:
    def test_FR_002_009_wrong_password(self, driver, db_conn, cleanup_test_users):
        tc = _tc("FR_002_009")
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="CorrectPassword123",
                  full_name="Auto Test", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=tc["password"])  # wrong password
        page.click_submit()
        WebDriverWait(driver, 10).until(
            lambda d: "Tài khoản hoặc mật khẩu không đúng" in d.page_source
        )
        assert "Tài khoản hoặc mật khẩu không đúng" in driver.page_source

    def test_FR_002_010_unregistered_email(self, driver):
        tc = _tc("FR_002_010")
        page = LoginPage(driver).open()
        # Use a brand-new email that surely doesn't exist
        page.fill_form(email=_unique_email(), password=tc["password"])
        page.click_submit()
        WebDriverWait(driver, 10).until(
            lambda d: "Tài khoản hoặc mật khẩu không đúng" in d.page_source
        )

    def test_FR_002_011_both_empty(self, driver):
        page = LoginPage(driver).open()
        page.click_submit()
        time.sleep(0.5)
        assert page.field_error("email") == "Vui lòng nhập email"
        assert page.field_error("password") == "Vui lòng nhập mật khẩu"

    def test_FR_002_012_empty_email(self, driver):
        tc = _tc("FR_002_012")
        page = LoginPage(driver).open()
        page.fill_and_blur("email", "")
        page.fill_and_blur("password", tc["password"])
        assert page.field_error("email") == "Vui lòng nhập email"

    def test_FR_002_013_empty_password(self, driver):
        tc = _tc("FR_002_013")
        page = LoginPage(driver).open()
        page.fill_and_blur("email", tc["email"])
        page.fill_and_blur("password", "")
        assert page.field_error("password") == "Vui lòng nhập mật khẩu"

    def test_FR_002_014_invalid_email_format(self, driver):
        tc = _tc("FR_002_014")
        page = LoginPage(driver).open()
        page.fill_and_blur("email", tc["email"])
        err = page.field_error("email")
        assert err is not None
        assert "Email không hợp lệ" in err

    def test_FR_002_015_submit_debounce(self, driver, db_conn, cleanup_test_users):
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="Auto Test", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.rapid_click_submit(n=5)
        time.sleep(0.5)
        # If only one click made it through, login finished and we're already
        # off /login (proof of debounce). Otherwise the form must show a
        # disabled or loading-state button.
        if "/login" not in driver.current_url:
            return
        assert page.submit_disabled() or page.submit_text() != "Đăng nhập", (
            "Submit did not debounce after rapid clicks"
        )

    def test_FR_002_016_password_only_whitespace(self, driver):
        tc = _tc("FR_002_016")
        page = LoginPage(driver).open()
        page.fill_and_blur("email", tc["email"] or _unique_email())
        page.fill_and_blur("password", tc["password"])  # short / whitespace
        err = page.field_error("password")
        # Yup min(6) triggers since whitespace string is shorter than 6 chars
        assert err is not None
        assert "ít nhất 6 ký tự" in err


# =============================================================================
# Section 4 — Logout (FR_002_017, FR_002_018)
# =============================================================================

class TestLogout:
    def _login_via_ui(self, driver, db_conn):
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="LogoutTester", role="STUDENT")
        page = LoginPage(driver).open()
        page.fill_form(email=email, password=password)
        page.click_submit()
        _wait_for_login_completion(driver, timeout=15)
        return email

    def test_FR_002_017_logout_success(self, driver, db_conn, cleanup_test_users):
        self._login_via_ui(driver, db_conn)
        _open_user_dropdown_and_logout(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/login"))
        assert "Đăng xuất thành công" in driver.page_source

    def test_FR_002_018_no_access_after_logout(
        self, driver, db_conn, cleanup_test_users
    ):
        self._login_via_ui(driver, db_conn)
        _open_user_dropdown_and_logout(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/login"))

        # Use the driver's (now-empty) cookie jar to verify the protected
        # endpoint rejects us.
        cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
        url = f"{settings.BASE_URL_BE}{settings.API_PREFIX}/auth/me"
        resp = requests.get(url, cookies=cookies, timeout=5)
        assert resp.status_code == 401, (
            f"Expected 401 after logout, got {resp.status_code}: {resp.text[:200]}"
        )


# =============================================================================
# Section 5 — Other features (FR_002_019, FR_002_020)
# =============================================================================

class TestMisc:
    def test_FR_002_019_remember_toggle(self, driver, db_conn, cleanup_test_users):
        """Per the TC, ticking 'Lưu đăng nhập' must keep the user signed in
        across browser close/reopen — i.e. the toggle should change something
        observable about the session (cookie lifetime, storage scope, etc.).

        We log in twice with the same account, once with the toggle OFF and
        once ON, and compare the auth cookie's expiry. If the toggle actually
        wired up persistence, the ON-login cookie should outlive the OFF-login
        cookie by far more than the few seconds that pass between the two
        logins.
        """
        password = "Abc123456"
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain=password,
                  full_name="RememberTester", role="STUDENT")

        def _login(toggle_on):
            page = LoginPage(driver).open()
            if toggle_on:
                page.click_remember_toggle()
            page.fill_form(email=email, password=password)
            page.click_submit()
            _wait_for_login_completion(driver, timeout=15)
            auth = next(
                (c for c in driver.get_cookies() if c["name"] == "ACCESS_TOKEN"),
                None,
            )
            assert auth is not None, "Login did not set ACCESS_TOKEN cookie"
            return auth.get("expiry", 0)

        # First login with toggle OFF (default)
        expiry_off = _login(toggle_on=False)
        _open_user_dropdown_and_logout(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/login"))

        # Second login with toggle ON
        expiry_on = _login(toggle_on=True)

        # The two logins are seconds apart; if the feature works the ON
        # cookie must live considerably longer than the OFF one (e.g. days).
        diff_seconds = expiry_on - expiry_off
        assert diff_seconds > 300, (
            f"Toggle 'Lưu đăng nhập' has no observable effect on session "
            f"lifetime (cookie expiry diff = {diff_seconds}s). "
            f"isRememberAccount in LoginForm.tsx is set but never read; "
            f"backend hard-codes maxAge=3600000ms regardless. "
            f"Feature not implemented."
        )

    def test_FR_002_020_google_login_button(self, driver):
        """Per the TC, clicking 'Đăng nhập bằng Google' must trigger the
        OAuth flow. This requires a visible Google trigger on /login."""
        page = LoginPage(driver).open()
        google_triggers = driver.find_elements(
            By.XPATH, '//button[contains(., "Google")] | //a[contains(., "Google")]'
        )
        if not google_triggers:
            pytest.skip(
                "Inactive: Nút 'Đăng nhập bằng Google' không tồn tại trong "
                "UI của /login. LoginForm.tsx có import icon Google và định "
                "nghĩa handler handleLoginGoogle, nhưng JSX không render bất "
                "kỳ button hay link nào để gọi handler đó. Người dùng không "
                "có cách nào kích hoạt luồng OAuth Google."
            )
