"""Page Object for the EpisodeModal (create/edit a video lesson).

Selectors target the rendered DOM in EpisodeModal.tsx. The modal supports
two upload modes via a button toggle: "YouTube URL" (default) and
"Upload File". The file <input type="file"> is hidden but in the DOM, so
Selenium's send_keys works directly on it.

Form fields:
  - title (text)         — placeholder "Ví dụ: Giới thiệu về..."
  - order (number, min=1)
  - video_url (url, only visible in YouTube mode)
  - video_duration_seconds (number, min=1)
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage


class EpisodeModalPage(BasePage):
    HEADING = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//h2[contains(., "bài học")]'
    )
    TITLE_INPUT = (
        By.XPATH,
        '//input[@placeholder="Ví dụ: Giới thiệu về đường thẳng và mặt phẳng"]'
    )
    ORDER_INPUT = (
        By.XPATH,
        '//input[@type="number" and @placeholder="1, 2, 3, ..."]'
    )
    DURATION_INPUT = (
        By.XPATH,
        '//input[@type="number" and contains(@placeholder, "Ví dụ: 600")]'
    )
    YOUTUBE_TAB = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[contains(., "YouTube URL")]'
    )
    UPLOAD_TAB = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[contains(., "Upload File")]'
    )
    YOUTUBE_URL_INPUT = (
        By.XPATH,
        '//input[@type="url" and contains(@placeholder, "youtube.com")]'
    )
    FILE_INPUT = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//input[@type="file" and @accept="video/*"]'
    )
    CHOOSE_VIDEO_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[contains(., "Chọn video") '
        'or contains(., "Đang upload")]'
    )
    CANCEL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[normalize-space()="Hủy"]'
    )
    SUBMIT_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[@type="submit" '
        'and (contains(., "Tạo bài học") or contains(., "Cập nhật") or contains(., "Đang lưu"))]'
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

    def fill_title(self, value):
        el = self.find(self.TITLE_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def fill_order(self, value):
        el = self.find(self.ORDER_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value is not None and value != "":
            el.send_keys(str(value))

    def fill_duration(self, value):
        el = self.find(self.DURATION_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value is not None and value != "":
            el.send_keys(str(value))

    def click_youtube_tab(self):
        self.click(self.YOUTUBE_TAB)
        time.sleep(0.2)

    def click_upload_tab(self):
        self.click(self.UPLOAD_TAB)
        time.sleep(0.2)

    def fill_youtube_url(self, value):
        # The URL input has both `register("video_url")` and a JSX onChange
        # that overrides RHF's onChange. JS value-setter + dispatched events
        # only update the local `videoUrl` state, not RHF's internal cache.
        # Native send_keys triggers RHF correctly (the ref-attached listener
        # picks it up).
        el = self.find(self.YOUTUBE_URL_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def upload_file(self, absolute_path):
        self.driver.find_element(*self.FILE_INPUT).send_keys(absolute_path)

    def field_error_texts(self):
        return [el.text for el in self.driver.find_elements(*self.FIELD_ERRORS) if el.text.strip()]

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def cancel(self):
        self.driver.find_element(*self.CANCEL_BUTTON).click()

    def submit_button_text(self):
        return self.driver.find_element(*self.SUBMIT_BUTTON).text.strip()

    def youtube_tab_active(self):
        cls = self.find(self.YOUTUBE_TAB).get_attribute("class") or ""
        return "bg-primary-500" in cls

    def upload_tab_active(self):
        cls = self.find(self.UPLOAD_TAB).get_attribute("class") or ""
        return "bg-primary-500" in cls
