"""Page Object for /login.

Differences from RegisterPage:
  - Only 2 inputs (email, password) — schema is much simpler.
  - Password field uses InputPassword which renders the eye toggle as a
    `<div class="cursor-pointer">`, NOT a `<button>`.
  - Form mode is 'onBlur', so callers must trigger blur after typing.
  - Has a "Lưu đăng nhập" toggle (ToggleButton, role="switch") and a
    Google OAuth button.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class LoginPage(BasePage):
    URL_PATH = "/login"

    EMAIL = (By.CSS_SELECTOR, 'input[name="email"]')
    PASSWORD = (By.CSS_SELECTOR, 'input[name="password"]')

    SUBMIT_BUTTON = (By.XPATH, '//button[@type="submit"]')
    REMEMBER_TOGGLE = (By.XPATH, '//button[@role="switch"]')
    FORGOT_LINK = (By.XPATH, '//a[contains(., "Quên mật khẩu")]')
    REGISTER_LINK = (By.XPATH, '//a[contains(., "Đăng ký ngay")]')

    INPUTS = {"email": EMAIL, "password": PASSWORD}

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

    def fill_form(self, email="", password=""):
        self.fill_and_blur("email", email)
        self.fill_and_blur("password", password)

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
        xpath = (
            f'//input[@name="{name}"]'
            f'/ancestor::div[2]/p[contains(@class, "text-red")]'
        )
        els = self.driver.find_elements(By.XPATH, xpath)
        return els[0].text if els else None

    # --- Password eye toggle (InputPassword renders the icon as a <div>) ---

    def toggle_password(self):
        xpath = (
            '//input[@name="password"]'
            '/following-sibling::div//div[contains(@class, "cursor-pointer")]'
        )
        self.driver.find_element(By.XPATH, xpath).click()

    # --- Remember toggle ---

    def remember_state(self):
        return self.find(self.REMEMBER_TOGGLE).get_attribute("aria-checked") == "true"

    def click_remember_toggle(self):
        self.click(self.REMEMBER_TOGGLE)

    # --- Inline error box (not a field-level yup error) ---

    def inline_error_text(self):
        """The login API error renders inside <div class='bg-red-50'><p>...</p></div>."""
        els = self.driver.find_elements(
            By.XPATH, '//div[contains(@class, "bg-red-50")]//p'
        )
        return els[0].text if els else None

    # --- Convenience ---

    def wait_for_url_change(self, away_from="/login", timeout=15):
        WebDriverWait(self.driver, timeout).until(
            lambda d: away_from not in d.current_url
        )
