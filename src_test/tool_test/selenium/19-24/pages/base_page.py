"""Base Page Object — shared helpers for every page."""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from config import settings


class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, settings.EXPLICIT_WAIT)

    def open(self, path=""):
        self.driver.get(f"{settings.BASE_URL_FE}{path}")
        return self

    def find(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click(self, locator):
        self.wait.until(EC.element_to_be_clickable(locator)).click()

    def fill(self, locator, value):
        el = self.find(locator)
        el.clear()
        if value:
            el.send_keys(value)

    def text_of(self, locator):
        return self.find_visible(locator).text

    def is_visible(self, locator, timeout=None):
        try:
            WebDriverWait(self.driver, timeout or settings.EXPLICIT_WAIT).until(
                EC.visibility_of_element_located(locator)
            )
            return True
        except TimeoutException:
            return False

    def page_contains(self, text, timeout=None):
        try:
            WebDriverWait(self.driver, timeout or settings.EXPLICIT_WAIT).until(
                lambda d: text in d.page_source
            )
            return True
        except TimeoutException:
            return False
