"""Page Object for /register.

The form is built with react-hook-form (mode: 'onBlur'), so callers MUST
trigger a blur after typing for validation to fire.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class RegisterPage(BasePage):
    URL_PATH = "/register"

    EMAIL = (By.CSS_SELECTOR, 'input[name="email"]')
    FULLNAME = (By.CSS_SELECTOR, 'input[name="fullName"]')
    PHONE = (By.CSS_SELECTOR, 'input[name="phone"]')
    PASSWORD = (By.CSS_SELECTOR, 'input[name="password"]')
    CONFIRM_PASSWORD = (By.CSS_SELECTOR, 'input[name="confirmPassword"]')

    SUBMIT_BUTTON = (By.XPATH, '//button[@type="submit"]')
    LOGIN_LINK = (By.XPATH, '//a[contains(., "Đăng nhập")]')

    OTP_INPUT = (By.CSS_SELECTOR, 'input[maxlength="6"]')
    VERIFY_BUTTON = (By.XPATH, '//button[contains(., "Xác thực và Đăng ký") or contains(., "Đang xác thực")]')
    OTP_HEADING = (By.XPATH, '//h2[contains(., "Xác thực OTP")]')
    OTP_EMAIL_DISPLAY = (By.XPATH, '//p[contains(., "Mã OTP đã được gửi đến email")]')
    OTP_RESEND_COUNTDOWN = (By.XPATH, '//p[contains(., "Gửi lại mã sau")]')
    OTP_RESEND_BUTTON = (By.XPATH, '//button[contains(., "Gửi lại mã OTP")]')
    OTP_BACK_BUTTON = (By.XPATH, '//button[contains(., "Quay lại chỉnh sửa thông tin")]')
    OTP_INLINE_ERROR = (By.XPATH, '//div[contains(@class, "bg-red-50")]//p')

    INPUTS = {
        "email": EMAIL,
        "fullName": FULLNAME,
        "phone": PHONE,
        "password": PASSWORD,
        "confirmPassword": CONFIRM_PASSWORD,
    }

    def open(self):
        return super().open(self.URL_PATH)

    # --- Form interaction ---

    def field(self, name):
        return self.find(self.INPUTS[name])

    def fill(self, name, value):
        el = self.field(name)
        el.clear()
        if value:
            el.send_keys(value)
        return el

    def fill_and_blur(self, name, value):
        self.fill(name, value).send_keys(Keys.TAB)

    def fill_form(self, email="", fullName="", phone="", password="", confirmPassword=""):
        self.fill_and_blur("email", email)
        self.fill_and_blur("fullName", fullName)
        self.fill_and_blur("phone", phone)
        self.fill_and_blur("password", password)
        self.fill_and_blur("confirmPassword", confirmPassword)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def submit_button(self):
        return self.find(self.SUBMIT_BUTTON)

    def submit_disabled(self):
        return self.submit_button().get_attribute("disabled") is not None

    def submit_text(self):
        return self.submit_button().text.strip()

    def rapid_click_submit(self, n=5):
        btn = self.submit_button()
        clicked = 0
        for _ in range(n):
            try:
                btn.click()
                clicked += 1
            except Exception:
                pass
        return clicked

    # --- Field state ---

    def placeholder(self, name):
        return self.field(name).get_attribute("placeholder")

    def field_type(self, name):
        return self.field(name).get_attribute("type")

    def field_error(self, name):
        """Error <p> is a sibling of the InputElement wrapper, both inside
        the FieldController div. Returns text or None."""
        xpath = (
            f'//input[@name="{name}"]'
            f'/ancestor::div[2]/p[contains(@class, "text-red")]'
        )
        els = self.driver.find_elements(By.XPATH, xpath)
        return els[0].text if els else None

    # --- Password eye toggle (icon button is sibling of the input) ---

    def _toggle_visibility(self, name):
        xpath = f'//input[@name="{name}"]/following-sibling::div//button'
        self.driver.find_element(By.XPATH, xpath).click()

    def toggle_password(self):
        self._toggle_visibility("password")

    def toggle_confirm_password(self):
        self._toggle_visibility("confirmPassword")

    # --- OTP step ---

    def is_in_otp_step(self, timeout=10):
        return self.is_visible(self.OTP_INPUT, timeout=timeout)

    def fill_otp(self, otp):
        el = self.find(self.OTP_INPUT)
        el.clear()
        el.send_keys(otp)

    def otp_input_value(self):
        return self.find(self.OTP_INPUT).get_attribute("value")

    def otp_input_placeholder(self):
        return self.find(self.OTP_INPUT).get_attribute("placeholder")

    def click_verify(self):
        self.click(self.VERIFY_BUTTON)

    def verify_button(self):
        return self.find(self.VERIFY_BUTTON)

    def verify_button_disabled(self):
        return self.verify_button().get_attribute("disabled") is not None

    def otp_heading_text(self):
        return self.find(self.OTP_HEADING).text

    def otp_email_display_text(self):
        return self.find(self.OTP_EMAIL_DISPLAY).text

    def resend_countdown_visible(self, timeout=2):
        return self.is_visible(self.OTP_RESEND_COUNTDOWN, timeout=timeout)

    def resend_button_visible(self, timeout=2):
        return self.is_visible(self.OTP_RESEND_BUTTON, timeout=timeout)

    def click_resend(self):
        self.click(self.OTP_RESEND_BUTTON)

    def back_button_visible(self):
        return self.is_visible(self.OTP_BACK_BUTTON, timeout=2)

    def click_back_to_form(self):
        self.click(self.OTP_BACK_BUTTON)

    def get_inline_error(self):
        els = self.driver.find_elements(*self.OTP_INLINE_ERROR)
        return els[0].text if els else None

    # --- Convenience ---

    def wait_for_url_contains(self, fragment, timeout=15):
        WebDriverWait(self.driver, timeout).until(EC.url_contains(fragment))
