"""Page Objects for /teacher/dashboard/courses and the Create/Edit course modal.

The page (CoursesPage) lists the teacher's courses and exposes a "Tạo
khóa học" button that opens CourseModal. The modal itself handles form
validation (yup), file upload, and submission.

Important behaviors observed in source:
  - CourseModal calls native browser `alert()` on create / update success
    (CourseModal.tsx L196 and L209) — not a toast. Tests should detect
    that as a deviation from the TC's expected behavior.
  - The delete flow on courses/page.tsx uses `confirm()` and `alert()`
    (page.tsx L113, L117).
  - The thumbnail file input is rendered statically with className=
    "hidden" (CourseModal.tsx L355-361) — Selenium can drive it via
    send_keys directly, no JS hack needed.
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException

from pages.base_page import BasePage
from config import settings


class TeacherCoursesPage(BasePage):
    URL_PATH = "/teacher/dashboard/courses"

    CREATE_BUTTON = (By.XPATH, '//button[contains(., "Tạo khóa học") and not(contains(., "thành công"))]')
    PAGE_HEADING = (By.XPATH, '//*[self::h1 or self::h2][contains(., "khóa học") or contains(., "Khóa học")]')

    def open(self):
        return super().open(self.URL_PATH)

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(self.CREATE_BUTTON)
        )

    def click_create(self):
        self.click(self.CREATE_BUTTON)

    def find_course_card_by_title(self, title):
        """Find a course card / row whose title text matches."""
        candidates = self.driver.find_elements(
            By.XPATH,
            f'//*[contains(@class, "card") or self::tr or self::article or self::div]'
            f'[.//*[normalize-space()="{title}"]]'
        )
        return candidates[0] if candidates else None

    def find_edit_button_for(self, title):
        """Edit / delete buttons render only an SVG icon — they expose
        themselves via a `title` attribute ("Chỉnh sửa" / "Xóa")."""
        return self.driver.find_element(
            By.XPATH,
            f'//*[normalize-space()="{title}"]'
            f'/ancestor::div[.//button[@title="Chỉnh sửa"]][1]'
            f'//button[@title="Chỉnh sửa"]'
        )

    def find_delete_button_for(self, title):
        return self.driver.find_element(
            By.XPATH,
            f'//*[normalize-space()="{title}"]'
            f'/ancestor::div[.//button[@title="Xóa"]][1]'
            f'//button[@title="Xóa"]'
        )

    def list_course_titles(self):
        # Look for any heading-like text inside cards
        els = self.driver.find_elements(
            By.XPATH, '//h3 | //h4 | //*[contains(@class, "course-title")]'
        )
        return [el.text for el in els if el.text.strip()]


class CourseModalPage(BasePage):
    """The CourseModal rendered by both Create and Edit flows."""

    MODAL_ROOT = (By.XPATH, '//div[contains(@class, "fixed") and .//h2[contains(., "khóa học")]]')
    HEADING = (By.XPATH, '//div[contains(@class, "fixed")]//h2')

    # Modal inputs uniquely identifiable by placeholder, sidestepping the
    # search input on the courses page.
    TITLE_INPUT = (By.XPATH, '//input[@placeholder="Ví dụ: Toán hình học không gian - Lớp 11"]')
    SUMMARY_TEXTAREA = (By.XPATH, '//textarea[@placeholder="Mô tả ngắn gọn về nội dung khóa học..."]')
    # Modal selects identified by their default placeholder option (the
    # courses page also has subject/grade FILTER selects with first option
    # 'Tất cả' — those would be picked otherwise).
    SUBJECT_SELECT = (By.XPATH, '//select[option[normalize-space()="Chọn môn học"]]')
    GRADE_SELECT = (By.XPATH, '//select[option[normalize-space()="Chọn lớp"]]')

    UPLOAD_BUTTON = (By.XPATH, '//div[contains(@class, "fixed")]//button[contains(., "Upload ảnh")]')
    FILE_INPUT = (By.XPATH, '//div[contains(@class, "fixed")]//input[@type="file"]')
    URL_INPUT = (By.XPATH, '//div[contains(@class, "fixed")]//input[@type="url"]')
    PREVIEW_IMAGE = (By.XPATH, '//div[contains(@class, "fixed")]//img[contains(@alt, "preview") or contains(@alt, "Thumbnail")]')
    REMOVE_THUMBNAIL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[contains(@class, "bg-red-500") '
        'and contains(@class, "rounded-full")]'
    )

    CANCEL_BUTTON = (By.XPATH, '//div[contains(@class, "fixed")]//button[normalize-space()="Hủy"]')
    SUBMIT_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[@type="submit" '
        'and (contains(., "Tạo khóa học") or contains(., "Cập nhật") or contains(., "Đang lưu"))]'
    )

    FIELD_ERRORS = (By.XPATH, '//div[contains(@class, "fixed")]//p[contains(@class, "text-red-500")]')

    def is_visible(self, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(self.MODAL_ROOT)
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

    def fill_summary(self, value):
        el = self.find(self.SUMMARY_TEXTAREA)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def select_subject(self, subject_name):
        Select(self.find(self.SUBJECT_SELECT)).select_by_visible_text(subject_name)

    def select_grade(self, grade_name):
        Select(self.find(self.GRADE_SELECT)).select_by_visible_text(grade_name)

    def fill_thumbnail_url(self, value):
        # Set via the React-friendly value setter so React picks up onChange.
        # Plain send_keys with URLs containing '://' has been observed to
        # cause unexpected re-renders / focus loss in Edge.
        el = self.find(self.URL_INPUT)
        self.driver.execute_script(
            """
            const inp = arguments[0];
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value').set;
            setter.call(inp, arguments[1] || '');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            el, value or "",
        )

    def upload_file(self, absolute_path):
        # File input is hidden but in DOM — Selenium can send_keys to it.
        self.driver.find_element(*self.FILE_INPUT).send_keys(absolute_path)

    def title_placeholder(self):
        return self.find(self.TITLE_INPUT).get_attribute("placeholder")

    def summary_placeholder(self):
        return self.find(self.SUMMARY_TEXTAREA).get_attribute("placeholder")

    def subject_first_option_text(self):
        return Select(self.find(self.SUBJECT_SELECT)).first_selected_option.text

    def grade_first_option_text(self):
        return Select(self.find(self.GRADE_SELECT)).first_selected_option.text

    def field_error_texts(self):
        return [el.text for el in self.driver.find_elements(*self.FIELD_ERRORS) if el.text.strip()]

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def cancel(self):
        self.driver.find_element(*self.CANCEL_BUTTON).click()

    def remove_thumbnail(self):
        self.driver.find_element(*self.REMOVE_THUMBNAIL_BUTTON).click()

    def preview_visible(self):
        # Next.js Image may refuse to render an external URL not in the
        # `images.domains` allow-list, so we only check that the <img>
        # element exists in the DOM (which it will whenever
        # thumbnailPreview is set to a non-empty string).
        return len(self.driver.find_elements(*self.PREVIEW_IMAGE)) > 0


def grab_alert_text(driver, timeout=5):
    """Wait for a JS alert to appear; return its text and accept it.
    Returns None if no alert within timeout."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            alert = driver.switch_to.alert
            text = alert.text
            alert.accept()
            return text
        except NoAlertPresentException:
            time.sleep(0.2)
    return None
