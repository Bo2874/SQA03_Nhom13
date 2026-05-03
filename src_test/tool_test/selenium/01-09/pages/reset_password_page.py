"""Page Object for /new-password.

Form has two InputPassword fields (newPassword + confirmPassword) and a
submit button. The token comes from URL query string `?token=...`. The
form's onSubmit calls getParams("token"); if missing it sets the message
"Token không hợp lệ!".
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from pages.base_page import BasePage


class ResetPasswordPage(BasePage):
    URL_PATH = "/new-password"

    NEW_PASSWORD = (By.CSS_SELECTOR, 'input[name="newPassword"]')
    CONFIRM_PASSWORD = (By.CSS_SELECTOR, 'input[name="confirmPassword"]')
    SUBMIT_BUTTON = (By.XPATH, '//button[contains(., "Đặt lại mật khẩu")]')
    BACK_TO_LOGIN_LINK = (By.XPATH, '//a[contains(., "Quay lại trang đăng nhập")]')
    REGISTER_LINK = (By.XPATH, '//a[contains(., "Đăng kí ngay") or contains(., "Đăng ký ngay")]')
    INLINE_MESSAGE = (By.XPATH, '//div[contains(@class, "text-red-300")]')

    INPUTS = {
        "newPassword": NEW_PASSWORD,
        "confirmPassword": CONFIRM_PASSWORD,
    }

    def open(self, token=None):
        path = self.URL_PATH
        if token:
            path += f"?token={token}"
        return super().open(path)

    def fill(self, name, value):
        el = self.find(self.INPUTS[name])
        el.clear()
        if value:
            el.send_keys(value)
        return el

    def fill_and_blur(self, name, value):
        self.fill(name, value).send_keys(Keys.TAB)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def submit_button(self):
        return self.find(self.SUBMIT_BUTTON)

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

    def field_type(self, name):
        return self.find(self.INPUTS[name]).get_attribute("type")

    def toggle_visibility(self, name):
        xpath = f'//input[@name="{name}"]/following-sibling::div//div[contains(@class, "cursor-pointer")]'
        self.driver.find_element(By.XPATH, xpath).click()
