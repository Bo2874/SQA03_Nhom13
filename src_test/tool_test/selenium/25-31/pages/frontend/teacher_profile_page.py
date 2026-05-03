"""Teacher Profile Viewing page on frontend — FR29."""
import re
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.config import FRONTEND_URL


class TeacherProfilePage(BasePage):
    # h1 renders teacher fullName; "Quay lại" button uses router.back()
    TEACHER_NAME   = (By.CSS_SELECTOR, "h1")
    # Stat card in bg-blue-50 section holds totalCourses count
    COURSE_COUNT   = (By.CSS_SELECTOR, ".bg-blue-50 p")
    # Courses rendered as <a href="/courses/..."> links
    COURSE_CARDS   = (By.CSS_SELECTOR, "a[href^='/courses/']")
    BACK_BUTTON    = (By.XPATH, "//button[contains(.,'Quay lại')]")
    SEARCH_BAR     = (By.CSS_SELECTOR, "input[placeholder*='Tìm kiếm']")
    NOT_FOUND_MSG  = (By.CSS_SELECTOR, "h1")

    def open_by_id(self, teacher_id: int):
        self.go(f"{FRONTEND_URL}/student/teachers/{teacher_id}")
        return self

    def open_search(self):
        self.go(f"{FRONTEND_URL}/student/search")
        return self

    def get_teacher_name(self) -> str:
        if self.is_present(*self.TEACHER_NAME, timeout=5):
            return self.text(*self.TEACHER_NAME)
        return ""

    def get_course_count_from_page(self) -> int | None:
        """Read totalCourses number from the blue stat card on teacher profile."""
        if self.is_present(*self.COURSE_COUNT, timeout=5):
            els = self.driver.find_elements(*self.COURSE_COUNT)
            for el in els:
                text = el.text.strip()
                if text.isdigit():
                    return int(text)
        return None

    def get_course_card_count(self) -> int:
        if not self.is_present(*self.COURSE_CARDS, timeout=5):
            return 0
        return len(self.driver.find_elements(*self.COURSE_CARDS))

    def click_back(self):
        self.click(*self.BACK_BUTTON)

    def is_404_or_not_found(self) -> bool:
        src = self.page_source()
        return "404" in src or "không tìm thấy" in src.lower() or "not found" in src.lower()

    def current_url_contains_teachers(self) -> bool:
        url = self.current_url().lower()
        return "teacher" in url

    def current_url_contains_search(self) -> bool:
        url = self.current_url().lower()
        return "search" in url
