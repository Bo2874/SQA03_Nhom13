"""Page Object for the MaterialModal (course-material upload).

The modal uses native window.alert() for everything: file-validation
errors, upload success, submit success, and submit failure (see
MaterialModal.tsx). The TC sheet flags the success-path alerts as a UX
deviation (toast was expected).

The file <input type="file" id="material-file-input"> is hidden but in
the DOM, so Selenium's send_keys works on it directly.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class MaterialModalPage(BasePage):
    HEADING = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//h2[contains(., "tài liệu")]'
    )
    TITLE_INPUT = (
        By.XPATH,
        '//input[@type="text" and @placeholder="Nhập tên tài liệu..."]'
    )
    FILE_INPUT = (By.CSS_SELECTOR, 'input#material-file-input')
    UPLOAD_LABEL = (
        By.XPATH,
        '//label[@for="material-file-input"]'
    )
    HELPER_TEXT = (
        By.XPATH,
        '//p[contains(., "Hỗ trợ:") and contains(., "DOC")]'
    )
    CANCEL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[normalize-space()="Hủy"]'
    )
    SUBMIT_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[@type="submit"]'
    )

    def is_visible(self, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(self.HEADING)
            )
            return True
        except Exception:
            return False

    def heading_text(self):
        return self.find(self.HEADING).text

    def title_value(self):
        return self.find(self.TITLE_INPUT).get_attribute("value")

    def title_placeholder(self):
        return self.find(self.TITLE_INPUT).get_attribute("placeholder")

    def helper_text(self):
        try:
            return self.find(self.HELPER_TEXT).text
        except Exception:
            return ""

    def fill_title(self, value):
        el = self.find(self.TITLE_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def upload_file(self, absolute_path):
        self.driver.find_element(*self.FILE_INPUT).send_keys(absolute_path)

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def cancel(self):
        self.driver.find_element(*self.CANCEL_BUTTON).click()

    def submit_disabled(self):
        return self.driver.find_element(
            *self.SUBMIT_BUTTON
        ).get_attribute("disabled") is not None

    def submit_button_text(self):
        return self.driver.find_element(*self.SUBMIT_BUTTON).text.strip()

    def upload_label_text(self):
        return self.find(self.UPLOAD_LABEL).text
