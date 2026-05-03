"""Frontend login page (http://localhost:3001/login) — Next.js."""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import FRONTEND_URL


class FrontendLoginPage(BasePage):
    URL = f"{FRONTEND_URL}/login"

    EMAIL_INPUT    = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], input[placeholder*='mail']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    SUBMIT_BUTTON  = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG      = (By.CSS_SELECTOR, ".error-message, [class*='error'], .text-red, p.text-red-500")

    def open(self):
        self.go(self.URL)
        return self

    def login(self, email: str, password: str):
        self.type(*self.EMAIL_INPUT, email)
        self.type(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BUTTON)
        return self

    def login_and_wait(self, email: str, password: str, redirect_fragment: str = "/dashboard", timeout: int = 15):
        self.login(email, password)
        self.wait_for_url_contains(redirect_fragment, timeout)
