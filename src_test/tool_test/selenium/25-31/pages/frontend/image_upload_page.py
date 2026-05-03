"""Image Upload page helpers — FR31.
Tests are performed on the course-creation page where Cloudinary upload is used.
"""
import os
import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import FRONTEND_URL


class ImageUploadPage(BasePage):
    # Courses list page — file input is inside the CourseModal which opens on button click
    COURSE_CREATE_URL = f"{FRONTEND_URL}/teacher/dashboard/courses"
    # Button on courses list that opens the CourseModal
    CREATE_COURSE_BTN = (By.XPATH, "//button[contains(.,'Tạo khóa học')]")

    UPLOAD_INPUT  = (By.CSS_SELECTOR, "input[type='file']")
    UPLOAD_AREA   = (By.CSS_SELECTOR, "[class*='upload']")
    PREVIEW_IMG   = (By.CSS_SELECTOR, "img[alt='Thumbnail preview']")
    LOADING_SPIN  = (By.CSS_SELECTOR, "[class*='loading'], [class*='spinner']")
    # react-hot-toast renders toasts with role="status"; error variant often has "error" aria class
    ERROR_MSG     = (By.CSS_SELECTOR, "[role='status'], [class*='toast']")
    SUCCESS_URL   = (By.CSS_SELECTOR, "input[type='url']")

    def open_course_create(self):
        """Navigate to courses page then open the create modal (where file input lives)."""
        self.go(self.COURSE_CREATE_URL)
        if self.is_present(*self.CREATE_COURSE_BTN, timeout=6):
            self.click(*self.CREATE_COURSE_BTN)
        return self

    def upload_file(self, file_path: str):
        """Send file path to hidden file input."""
        inputs = self.driver.find_elements(*self.UPLOAD_INPUT)
        if inputs:
            inputs[0].send_keys(file_path)
            time.sleep(1.5)
        else:
            # Try making hidden input visible via JS
            self.driver.execute_script(
                "document.querySelector('input[type=\"file\"]').style.display='block'"
            )
            self.driver.find_element(*self.UPLOAD_INPUT).send_keys(file_path)
            time.sleep(1.5)

    def get_error_text(self) -> str:
        errors = self.driver.find_elements(*self.ERROR_MSG)
        return " ".join(e.text.strip() for e in errors if e.text.strip())

    def is_error_shown(self, timeout: int = 5) -> bool:
        return self.is_present(*self.ERROR_MSG, timeout=timeout)

    def get_preview_src(self) -> str:
        if self.is_present(*self.PREVIEW_IMG, timeout=4):
            return self.driver.find_element(*self.PREVIEW_IMG).get_attribute("src") or ""
        return ""

    def get_uploaded_url_from_page(self) -> str:
        """Check page source for a Cloudinary HTTPS URL."""
        src = self.page_source()
        import re
        m = re.search(r'https://res\.cloudinary\.com[^\s"\']+', src)
        return m.group(0) if m else ""

    # --- Helper: create temp test files ---

    @staticmethod
    def create_temp_image(path: str, size_kb: int = 100):
        """Create a minimal valid JPEG file at given path."""
        from PIL import Image
        img = Image.new("RGB", (200, 200), color=(100, 149, 237))
        img.save(path, "JPEG")
        # If we need a specific size, pad it
        current = os.path.getsize(path)
        target  = size_kb * 1024
        if target > current:
            with open(path, "ab") as f:
                f.write(b"\x00" * (target - current))

    @staticmethod
    def create_temp_large_image(path: str, size_mb: int = 6):
        """Create a fake large image file (>5MB) for rejection test."""
        from PIL import Image
        img = Image.new("RGB", (200, 200), color=(200, 100, 50))
        img.save(path, "JPEG")
        target = size_mb * 1024 * 1024
        current = os.path.getsize(path)
        if target > current:
            with open(path, "ab") as f:
                f.write(b"\x00" * (target - current))

    @staticmethod
    def create_temp_pdf(path: str):
        with open(path, "wb") as f:
            f.write(b"%PDF-1.4 fake pdf content")

    @staticmethod
    def create_empty_file(path: str):
        open(path, "wb").close()
