"""Page Object for /forget-password.

Form has a single email input + "Gửi mã xác nhận" submit button. After a
successful submit the button label switches to "Gửi lại mã sau Xs" and a
60s countdown begins. The success message is shown via a <div class="text-red">
element directly inside the form.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from pages.base_page import BasePage


class ForgetPasswordPage(BasePage):
    URL_PATH = "/forget-password"

    EMAIL = (By.CSS_SELECTOR, 'input[name="email"]')
    SUBMIT_BUTTON = (By.XPATH, '//button[@type="submit"]')
    BACK_TO_LOGIN_LINK = (By.XPATH, '//a[contains(., "Quay lại trang đăng nhập")]')
    # The <div className="text-sm text-red my-4">{message}</div> sits between
    # the input and the submit button.
    INLINE_MESSAGE = (By.XPATH, '//div[contains(@class, "text-red") and not(contains(@class, "bg-red-50"))]')

    def open(self):
        return super().open(self.URL_PATH)

    def fill_email(self, value):
        el = self.find(self.EMAIL)
        el.clear()
        if value:
            el.send_keys(value)
        return el

    def fill_and_blur_email(self, value):
        self.fill_email(value).send_keys(Keys.TAB)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def submit_button(self):
        return self.find(self.SUBMIT_BUTTON)

    def submit_button_text(self):
        return self.submit_button().text.strip()

    def submit_disabled(self):
        return self.submit_button().get_attribute("disabled") is not None

    def field_error(self, name):
        xpath = (
            f'//input[@name="{name}"]'
            f'/ancestor::div[2]/p[contains(@class, "text-red")]'
        )
        els = self.driver.find_elements(By.XPATH, xpath)
        return els[0].text if els else None

    def inline_message_text(self):
        els = self.driver.find_elements(*self.INLINE_MESSAGE)
        for el in els:
            t = el.text.strip()
            if t:
                return t
        return ""
