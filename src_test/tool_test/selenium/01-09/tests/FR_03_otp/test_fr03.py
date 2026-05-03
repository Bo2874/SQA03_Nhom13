"""FR_03 — OTP verification system tests.

15 test cases sourced from sheet FR_03 in ss_test_13.xlsx
(see data/FR_03_otp_verification.csv).

The OTP UI is the second step of the registration form (RegisterForm.tsx
renders step="otp" after a successful /api/v1/auth/request-otp call).
We reach it by submitting a valid registration form first.

OTP storage: backend writes the 6-digit code into Redis at key
'otp:<email>' with TTL 300s (otp.service.ts L13). We read it directly
from Redis instead of from a real mailbox.
"""
import time
import uuid

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.register_page import RegisterPage
from utils.csv_reader import load_csv
from utils.db_helper import find_user_by_email
from utils.otp_helper import wait_for_otp


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_03_otp_verification.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _go_to_otp_step(driver):
    """Submit a valid registration form and assert we land on the OTP step.
    Returns (page, email) — the email is needed to read the OTP from Redis.
    """
    email = _unique_email()
    page = RegisterPage(driver).open()
    page.fill_form(
        email=email,
        fullName="OTPTester",
        phone="",
        password="Abc123456",
        confirmPassword="Abc123456",
    )
    page.click_submit()
    assert page.is_in_otp_step(timeout=15), (
        "Form did not transition to OTP step after submit"
    )
    return page, email


# =============================================================================
# Section 1 — UI/UX (FR_003_001 to FR_003_004)
# =============================================================================

class TestOtpScreenUI:
    def test_FR_003_001_otp_screen_layout(self, driver, redis_conn):
        page, email = _go_to_otp_step(driver)
        # Heading
        assert "Xác thực OTP" in page.otp_heading_text()
        # Email display contains the email we registered with
        email_text = page.otp_email_display_text()
        assert email in email_text, (
            f"Expected email {email} in OTP screen, got: {email_text!r}"
        )
        # Verify button label
        btn_text = page.verify_button().text
        assert "Xác thực và Đăng ký" in btn_text

    def test_FR_003_002_otp_input_placeholder(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        assert page.otp_input_placeholder() == "000000"

    def test_FR_003_003_countdown_and_resend_link(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        # Initial state: countdown is running, so resend countdown text is shown
        # AND the resend button is hidden (per RegisterForm OTP-step JSX).
        assert page.resend_countdown_visible(), "Resend countdown not shown"
        assert not page.resend_button_visible(timeout=1), (
            "Resend button is visible while countdown should be running"
        )
        # Countdown text should mention seconds
        countdown_el = page.find(page.OTP_RESEND_COUNTDOWN)
        assert "Gửi lại mã sau" in countdown_el.text
        assert "s" in countdown_el.text  # e.g. "Gửi lại mã sau 60s"

    def test_FR_003_004_back_link_present(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        assert page.back_button_visible(), (
            "'Quay lại chỉnh sửa thông tin' button not present on OTP step"
        )


# =============================================================================
# Section 2 — OTP verification (FR_003_005 to FR_003_010)
# =============================================================================

class TestOtpVerification:
    def test_FR_003_005_correct_otp_succeeds(
        self, driver, db_conn, redis_conn, cleanup_test_users
    ):
        page, email = _go_to_otp_step(driver)
        otp = wait_for_otp(redis_conn, email, timeout=10)
        page.fill_otp(otp)
        page.click_verify()
        page.wait_for_url_contains("/login", timeout=15)
        # User actually persisted in DB
        user = find_user_by_email(db_conn, email)
        assert user is not None, "User not created after OTP verify"

    def test_FR_003_006_wrong_otp_rejected(
        self, driver, db_conn, redis_conn, cleanup_test_users
    ):
        page, email = _go_to_otp_step(driver)
        # Make sure the real OTP and our wrong OTP differ
        real = wait_for_otp(redis_conn, email, timeout=10)
        wrong = "000000" if real != "000000" else "111111"
        page.fill_otp(wrong)
        page.click_verify()
        # Backend rejects with BadRequestException("Invalid or expired OTP").
        # Frontend surfaces it via inline error or toast.
        WebDriverWait(driver, 10).until(
            lambda d: page.get_inline_error() is not None
            or "Đăng ký thất bại" in d.page_source
            or "OTP" in d.page_source
        )
        # User must NOT exist in DB
        assert find_user_by_email(db_conn, email) is None, (
            "Wrong OTP should not create user"
        )

    def test_FR_003_007_expired_otp_rejected(
        self, driver, db_conn, redis_conn, cleanup_test_users
    ):
        page, email = _go_to_otp_step(driver)
        # Wait for OTP, then simulate expiry by deleting the Redis key.
        otp = wait_for_otp(redis_conn, email, timeout=10)
        redis_conn.delete(f"{settings.OTP_PREFIX}:{email}")
        page.fill_otp(otp)
        page.click_verify()
        WebDriverWait(driver, 10).until(
            lambda d: page.get_inline_error() is not None
            or "Đăng ký thất bại" in d.page_source
            or "OTP" in d.page_source
        )
        assert find_user_by_email(db_conn, email) is None

    def test_FR_003_008_short_otp_blocked(self, driver, redis_conn):
        """TC expects 'Vui lòng nhập mã OTP 6 số' to display after clicking
        Xác thực with a 3-digit OTP. Strict reading of the TC: if that
        message does not surface, the test fails."""
        page, _ = _go_to_otp_step(driver)
        page.fill_otp("123")
        # The handler in RegisterForm.tsx that would set this message only
        # runs if otp.length !== 6, but the verify button is also disabled
        # under the same condition — so via the UI the handler is unreachable.
        # Force the click via JS (after stripping disabled) to give the
        # validation a chance to fire; if it still doesn't show the expected
        # message, the implementation does not match the TC spec.
        btn = page.verify_button()
        driver.execute_script(
            "arguments[0].removeAttribute('disabled'); arguments[0].click();",
            btn,
        )
        time.sleep(0.5)
        err = page.get_inline_error()
        assert err is not None and "Vui lòng nhập mã OTP 6 số" in err, (
            f"TC expects inline message 'Vui lòng nhập mã OTP 6 số' when "
            f"submitting a 3-digit OTP. FE disables the verify button when "
            f"otp.length !== 6 (RegisterForm.tsx L234), so the handler that "
            f"would set this message is unreachable through normal UI use. "
            f"Inline error currently shown: {err!r}."
        )

    def test_FR_003_009_empty_otp_blocked(self, driver, redis_conn):
        """TC expects 'Vui lòng nhập mã OTP 6 số' when submitting empty OTP.
        Same root cause as FR_003_008: the message handler is dead code
        because the verify button is disabled when otp is empty."""
        page, _ = _go_to_otp_step(driver)
        page.fill_otp("")
        btn = page.verify_button()
        driver.execute_script(
            "arguments[0].removeAttribute('disabled'); arguments[0].click();",
            btn,
        )
        time.sleep(0.5)
        err = page.get_inline_error()
        assert err is not None and "Vui lòng nhập mã OTP 6 số" in err, (
            f"TC expects inline message 'Vui lòng nhập mã OTP 6 số' when "
            f"submitting empty OTP. Same cause as FR_003_008 — the verify "
            f"button is disabled (otp.length !== 6) so the handler that "
            f"sets this message never runs. Inline error currently: {err!r}."
        )

    def test_FR_003_010_letters_stripped_from_otp(self, driver, redis_conn):
        """Per RegisterForm.tsx: onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}.
        Letters should be stripped immediately, leaving only digits in the input."""
        page, _ = _go_to_otp_step(driver)
        page.fill_otp("abc123def")
        time.sleep(0.3)
        value = page.otp_input_value()
        assert value == "123", (
            f"Letters should be stripped on input. Expected '123', got {value!r}"
        )


# =============================================================================
# Section 3 — Resend OTP (FR_003_011 to FR_003_013)
# =============================================================================

class TestResendOtp:
    def test_FR_003_011_resend_after_countdown(
        self, driver, redis_conn, cleanup_test_users
    ):
        """Wait the full 60-second countdown, click resend, assert a new OTP
        is issued in Redis and the success toast appears."""
        page, email = _go_to_otp_step(driver)
        original_otp = wait_for_otp(redis_conn, email, timeout=10)
        # Wait for resend button (countdown 60s)
        WebDriverWait(driver, 70).until(
            lambda d: page.resend_button_visible(timeout=1)
        )
        page.click_resend()
        # Toast appears
        WebDriverWait(driver, 10).until(
            lambda d: "Mã OTP mới đã được gửi" in d.page_source
        )
        # Redis key should hold a (possibly new) OTP after the resend.
        # Backend uses setEx so the value is overwritten — assert presence,
        # and accept either same or different code (it's randomly generated).
        new_otp = redis_conn.get(f"{settings.OTP_PREFIX}:{email}")
        assert new_otp is not None and len(new_otp) == 6, (
            f"Resend should leave a fresh 6-digit OTP in Redis, got {new_otp!r}"
        )

    def test_FR_003_012_resend_hidden_during_countdown(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        # Countdown is initially 60s, so the resend button must NOT be visible
        assert page.resend_countdown_visible(), "Countdown not shown"
        assert not page.resend_button_visible(timeout=1), (
            "Resend button must be hidden while countdown is running"
        )

    def test_FR_003_013_countdown_starts_at_60s(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        countdown_el = page.find(page.OTP_RESEND_COUNTDOWN)
        text = countdown_el.text  # e.g. "Gửi lại mã sau 60s"
        # Extract the number
        import re
        m = re.search(r"(\d+)\s*s", text)
        assert m, f"Cannot find seconds count in {text!r}"
        seconds = int(m.group(1))
        # Initial countdown is 60s, but a tiny delay may already have ticked
        # it down — accept anything in [55..60] as initial state.
        assert 55 <= seconds <= 60, (
            f"Countdown should start near 60s, got {seconds}s"
        )


# =============================================================================
# Section 4 — Back to form (FR_003_014, FR_003_015)
# =============================================================================

class TestBackToForm:
    def test_FR_003_014_back_returns_to_form(self, driver, redis_conn):
        page, _ = _go_to_otp_step(driver)
        page.click_back_to_form()
        # We should be back on the form: email input is visible again
        assert page.is_visible(page.EMAIL, timeout=5), (
            "Email input should be visible again after going back"
        )
        # OTP input should NOT be visible
        otp_inputs = driver.find_elements(*page.OTP_INPUT)
        assert otp_inputs == [], "OTP input still present after going back"

    def test_FR_003_015_edit_and_resubmit(
        self, driver, redis_conn, cleanup_test_users
    ):
        page, _ = _go_to_otp_step(driver)
        page.click_back_to_form()
        assert page.is_visible(page.EMAIL, timeout=5)
        # Edit the email and resubmit
        new_email = _unique_email()
        page.fill_and_blur("email", new_email)
        page.click_submit()
        # Should land on OTP step again, this time with the NEW email shown
        assert page.is_in_otp_step(timeout=15), (
            "Form did not transition to OTP step after edit + resubmit"
        )
        email_text = page.otp_email_display_text()
        assert new_email in email_text, (
            f"OTP screen should show new email {new_email}, got {email_text!r}"
        )
