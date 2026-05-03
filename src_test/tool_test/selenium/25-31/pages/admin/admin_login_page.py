"""Admin panel login page (http://localhost:3002/login)."""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import ADMIN_URL


class AdminLoginPage(BasePage):
    URL = f"{ADMIN_URL}/login"

    # Locators — Ant Design form fields (from Login.tsx)
    # Login.tsx renders: Form > Input (email) + Input.Password (password) + Button (submit)
    # Ant Design auto-generates IDs like: login_email, login_password
    EMAIL_INPUT    = (By.ID, "login_email")  # Form name="login" + field name="email"
    PASSWORD_INPUT = (By.ID, "login_password")  # Form name="login" + field name="password"
    SUBMIT_BUTTON  = (By.CSS_SELECTOR, "button[type='submit']")  # "Đăng Nhập" button

    def open(self):
        print(f"[ADMIN LOGIN] Opening URL: {self.URL}")
        self.go(self.URL)
        print(f"[ADMIN LOGIN] Current URL: {self.current_url()}")
        return self

    def login(self, email: str, password: str):
        self.type(*self.EMAIL_INPUT, email)
        self.type(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BUTTON)
        return self

    def login_and_wait(self, email: str, password: str, redirect_fragment: str = "/"):
        print(f"[LOGIN] Logging in with: {email} / {'*' * len(password)}")
        self.login(email, password)
        print(f"[LOGIN] Waiting for URL to leave /login ...")
        try:
            from selenium.webdriver.support.ui import WebDriverWait
            WebDriverWait(self.driver, 10).until(
                lambda d: "/login" not in d.current_url
            )
            print(f"[LOGIN] Successfully redirected to: {self.current_url()}")
        except Exception as e:
            print(f"[LOGIN ERROR] Still on login page after timeout. Current URL: {self.current_url()}")
            print(f"[LOGIN ERROR] Error: {str(e)}")
            raise
