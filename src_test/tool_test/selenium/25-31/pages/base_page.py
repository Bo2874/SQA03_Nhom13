"""Base page with shared Selenium helpers."""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from config.config import TIMEOUT


class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait   = WebDriverWait(driver, TIMEOUT)

    def go(self, url: str):
        self.driver.get(url)

    def find(self, by, value):
        return self.wait.until(EC.presence_of_element_located((by, value)))

    def find_visible(self, by, value):
        return self.wait.until(EC.visibility_of_element_located((by, value)))

    def find_clickable(self, by, value):
        return self.wait.until(EC.element_to_be_clickable((by, value)))

    def find_all(self, by, value):
        self.wait.until(EC.presence_of_all_elements_located((by, value)))
        return self.driver.find_elements(by, value)

    def click(self, by, value):
        self.find_clickable(by, value).click()

    def type(self, by, value, text: str):
        el = self.find_clickable(by, value)
        el.clear()
        el.send_keys(text)

    def text(self, by, value) -> str:
        return self.find_visible(by, value).text

    def current_url(self) -> str:
        return self.driver.current_url

    def page_source(self) -> str:
        return self.driver.page_source

    def is_present(self, by, value, timeout: int = 3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def wait_for_url_contains(self, fragment: str, timeout: int = TIMEOUT):
        WebDriverWait(self.driver, timeout).until(EC.url_contains(fragment))

    def wait_for_text_in_page(self, text: str, timeout: int = TIMEOUT) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: text in d.page_source
            )
            return True
        except TimeoutException:
            return False

    def alert_is_triggered(self, timeout: int = 3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(EC.alert_is_present())
            self.driver.switch_to.alert.dismiss()
            return True
        except TimeoutException:
            return False
