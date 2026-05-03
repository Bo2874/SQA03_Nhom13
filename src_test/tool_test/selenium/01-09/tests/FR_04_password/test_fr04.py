"""FR_04 — Password management (change/reset) system tests.

16 test cases sourced from sheet FR_04 in ss_test_13.xlsx.

Important findings about the implementation:
  - ForgotPasswordForm.tsx imports `forgotPassword` from @/apis/auth, but
    auth.ts does not export that function. Calling it throws at runtime,
    so the entire forgot-password submit flow is broken.
  - ResetPasswordForm.tsx sends { newPassword, token } to PUT
    /auth/reset-password, but the backend's ResetPasswordDto requires
    { email, newPassword, otpPin }. The contract is mismatched, so
    success is unreachable through the UI even with a valid token.

Tests that depend on these broken contracts will fail with a Note that
explains the root cause.
"""
import time
import uuid

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.forget_password_page import ForgetPasswordPage
from pages.reset_password_page import ResetPasswordPage
from utils.csv_reader import load_csv
from utils.db_helper import seed_user


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_04_password_management_change_reset.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


# =============================================================================
# Section 1 — Forget password screen UI (FR_004_001)
# =============================================================================

class TestForgetPasswordUI:
    def test_FR_004_001_layout(self, driver):
        page = ForgetPasswordPage(driver).open()
        # Email input present
        assert page.find(page.EMAIL).is_displayed()
        # Submit button shows "Gửi mã xác nhận"
        assert "Gửi mã xác nhận" in page.submit_button_text()
        # Back to login link present and points to /login
        link = driver.find_element(*page.BACK_TO_LOGIN_LINK)
        assert link.is_displayed()
        assert link.get_attribute("href").endswith("/login")
        # Label "Nhập email của bạn" appears somewhere on the page
        assert "Nhập email của bạn" in driver.page_source


# =============================================================================
# Section 2 — Forget password flow (FR_004_002 to FR_004_008)
# =============================================================================

class TestForgetPasswordFlow:
    def test_FR_004_002_submit_success(self, driver, db_conn, cleanup_test_users):
        """TC expects 'Mã xác nhận đã được gửi đến email của bạn !' after
        clicking 'Gửi mã xác nhận' with a registered email."""
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="Abc123456",
                  full_name="ForgotTester", role="STUDENT")
        page = ForgetPasswordPage(driver).open()
        page.fill_email(email)
        page.click_submit()
        # Wait briefly for whatever message ends up rendered
        time.sleep(2)
        msg = page.inline_message_text()
        assert "Mã xác nhận đã được gửi" in msg, (
            f"TC expects success message 'Mã xác nhận đã được gửi đến email "
            f"của bạn !' after submit, but the form's onSubmit handler calls "
            f"forgotPassword(email) which is imported from @/apis/auth at "
            f"L12 but is NOT exported from that module. Runtime error is "
            f"caught and assigned to message. Actual message displayed: "
            f"{msg!r}"
        )

    def test_FR_004_003_submit_unregistered_email(self, driver):
        """TC: submit with an email that is not in DB. Per the implementation
        ForgotPasswordForm's submit will crash before even reaching the
        backend (forgotPassword is undefined), so the test asserts the
        success message — which will fail."""
        page = ForgetPasswordPage(driver).open()
        page.fill_email(_unique_email())
        page.click_submit()
        time.sleep(2)
        msg = page.inline_message_text()
        # We expect the form to either show success (current spec is not
        # documented — sheet leaves Expected blank) OR an error stating the
        # email is not registered. The actual behaviour: forgotPassword is
        # undefined → runtime error.
        assert ("Mã xác nhận đã được gửi" in msg
                or "không tồn tại" in msg.lower()
                or "không tìm thấy" in msg.lower()), (
            f"Expected either a success or 'email not registered' message "
            f"after submit. Forgot-password handler crashes because "
            f"forgotPassword is not exported from @/apis/auth. "
            f"Actual message: {msg!r}"
        )

    def test_FR_004_004_invalid_email_format(self, driver):
        tc = _tc("FR_004_004")
        page = ForgetPasswordPage(driver).open()
        page.fill_and_blur_email(tc["email"])
        err = page.field_error("email")
        assert err is not None and "Email không hợp lệ" in err, (
            f"Expected 'Email không hợp lệ' on blur with invalid email; got {err!r}"
        )

    def test_FR_004_005_empty_email(self, driver):
        page = ForgetPasswordPage(driver).open()
        page.fill_and_blur_email("")
        # Yup may not trigger required error on blur if the field was never
        # touched — try clicking submit too.
        if page.field_error("email") is None:
            page.click_submit()
            time.sleep(0.3)
        err = page.field_error("email")
        assert err is not None and "Vui lòng nhập email" in err, (
            f"Expected 'Vui lòng nhập email' for empty email; got {err!r}"
        )

    def test_FR_004_006_resend_during_countdown(self, driver, db_conn, cleanup_test_users):
        """TC expects: after a successful submit a 60s countdown begins and
        the button label switches to 'Gửi lại mã sau Xs'. Try submitting
        again during that window and the button must be disabled."""
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="Abc123456",
                  full_name="ForgotTester", role="STUDENT")
        page = ForgetPasswordPage(driver).open()
        page.fill_email(email)
        page.click_submit()
        time.sleep(2)
        # After submit, button label should be "Gửi lại mã sau Xs"
        text = page.submit_button_text()
        assert "Gửi lại mã sau" in text and page.submit_disabled(), (
            f"TC expects the submit button to switch to 'Gửi lại mã sau Xs' "
            f"and be disabled after a successful submit. The countdown is "
            f"started in onSubmit's try-block, but onSubmit crashes because "
            f"forgotPassword is undefined — so the countdown never begins. "
            f"Button text actually shows: {text!r}, disabled={page.submit_disabled()}"
        )

    def test_FR_004_007_resend_after_countdown(self, driver, db_conn, cleanup_test_users):
        """TC: wait the full 60s countdown, then click submit again; the
        button must accept the click and start a new countdown."""
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="Abc123456",
                  full_name="ForgotTester", role="STUDENT")
        page = ForgetPasswordPage(driver).open()
        page.fill_email(email)
        page.click_submit()
        time.sleep(2)
        # Cannot proceed: countdown depends on a successful submit, which
        # crashes. Bail with a clear message.
        if "Gửi lại mã sau" not in page.submit_button_text():
            pytest.fail(
                "Cannot test resend-after-countdown because the initial "
                "submit failed: forgotPassword is not exported from "
                "@/apis/auth, so the countdown never starts. Button text "
                f"after submit: {page.submit_button_text()!r}"
            )
        # If we somehow got here (countdown is running), wait and retry
        time.sleep(62)
        page.click_submit()
        time.sleep(2)
        assert "Gửi lại mã sau" in page.submit_button_text(), (
            "Expected a fresh countdown after second submit"
        )

    def test_FR_004_008_back_to_login_link(self, driver):
        page = ForgetPasswordPage(driver).open()
        link = driver.find_element(*page.BACK_TO_LOGIN_LINK)
        assert link.get_attribute("href").endswith("/login")
        link.click()
        WebDriverWait(driver, 10).until(EC.url_contains("/login"))


# =============================================================================
# Section 3 — Reset password screen UI (FR_004_009)
# =============================================================================

class TestResetPasswordUI:
    def test_FR_004_009_open_from_email_link(self, driver, db_conn, cleanup_test_users):
        """TC step 1: 'Mở link reset từ email'. The reset link is emailed
        only after a successful forgot-password submit. Since
        forgotPassword is broken, no link is ever generated — the user
        cannot legitimately reach this screen."""
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="Abc123456",
                  full_name="ResetTester", role="STUDENT")
        page = ForgetPasswordPage(driver).open()
        page.fill_email(email)
        page.click_submit()
        time.sleep(2)
        msg = page.inline_message_text()
        assert "Mã xác nhận đã được gửi" in msg, (
            f"TC requires reaching the reset screen via an email link, but "
            f"the forgot-password submit fails at runtime (forgotPassword "
            f"is not exported from @/apis/auth). No email/link is generated, "
            f"so the reset screen is unreachable through the documented "
            f"user flow. Forgot-password message: {msg!r}"
        )


# =============================================================================
# Section 4 — Reset password flow (FR_004_010 to FR_004_015)
# =============================================================================

class TestResetPasswordFlow:
    def test_FR_004_010_reset_success(self, driver, db_conn, cleanup_test_users):
        """TC: open /new-password with a valid token, type new password,
        submit, expect 'Mật khẩu đã được đặt lại thành công.'"""
        email = _unique_email()
        seed_user(db_conn, email=email, password_plain="OldPass123",
                  full_name="ResetTester", role="STUDENT")
        # No real token can be obtained because forgot-password is broken
        # AND because the FE/BE contract is mismatched (FE sends `token`,
        # backend expects `otpPin` + `email`). Try with a fake token; the
        # success message must surface for this TC to pass.
        page = ResetPasswordPage(driver).open(token="fake-token-1234")
        page.fill_and_blur("newPassword", "NewPass123")
        page.fill_and_blur("confirmPassword", "NewPass123")
        page.click_submit()
        time.sleep(3)
        msg = page.inline_message_text()
        assert "đã được đặt lại thành công" in msg, (
            f"TC expects success message 'Mật khẩu đã được đặt lại thành công.' "
            f"after submit. Reachable success requires a valid token AND a "
            f"matching FE/BE contract. ResetPasswordForm.tsx L65 sends "
            f"{{ newPassword, token }} but ResetPasswordDto requires "
            f"{{ email, newPassword, otpPin }} — backend rejects with a "
            f"validation error before any reset can occur. "
            f"Actual message: {msg!r}"
        )

    def test_FR_004_011_passwords_mismatch(self, driver):
        page = ResetPasswordPage(driver).open(token="any")
        page.fill_and_blur("newPassword", "NewPass123")
        page.fill_and_blur("confirmPassword", "Different1")
        err = page.field_error("confirmPassword")
        assert err is not None and "không trùng khớp" in err, (
            f"Expected 'Mật khẩu không trùng khớp' for mismatched passwords; "
            f"got {err!r}"
        )

    def test_FR_004_012_password_too_short(self, driver):
        page = ResetPasswordPage(driver).open(token="any")
        page.fill_and_blur("newPassword", "abc")
        err = page.field_error("newPassword")
        assert err is not None and "ít nhất 6 ký tự" in err, (
            f"Expected 'Mật khẩu phải có ít nhất 6 ký tự' for short password; "
            f"got {err!r}"
        )

    def test_FR_004_013_empty_passwords(self, driver):
        page = ResetPasswordPage(driver).open(token="any")
        page.click_submit()
        time.sleep(0.5)
        err_new = page.field_error("newPassword")
        err_confirm = page.field_error("confirmPassword")
        assert err_new == "Vui lòng nhập mật khẩu", f"newPassword error: {err_new!r}"
        # The required message used in the schema is
        # PASSWORD_CONFIRMATION_REQUIRED_MESSAGE = "Vui lòng xác nhận mật khẩu"
        assert err_confirm == "Vui lòng xác nhận mật khẩu", (
            f"confirmPassword error: {err_confirm!r}"
        )

    def test_FR_004_014_no_token(self, driver):
        """Submit on /new-password with no token query → 'Token không hợp lệ!'."""
        page = ResetPasswordPage(driver).open()  # no token
        page.fill_and_blur("newPassword", "NewPass123")
        page.fill_and_blur("confirmPassword", "NewPass123")
        page.click_submit()
        time.sleep(1)
        msg = page.inline_message_text()
        assert "Token không hợp lệ" in msg, (
            f"Expected 'Token không hợp lệ!' when no ?token= is present in "
            f"the URL; got {msg!r}"
        )

    def test_FR_004_015_token_expired(self, driver):
        """TC: submit with an expired token. Backend uses Redis OTP with
        TTL — an expired entry is missing entirely, indistinguishable from
        an invalid token. The TC has no specific expected text in the
        sheet, but a meaningful test must verify that an expired/invalid
        token produces a backend-driven rejection, not a generic crash."""
        page = ResetPasswordPage(driver).open(token="definitely-expired-token")
        page.fill_and_blur("newPassword", "NewPass123")
        page.fill_and_blur("confirmPassword", "NewPass123")
        page.click_submit()
        time.sleep(2)
        msg = page.inline_message_text()
        # We expect a specific expired/invalid-token message from backend,
        # something like 'Invalid otp pin or expired.' surfaced to the UI.
        # Anything else (silent success, generic crash, success message) is
        # a failure of this TC.
        assert ("hết hạn" in msg.lower()
                or "expired" in msg.lower()
                or "invalid" in msg.lower()
                or "không hợp lệ" in msg.lower()), (
            f"Expected an expired/invalid token error after submit. "
            f"Backend's resetPassword expects {{ email, newPassword, otpPin }} "
            f"but FE sends {{ newPassword, token }}, so the backend rejects "
            f"with a validation error rather than an OTP-expired error. "
            f"Actual message: {msg!r}"
        )


# =============================================================================
# Section 5 — Eye toggle (FR_004_016)
# =============================================================================

class TestEyeToggle:
    def test_FR_004_016_password_eye_toggle(self, driver):
        tc = _tc("FR_004_016")
        page = ResetPasswordPage(driver).open(token="any")
        page.fill("newPassword", tc["password"])
        assert page.field_type("newPassword") == "password"
        page.toggle_visibility("newPassword")
        assert page.field_type("newPassword") == "text"
        page.toggle_visibility("newPassword")
        assert page.field_type("newPassword") == "password"
