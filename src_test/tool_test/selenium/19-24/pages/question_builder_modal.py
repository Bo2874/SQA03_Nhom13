"""Page Object for QuestionBuilderModal.

Used inside ExamEditPage. The modal exposes a question_text textarea,
4 default options (radio buttons for SINGLE_CHOICE), an "+ Thêm đáp án"
button, and an explanation textarea.

Custom validation in onSubmit (NOT yup):
  - Must select at least one correct answer → toast.error
  - SINGLE_CHOICE: cannot select more than one correct → toast.error
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class QuestionBuilderModalPage(BasePage):
    HEADING = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//h2[contains(., "câu hỏi")]'
    )
    QUESTION_TEXT_TEXTAREA = (
        By.XPATH, '//textarea[@placeholder="Nhập nội dung câu hỏi..."]'
    )
    EXPLANATION_TEXTAREA = (
        By.XPATH, '//textarea[contains(@placeholder, "Giải thích")]'
    )
    OPTION_TEXT_INPUTS = (
        By.XPATH,
        '//input[@type="text" and starts-with(@placeholder, "Đáp án ")]'
    )
    OPTION_RADIOS = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//input[@type="radio"]'
    )
    OPTION_CHECKBOXES = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//input[@type="checkbox"]'
    )
    DELETE_OPTION_BUTTONS = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[contains(@class, "text-red-600")]'
    )
    ADD_OPTION_BUTTON = (
        By.XPATH, '//button[contains(., "Thêm đáp án")]'
    )
    CANCEL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[normalize-space()="Hủy"]'
    )
    SUBMIT_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[@type="submit"]'
    )
    FIELD_ERRORS = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//p[contains(@class, "text-red-500")]'
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

    def fill_question_text(self, value):
        el = self.find(self.QUESTION_TEXT_TEXTAREA)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def fill_explanation(self, value):
        el = self.find(self.EXPLANATION_TEXTAREA)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def fill_option_text(self, index, value):
        inputs = self.driver.find_elements(*self.OPTION_TEXT_INPUTS)
        el = inputs[index]
        el.clear()
        # React-controlled inputs sometimes ignore .clear() — also dispatch
        # an explicit input event so RHF re-syncs.
        self.driver.execute_script(
            "arguments[0].dispatchEvent(new Event('input', {bubbles: true}));",
            el,
        )
        if value:
            el.send_keys(value)

    def option_text_value(self, index):
        inputs = self.driver.find_elements(*self.OPTION_TEXT_INPUTS)
        return inputs[index].get_attribute("value")

    def option_count(self):
        return len(self.driver.find_elements(*self.OPTION_TEXT_INPUTS))

    def select_correct_radio(self, index):
        # Use a fresh DOM query inside JS so we never hold a stale
        # WebElement reference (the radios re-render on every click).
        self.driver.execute_script(
            "document.querySelectorAll('div.fixed input[type=\"radio\"]')"
            "[arguments[0]].click();",
            index,
        )

    def select_correct_checkbox(self, index):
        self.driver.execute_script(
            "document.querySelectorAll('div.fixed input[type=\"checkbox\"]')"
            "[arguments[0]].click();",
            index,
        )

    def is_radio_checked(self, index):
        return bool(self.driver.execute_script(
            "return document.querySelectorAll('div.fixed input[type=\"radio\"]')"
            "[arguments[0]].checked;",
            index,
        ))

    def click_add_option(self):
        self.driver.find_element(*self.ADD_OPTION_BUTTON).click()

    def click_delete_option(self, index):
        btns = self.driver.find_elements(*self.DELETE_OPTION_BUTTONS)
        self.driver.execute_script("arguments[0].click();", btns[index])

    def field_error_texts(self):
        return [
            el.text for el in self.driver.find_elements(*self.FIELD_ERRORS)
            if el.text.strip()
        ]

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def cancel(self):
        self.driver.find_element(*self.CANCEL_BUTTON).click()

    def submit_button_text(self):
        return self.driver.find_element(*self.SUBMIT_BUTTON).text.strip()

    def submit_disabled(self):
        return self.driver.find_element(
            *self.SUBMIT_BUTTON
        ).get_attribute("disabled") is not None
