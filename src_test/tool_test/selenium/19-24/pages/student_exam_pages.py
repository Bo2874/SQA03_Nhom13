"""Page Objects for student exam pages.

  - StudentExamTakePage
      /student/courses/{courseId}/exams/{examId}/take
  - StudentExamResultsPage
      /student/courses/{courseId}/exams/{examId}/results

The take page persists progress to localStorage with key
`exam_{examId}_attempt`. The countdown timer is implemented via setInterval
and calls handleSubmit when it hits 0.
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage
from config import settings


class StudentExamTakePage(BasePage):
    URL_PATH_FMT = "/student/courses/{course_id}/exams/{exam_id}/take"

    # Exam title h1 has class "text-2xl font-bold ..." (page may also have
    # an h1 brand "Elearning" — qualify by class).
    EXAM_TITLE_HEADING = (
        By.XPATH,
        '//h1[contains(@class, "text-2xl") and contains(@class, "font-bold")]'
    )
    LOADING_SPINNER = (
        By.XPATH, '//*[contains(text(), "Đang tải bài kiểm tra")]'
    )
    NOT_FOUND_HEADING = (
        By.XPATH, '//h1[contains(., "Không tìm thấy bài kiểm tra")]'
    )
    TIMER = (
        By.XPATH,
        '//*[contains(text(), "Thời gian còn lại")]/following-sibling::div'
    )
    PROGRESS_BARS = (
        By.XPATH, '//div[contains(@class, "h-2") and contains(@class, "rounded-full")]'
    )
    # Use `.` (descendant text) instead of text() — React inlines interpolated
    # numbers into separate text nodes inside <p>, so text() only sees the
    # literal text segments.
    HEADER_SUMMARY = (
        By.XPATH,
        '//p[contains(@class, "text-gray-600") and contains(., "đã trả lời")]'
    )
    QUESTION_CONTENT = (
        By.XPATH,
        '//div[contains(@class, "text-lg")]'
    )
    ANSWER_BUTTONS = (
        By.XPATH,
        '//button[contains(@class, "border-2") and contains(@class, "rounded-lg")]'
    )
    PREV_BUTTON = (
        By.XPATH,
        '//button[contains(., "Câu trước")]'
    )
    NEXT_BUTTON = (
        By.XPATH,
        '//button[contains(., "Câu tiếp")]'
    )
    SUBMIT_BUTTON = (
        By.XPATH,
        '//button[contains(., "Nộp bài") or contains(., "Đang nộp")]'
    )
    QUESTION_NAVIGATOR_BUTTONS = (
        By.XPATH,
        '//button[contains(@class, "w-10") and contains(@class, "h-10")'
        ' and string-length(normalize-space(text())) <= 3]'
    )

    def __init__(self, driver, course_id=None, exam_id=None):
        super().__init__(driver)
        self.course_id = course_id
        self.exam_id = exam_id

    def open(self, course_id=None, exam_id=None):
        cid = course_id or self.course_id
        eid = exam_id or self.exam_id
        self.course_id = cid
        self.exam_id = eid
        self.driver.get(
            f"{settings.BASE_URL_FE}{self.URL_PATH_FMT.format(course_id=cid, exam_id=eid)}"
        )
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.any_of(
                EC.presence_of_element_located(self.EXAM_TITLE_HEADING),
                EC.presence_of_element_located(self.NOT_FOUND_HEADING),
            )
        )

    def is_loading(self):
        return len(self.driver.find_elements(*self.LOADING_SPINNER)) > 0

    def is_not_found(self):
        return len(self.driver.find_elements(*self.NOT_FOUND_HEADING)) > 0

    def title_text(self):
        return self.find(self.EXAM_TITLE_HEADING).text

    def timer_text(self):
        return self.find(self.TIMER).text

    def timer_color_class(self):
        return self.find(self.TIMER).get_attribute("class") or ""

    def header_summary_text(self):
        return self.find(self.HEADER_SUMMARY).text

    def select_answer(self, index):
        """Click the Nth answer button (0-indexed) for the current question."""
        btns = self.driver.find_elements(*self.ANSWER_BUTTONS)
        # Filter to only A/B/C/D answer buttons (they have a letter circle)
        # The nav buttons (1, 2, 3) are smaller (w-10 h-10), so the larger
        # answer buttons remain.
        self.driver.execute_script("arguments[0].click();", btns[index])

    def click_next(self):
        self.driver.find_element(*self.NEXT_BUTTON).click()

    def click_prev(self):
        self.driver.find_element(*self.PREV_BUTTON).click()

    def click_submit(self):
        btn = self.driver.find_element(*self.SUBMIT_BUTTON)
        self.driver.execute_script("arguments[0].click();", btn)

    def submit_button_visible(self):
        return len(self.driver.find_elements(*self.SUBMIT_BUTTON)) > 0

    def next_button_visible(self):
        return len(self.driver.find_elements(*self.NEXT_BUTTON)) > 0

    def prev_button_disabled(self):
        return self.driver.find_element(
            *self.PREV_BUTTON
        ).get_attribute("disabled") is not None

    def submit_button_disabled(self):
        btns = self.driver.find_elements(*self.SUBMIT_BUTTON)
        if not btns:
            return False
        return btns[0].get_attribute("disabled") is not None

    def click_navigator(self, index):
        """Click the Nth question number in the bottom navigator (0-indexed)."""
        btns = self.driver.find_elements(
            By.XPATH,
            '//button[contains(@class, "w-10") and contains(@class, "h-10")'
            ' and not(contains(@class, "rounded-full"))]'
        )
        self.driver.execute_script("arguments[0].click();", btns[index])

    def progress_bar_classes(self):
        bars = self.driver.find_elements(*self.PROGRESS_BARS)
        return [b.get_attribute("class") or "" for b in bars]

    def navigator_button_classes(self):
        btns = self.driver.find_elements(
            By.XPATH,
            '//button[contains(@class, "w-10") and contains(@class, "h-10")'
            ' and not(contains(@class, "rounded-full"))]'
        )
        return [b.get_attribute("class") or "" for b in btns]


class StudentExamResultsPage(BasePage):
    URL_PATH_FMT = "/student/courses/{course_id}/exams/{exam_id}/results"

    LOADING_SPINNER = (
        By.XPATH, '//*[contains(text(), "Đang tải kết quả")]'
    )
    HEADING = (
        By.XPATH,
        '//h1[contains(., "Chúc mừng") or contains(., "Tiếc quá")]'
    )
    SCORE_VALUE = (
        By.XPATH,
        '//div[contains(text(), "Điểm số")]/following-sibling::div'
    )
    CORRECT_ANSWERS_VALUE = (
        By.XPATH,
        '//div[contains(text(), "Câu đúng")]/following-sibling::div'
    )
    TIME_SPENT_VALUE = (
        By.XPATH,
        '//div[contains(text(), "Thời gian")]/following-sibling::div'
    )
    DETAIL_SECTION_HEADING = (
        By.XPATH, '//*[contains(text(), "Chi tiết bài làm")]'
    )
    BACK_TO_COURSE_BUTTON = (
        By.XPATH,
        '//button[contains(., "Quay lại khóa học")] | '
        '//a[contains(., "Quay lại khóa học")]'
    )

    def __init__(self, driver, course_id=None, exam_id=None):
        super().__init__(driver)
        self.course_id = course_id
        self.exam_id = exam_id

    def open(self, course_id=None, exam_id=None):
        cid = course_id or self.course_id
        eid = exam_id or self.exam_id
        self.driver.get(
            f"{settings.BASE_URL_FE}{self.URL_PATH_FMT.format(course_id=cid, exam_id=eid)}"
        )
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.any_of(
                EC.presence_of_element_located(self.HEADING),
                EC.url_contains(f"/student/courses/{self.course_id}"),
            )
        )

    def is_loading(self):
        return len(self.driver.find_elements(*self.LOADING_SPINNER)) > 0

    def heading_text(self):
        return self.find(self.HEADING).text

    def score_text(self):
        return self.find(self.SCORE_VALUE).text

    def detail_section_visible(self):
        return len(self.driver.find_elements(*self.DETAIL_SECTION_HEADING)) > 0
