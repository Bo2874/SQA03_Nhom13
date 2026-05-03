"""Page Objects for the teacher exam pages.

Three pages share this module:
  - TeacherExamsPage    /teacher/dashboard/exams
  - ExamCreatePage      /teacher/dashboard/exams/create
  - ExamEditPage        /teacher/dashboard/exams/{id}/edit

The list page uses native confirm() + react-hot-toast for delete.
The create/edit forms use yup validation.
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException

from pages.base_page import BasePage
from config import settings


class TeacherExamsPage(BasePage):
    URL_PATH = "/teacher/dashboard/exams"

    HEADING = (By.XPATH, '//h1[normalize-space()="Quản lý bài kiểm tra"]')
    CREATE_LINK = (By.XPATH, '//a[contains(., "Tạo bài kiểm tra mới")]')
    SEARCH_INPUT = (By.XPATH, '//input[@placeholder="Nhập tên bài kiểm tra..."]')
    FILTER_ALL = (By.XPATH, '//button[starts-with(normalize-space(), "Tất cả")]')
    FILTER_DRAFT = (By.XPATH, '//button[starts-with(normalize-space(), "Nháp")]')
    FILTER_LIVE = (By.XPATH, '//button[starts-with(normalize-space(), "Đang mở")]')
    FILTER_CLOSED = (By.XPATH, '//button[starts-with(normalize-space(), "Đã đóng")]')
    EXAM_CARDS = (By.XPATH, '//h3[contains(@class, "text-xl")]/ancestor::div[contains(@class, "rounded-xl")][1]')

    def open(self):
        return super().open(self.URL_PATH)

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(self.HEADING)
        )

    def go_to_create(self):
        self.click(self.CREATE_LINK)

    def fill_search(self, value):
        el = self.find(self.SEARCH_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def click_filter(self, status):
        loc = {
            "all": self.FILTER_ALL, "draft": self.FILTER_DRAFT,
            "live": self.FILTER_LIVE, "closed": self.FILTER_CLOSED,
        }[status]
        self.click(loc)
        time.sleep(0.3)

    def filter_button_label(self, status):
        loc = {
            "all": self.FILTER_ALL, "draft": self.FILTER_DRAFT,
            "live": self.FILTER_LIVE, "closed": self.FILTER_CLOSED,
        }[status]
        return self.find(loc).text

    def filter_count(self, status):
        """Parse the trailing '(N)' from the filter button label."""
        import re
        text = self.filter_button_label(status)
        m = re.search(r"\((\d+)\)", text)
        return int(m.group(1)) if m else None

    def visible_exam_titles(self):
        return [el.text for el in self.driver.find_elements(
            By.XPATH, '//h3[contains(@class, "text-xl")]'
        )]

    def find_exam_card_by_title(self, title):
        cards = self.driver.find_elements(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "rounded-xl")][1]'
        )
        return cards[0] if cards else None

    def click_edit_for(self, title):
        link = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "rounded-xl")][1]'
            f'//a[@title="Chỉnh sửa"]'
        )
        self.driver.execute_script("arguments[0].click();", link)

    def click_delete_for(self, title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "rounded-xl")][1]'
            f'//button[@title="Xóa"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)


class ExamCreatePage(BasePage):
    URL_PATH = "/teacher/dashboard/exams/create"

    HEADING = (By.XPATH, '//h1[contains(., "Tạo bài kiểm tra mới")]')
    TITLE_INPUT = (By.XPATH, '//input[@placeholder="Ví dụ: Kiểm tra giữa kỳ - Toán hình học không gian"]')
    DESCRIPTION_TEXTAREA = (By.XPATH, '//textarea[@placeholder="Mô tả ngắn gọn về bài kiểm tra..."]')
    COURSE_SELECT = (By.XPATH, '//select[option[normalize-space()="Không gắn với khóa học nào"]]')
    DURATION_INPUT = (By.XPATH, '//input[@type="number" and @placeholder="45"]')
    STATUS_SELECT = (By.XPATH, '//select[option[normalize-space()="Nháp"] and option[normalize-space()="Đang mở"] and not(option[normalize-space()="Đã đóng"])]')
    SUBMIT_BUTTON = (By.XPATH, '//button[contains(., "Tạo bài kiểm tra") or contains(., "Đang tạo")]')
    CANCEL_BUTTON = (By.XPATH, '//button[normalize-space()="Hủy"]')
    FIELD_ERRORS = (By.XPATH, '//p[contains(@class, "text-red-500")]')

    def open(self):
        return super().open(self.URL_PATH)

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(self.HEADING)
        )

    def fill_title(self, value):
        self._fill(self.TITLE_INPUT, value)

    def fill_description(self, value):
        self._fill(self.DESCRIPTION_TEXTAREA, value)

    def fill_duration(self, value):
        self._fill(self.DURATION_INPUT, value)

    def select_status(self, value):
        from selenium.webdriver.support.ui import Select
        Select(self.find(self.STATUS_SELECT)).select_by_visible_text(value)

    def _fill(self, locator, value):
        el = self.find(locator)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value is not None and value != "":
            el.send_keys(str(value))

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def submit_text(self):
        return self.driver.find_element(*self.SUBMIT_BUTTON).text.strip()

    def field_error_texts(self):
        return [el.text for el in self.driver.find_elements(*self.FIELD_ERRORS) if el.text.strip()]

    def status_options(self):
        from selenium.webdriver.support.ui import Select
        return [o.text for o in Select(self.find(self.STATUS_SELECT)).options]


class ExamEditPage(BasePage):
    URL_PATH_FMT = "/teacher/dashboard/exams/{exam_id}/edit"

    HEADING = (By.XPATH, '//h1[contains(., "Chỉnh sửa bài kiểm tra")]')
    TITLE_INPUT = (By.XPATH, '//input[@placeholder="Ví dụ: Kiểm tra giữa kỳ - Toán hình học không gian"]')
    COURSE_SELECT = (By.XPATH, '//select[option[normalize-space()="Không gắn với khóa học nào"]]')
    DURATION_INPUT = (By.XPATH, '//input[@type="number" and @placeholder="45"]')
    # Edit page status select includes "Đã đóng" (CLOSED) — use that to differentiate
    STATUS_SELECT = (
        By.XPATH,
        '//select[option[normalize-space()="Đã đóng"]]'
    )
    SAVE_BUTTON = (By.XPATH, '//button[contains(., "Lưu thay đổi")]')
    CANCEL_BUTTON = (By.XPATH, '//button[normalize-space()="Hủy"]')
    FIELD_ERRORS = (By.XPATH, '//p[contains(@class, "text-red-500")]')
    NOT_FOUND_HEADING = (By.XPATH, '//h1[contains(., "Không tìm thấy bài kiểm tra")]')

    def open(self, exam_id):
        self.driver.get(f"{settings.BASE_URL_FE}{self.URL_PATH_FMT.format(exam_id=exam_id)}")
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.any_of(
                EC.visibility_of_element_located(self.HEADING),
                EC.visibility_of_element_located(self.NOT_FOUND_HEADING),
            )
        )

    def is_not_found(self):
        return len(self.driver.find_elements(*self.NOT_FOUND_HEADING)) > 0

    def fill_title(self, value):
        self._fill(self.TITLE_INPUT, value)

    def fill_duration(self, value):
        self._fill(self.DURATION_INPUT, value)

    def select_status(self, value):
        from selenium.webdriver.support.ui import Select
        Select(self.find(self.STATUS_SELECT)).select_by_visible_text(value)

    def _fill(self, locator, value):
        el = self.find(locator)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value is not None and value != "":
            el.send_keys(str(value))

    def title_value(self):
        return self.find(self.TITLE_INPUT).get_attribute("value")

    def duration_value(self):
        return self.find(self.DURATION_INPUT).get_attribute("value")

    def status_options(self):
        from selenium.webdriver.support.ui import Select
        return [o.text for o in Select(self.find(self.STATUS_SELECT)).options]

    def status_value(self):
        from selenium.webdriver.support.ui import Select
        return Select(self.find(self.STATUS_SELECT)).first_selected_option.text

    def save(self):
        self.driver.find_element(*self.SAVE_BUTTON).click()

    # Question management on the same page (below Form section)
    ADD_QUESTION_BUTTON = (
        By.XPATH, '//button[contains(., "Thêm câu hỏi")]'
    )
    QUESTIONS_HEADING = (By.XPATH, '//h2[normalize-space()="Câu hỏi"]')
    NO_QUESTIONS_MESSAGE = (
        By.XPATH, '//*[contains(text(), "Chưa có câu hỏi nào")]'
    )
    VIEW_RESULTS_BUTTON = (
        By.XPATH, '//button[contains(., "Xem kết quả")]'
    )

    def click_add_question(self):
        self.click(self.ADD_QUESTION_BUTTON)

    def click_view_results(self):
        self.click(self.VIEW_RESULTS_BUTTON)

    def question_count_in_ui(self):
        """Count question cards rendered in the Questions section.

        Each question is rendered as a card below the heading. The card has
        the question content text inside.
        """
        # Look for question content elements rendered inside the questions section
        rows = self.driver.find_elements(
            By.XPATH,
            '//h2[normalize-space()="Câu hỏi"]/following::div[contains(@class, "border")]'
            '[.//button[@title="Chỉnh sửa"] or .//button[contains(@class, "text-green")]]'
        )
        return len(rows)

    def click_edit_question(self, index=0):
        """Click the edit button for the Nth question (0-indexed). The edit
        icon button has title='Chỉnh sửa' and is a child of a question card."""
        btns = self.driver.find_elements(
            By.XPATH,
            '//h2[normalize-space()="Câu hỏi"]/ancestor::div[contains(@class, "rounded-xl")][1]'
            '//button[@title="Chỉnh sửa"]'
        )
        self.driver.execute_script("arguments[0].click();", btns[index])

    def click_delete_question(self, index=0):
        btns = self.driver.find_elements(
            By.XPATH,
            '//h2[normalize-space()="Câu hỏi"]/ancestor::div[contains(@class, "rounded-xl")][1]'
            '//button[@title="Xóa"]'
        )
        self.driver.execute_script("arguments[0].click();", btns[index])
