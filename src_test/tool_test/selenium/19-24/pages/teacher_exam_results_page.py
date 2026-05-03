"""Page Object for /teacher/dashboard/exams/{id}/results (leaderboard)."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage
from config import settings


class TeacherExamResultsPage(BasePage):
    URL_PATH_FMT = "/teacher/dashboard/exams/{exam_id}/results"

    LOADING_SPINNER = (By.XPATH, '//*[contains(text(), "Đang tải kết quả")]')
    HEADING = (By.XPATH, '//h1[normalize-space()="Kết quả bài kiểm tra"]')
    EXAM_TITLE_SUBHEAD = (By.XPATH, '//h1[normalize-space()="Kết quả bài kiểm tra"]/following-sibling::p')
    BACK_BUTTON = (
        By.XPATH,
        '//h1[normalize-space()="Kết quả bài kiểm tra"]'
        '/ancestor::div[contains(@class, "flex")]/preceding-sibling::button | '
        '//h1[normalize-space()="Kết quả bài kiểm tra"]'
        '/ancestor::div[1]/preceding-sibling::button'
    )

    PARTICIPANTS_COUNT = (
        By.XPATH,
        '//p[normalize-space()="Số người tham gia"]/following-sibling::p'
    )
    AVERAGE_SCORE = (
        By.XPATH,
        '//p[normalize-space()="Điểm trung bình"]/following-sibling::p'
    )
    AVERAGE_TIME = (
        By.XPATH,
        '//p[normalize-space()="Thời gian trung bình"]/following-sibling::p'
    )

    EMPTY_MESSAGE = (
        By.XPATH, '//*[contains(text(), "Chưa có ai hoàn thành bài kiểm tra")]'
    )
    PARTICIPANT_TABLE = (
        By.XPATH, '//table[.//th[contains(., "Hạng")]]'
    )
    TABLE_HEADERS = (
        By.XPATH, '//table//thead//th'
    )
    TABLE_ROWS = (
        By.XPATH, '//table//tbody//tr'
    )

    def __init__(self, driver, exam_id=None):
        super().__init__(driver)
        self.exam_id = exam_id

    def open(self, exam_id=None):
        eid = exam_id or self.exam_id
        self.exam_id = eid
        self.driver.get(
            f"{settings.BASE_URL_FE}{self.URL_PATH_FMT.format(exam_id=eid)}"
        )
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.any_of(
                EC.presence_of_element_located(self.HEADING),
                EC.presence_of_element_located(self.LOADING_SPINNER),
            )
        )
        # Wait for spinner to go away
        WebDriverWait(self.driver, timeout).until_not(
            EC.presence_of_element_located(self.LOADING_SPINNER)
        )

    def is_loading(self):
        return len(self.driver.find_elements(*self.LOADING_SPINNER)) > 0

    def heading_text(self):
        return self.find(self.HEADING).text

    def exam_title_subhead(self):
        els = self.driver.find_elements(*self.EXAM_TITLE_SUBHEAD)
        return els[0].text if els else ""

    def participants_count_text(self):
        return self.find(self.PARTICIPANTS_COUNT).text

    def average_score_text(self):
        return self.find(self.AVERAGE_SCORE).text

    def average_time_text(self):
        return self.find(self.AVERAGE_TIME).text

    def is_empty(self):
        return len(self.driver.find_elements(*self.EMPTY_MESSAGE)) > 0

    def table_visible(self):
        return len(self.driver.find_elements(*self.PARTICIPANT_TABLE)) > 0

    def header_texts(self):
        return [el.text.strip() for el in self.driver.find_elements(*self.TABLE_HEADERS)]

    def row_count(self):
        return len(self.driver.find_elements(*self.TABLE_ROWS))

    def row_data(self, index):
        """Return cell texts for the Nth row (0-indexed)."""
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        return [td.text.strip() for td in rows[index].find_elements(By.TAG_NAME, "td")]

    def row_score_badge_class(self, index):
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        cells = rows[index].find_elements(By.TAG_NAME, "td")
        # Score column (5th visible td: rank, name, email, correct, score)
        if len(cells) >= 5:
            spans = cells[4].find_elements(By.TAG_NAME, "span")
            return spans[0].get_attribute("class") if spans else ""
        return ""

    def row_rank_circle_class(self, index):
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        cells = rows[index].find_elements(By.TAG_NAME, "td")
        if cells:
            divs = cells[0].find_elements(By.XPATH, ".//div[contains(@class, 'rounded-full')]")
            return divs[0].get_attribute("class") if divs else ""
        return ""
