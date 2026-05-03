"""Admin Platform Dashboard page — FR27."""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import ADMIN_URL


class DashboardPage(BasePage):
    URL = ADMIN_URL

    # Ant Design stat cards / custom stat cards
    STAT_CARDS   = (By.CSS_SELECTOR, ".ant-card, .stat-card, .dashboard-card, .ant-statistic")
    CARD_TITLES  = (By.CSS_SELECTOR, ".ant-card-head-title, .ant-statistic-title, .stat-title, h3")
    CARD_VALUES  = (By.CSS_SELECTOR, ".ant-statistic-content-value, .stat-value, .ant-card-body h2, .ant-card-body span")

    def open(self):
        self.go(self.URL)
        return self

    def get_stat_card_count(self) -> int:
        if not self.is_present(*self.STAT_CARDS, timeout=5):
            return 0
        return len(self.driver.find_elements(*self.STAT_CARDS))

    def get_all_card_texts(self) -> list[str]:
        """Return all visible text inside stat cards."""
        cards = self.driver.find_elements(*self.STAT_CARDS)
        return [c.text.strip() for c in cards if c.text.strip()]

    def get_numeric_value_by_keyword(self, keyword: str) -> int | None:
        """
        Find the stat card whose text contains `keyword` and return its numeric value.
        keyword: e.g. 'khóa học', 'học sinh', 'giáo viên', 'bài giảng'
        """
        cards = self.driver.find_elements(*self.STAT_CARDS)
        for card in cards:
            text = card.text.lower()
            if keyword.lower() in text:
                # extract first number from card text
                import re
                nums = re.findall(r"\d+", text)
                if nums:
                    return int(nums[0])
        return None

    def is_dashboard_loaded(self) -> bool:
        return self.is_present(*self.STAT_CARDS, timeout=6)
