"""Admin Teacher Approval / Teacher Management page — FR25."""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import ADMIN_URL


class TeacherApprovalPage(BasePage):
    # The admin panel uses React Router; path may be /teachers or /users/teachers
    POSSIBLE_PATHS = ["/teachers", "/users/teachers", "/manage/teachers"]

    # Locators
    PAGE_HEADING      = (By.CSS_SELECTOR, "h1, h2, .page-title, .ant-page-header-heading-title")
    TABLE             = (By.CSS_SELECTOR, ".ant-table, table")
    TABLE_ROWS        = (By.CSS_SELECTOR, ".ant-table-tbody tr, tbody tr")
    NEXT_PAGE_BTN     = (By.CSS_SELECTOR, ".ant-pagination-next button, li.ant-pagination-next")
    STATUS_BADGES     = (By.CSS_SELECTOR, ".ant-badge, .ant-tag, .status-badge")
    ACTION_BUTTONS    = (By.CSS_SELECTOR, "td button, td .ant-btn")

    def navigate(self, base_url: str = ADMIN_URL):
        """Try known paths until we land on the teacher management page."""
        for path in self.POSSIBLE_PATHS:
            self.go(f"{base_url}{path}")
            if self.is_present(*self.TABLE, timeout=4):
                return self
        # Fallback: try sidebar navigation if available
        self.go(base_url)
        return self

    def get_heading_text(self) -> str:
        if self.is_present(*self.PAGE_HEADING, timeout=5):
            return self.text(*self.PAGE_HEADING)
        return self.driver.title

    def get_row_count(self) -> int:
        if not self.is_present(*self.TABLE_ROWS, timeout=5):
            return 0
        return len(self.driver.find_elements(*self.TABLE_ROWS))

    def get_column_headers(self) -> list[str]:
        headers = self.driver.find_elements(By.CSS_SELECTOR, "th, .ant-table-cell")
        return [h.text.strip() for h in headers if h.text.strip()]

    def click_next_page(self) -> bool:
        if self.is_present(*self.NEXT_PAGE_BTN, timeout=3):
            btn = self.driver.find_element(*self.NEXT_PAGE_BTN)
            if btn.is_enabled():
                btn.click()
                return True
        return False

    def get_status_labels(self) -> list[str]:
        badges = self.driver.find_elements(*self.STATUS_BADGES)
        return [b.text.strip() for b in badges if b.text.strip()]
