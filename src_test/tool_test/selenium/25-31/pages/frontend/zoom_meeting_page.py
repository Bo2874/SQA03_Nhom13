"""Zoom Meeting management page on frontend (Teacher) — FR28."""
import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import FRONTEND_URL


class ZoomMeetingPage(BasePage):
    # Teacher navigates to a course, then opens Zoom tab or /zoom route
    # Path pattern: /teacher/dashboard/courses/{course_id}  (Zoom tab inside)
    ZOOM_TAB      = (By.XPATH, "//button[contains(.,'Zoom') or contains(.,'zoom')] | //a[contains(.,'Zoom')]")
    CREATE_BTN    = (By.XPATH, "//button[contains(.,'Tạo') or contains(.,'Thêm') or contains(.,'Create')]")
    MODAL         = (By.CSS_SELECTOR, ".bg-white.rounded-xl.max-w-4xl, .fixed.inset-0")

    # Form fields (React Hook Form - use name attributes and placeholders)
    TITLE_INPUT   = (By.CSS_SELECTOR, "input[placeholder*='Buổi học online']")
    LINK_INPUT    = (By.CSS_SELECTOR, "input[type='url']")
    PASS_INPUT    = (By.CSS_SELECTOR, "input[placeholder='abc123']")
    DURATION_INPUT= (By.CSS_SELECTOR, "input[type='number']")
    DATETIME_INPUT= (By.CSS_SELECTOR, "input[type='datetime-local']")
    SUBMIT_BTN    = (By.CSS_SELECTOR, "button[type='submit']:not([class*='border'])")
    ERROR_MSG     = (By.CSS_SELECTOR, "p.text-red-500")
    TOAST         = (By.CSS_SELECTOR, "[class*='toast'], [role='status']")
    MEETING_LIST  = (By.CSS_SELECTOR, ".bg-white.border.border-gray-200.rounded-lg")
    DELETE_BTNS   = (By.XPATH, "//button[svg and @class and contains(@class, 'text-red')]")
    CONFIRM_OK    = (By.XPATH, "//button[contains(., 'Ok') or contains(., 'Confirm')]")

    def open_for_course(self, course_id: int):
        self.go(f"{FRONTEND_URL}/teacher/dashboard/courses/{course_id}")
        # Click Zoom tab if present
        if self.is_present(*self.ZOOM_TAB, timeout=4):
            self.click(*self.ZOOM_TAB)
        return self

    def click_create(self):
        self.click(*self.CREATE_BTN)
        self.find_visible(*self.MODAL)

    def fill_form(self, title: str, link: str = "", password: str = "abc123",
                  duration: int = 60, datetime_str: str = ""):
        if self.is_present(*self.TITLE_INPUT, timeout=3):
            self.type(*self.TITLE_INPUT, title)
        if link and self.is_present(*self.LINK_INPUT, timeout=2):
            self.type(*self.LINK_INPUT, link)
        if self.is_present(*self.PASS_INPUT, timeout=2):
            self.type(*self.PASS_INPUT, password)
        if self.is_present(*self.DURATION_INPUT, timeout=2):
            self.type(*self.DURATION_INPUT, str(duration))
        if datetime_str and self.is_present(*self.DATETIME_INPUT, timeout=2):
            dt = self.driver.find_element(*self.DATETIME_INPUT)
            self.driver.execute_script(
                "arguments[0].value = arguments[1]", dt, datetime_str
            )

    def submit(self):
        self.click(*self.SUBMIT_BTN)
        time.sleep(0.5)

    def get_errors(self) -> list[str]:
        errors = self.driver.find_elements(*self.ERROR_MSG)
        return [e.text.strip() for e in errors if e.text.strip()]

    def is_toast_shown(self, timeout: int = 5) -> bool:
        return self.is_present(*self.TOAST, timeout=timeout)

    def get_meeting_titles(self) -> list[str]:
        items = self.driver.find_elements(*self.MEETING_LIST)
        return [i.text for i in items]

    def delete_first_meeting(self):
        btns = self.driver.find_elements(*self.DELETE_BTNS)
        if btns:
            btns[0].click()
            # Handle native browser confirm dialog with accept
            try:
                from selenium.webdriver.common.alert import Alert
                from selenium.webdriver.support import expected_conditions as EC
                WebDriverWait(self.driver, 3).until(EC.alert_is_present())
                Alert(self.driver).accept()
            except:
                pass
            time.sleep(0.5)
