"""Page Objects for /teacher/dashboard/courses/[id] and the ChapterModal.

The detail page has three tabs: Tổng quan / Chương học / Tài liệu. The
chapter list lives under the "Chương học" tab. Each chapter row has a
chevron toggle (expand/collapse), the title, an Edit icon-button
(title="Chỉnh sửa chương") and a Delete icon-button (title="Xóa chương").

ChapterModal (CourseModal-style) is opened by clicking "Thêm chương" or
the per-row Edit icon. On submit success the modal calls native alert()
(L82 update, L86 create) — the toast-vs-alert deviation is what the
TC sheet flags as a UX defect.
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage
from config import settings


class TeacherCourseDetailPage(BasePage):
    URL_PATH_FMT = "/teacher/dashboard/courses/{course_id}"

    HEADING_H1 = (By.XPATH, '//h1')
    TAB_CHAPTERS = (By.XPATH, '//button[normalize-space()="Chương học"]')
    TAB_OVERVIEW = (By.XPATH, '//button[normalize-space()="Tổng quan"]')
    TAB_MATERIALS = (By.XPATH, '//button[normalize-space()="Tài liệu"]')
    ADD_MATERIAL_BUTTON = (By.XPATH, '//button[contains(., "Tải lên tài liệu")]')
    ADD_CHAPTER_BUTTON = (
        By.XPATH,
        '//button[contains(., "Thêm chương")]'
    )
    CHAPTER_ROWS = (
        By.XPATH,
        '//div[contains(@class, "border") and contains(@class, "rounded-lg") '
        'and .//button[@title="Chỉnh sửa chương"]]'
    )

    def __init__(self, driver, course_id=None):
        super().__init__(driver)
        self.course_id = course_id

    def open(self, course_id=None):
        cid = course_id or self.course_id
        if cid is None:
            raise ValueError("course_id required to open course detail")
        self.course_id = cid
        self.driver.get(
            f"{settings.BASE_URL_FE}{self.URL_PATH_FMT.format(course_id=cid)}"
        )
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(self.HEADING_H1)
        )

    def goto_chapters_tab(self):
        self.click(self.TAB_CHAPTERS)
        time.sleep(0.3)

    def add_chapter_button_visible(self):
        return len(self.driver.find_elements(*self.ADD_CHAPTER_BUTTON)) > 0

    def click_add_chapter(self):
        self.click(self.ADD_CHAPTER_BUTTON)

    def find_chapter_row_by_title(self, title):
        candidates = self.driver.find_elements(
            By.XPATH,
            f'//div[contains(@class, "border") and .//h3[normalize-space()="{title}"]]'
        )
        return candidates[0] if candidates else None

    def click_edit_for(self, title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "border")][1]'
            f'//button[@title="Chỉnh sửa chương"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    def click_delete_for(self, title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "border")][1]'
            f'//button[@title="Xóa chương"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    def click_toggle_for(self, title):
        # The chevron toggle is the FIRST button inside the chapter row.
        btns = self.driver.find_elements(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]/ancestor::div[contains(@class, "border")][1]//button'
        )
        if not btns:
            raise RuntimeError(f"No buttons found for chapter row {title!r}")
        self.driver.execute_script("arguments[0].click();", btns[0])

    def episodes_visible_under(self, chapter_title):
        """After clicking the toggle, the episode list area appears with
        either 'Chưa có bài học nào' or actual <h4> titles."""
        try:
            row = self.driver.find_element(
                By.XPATH,
                f'//h3[normalize-space()="{chapter_title}"]'
                f'/ancestor::div[contains(@class, "border")][1]'
            )
        except Exception:
            return False
        sub = row.find_elements(
            By.XPATH,
            './/p[contains(text(), "Chưa có bài học")] | .//h4'
        )
        return any(el.is_displayed() for el in sub)

    # ---- Episode-related ----

    def click_add_episode_in(self, chapter_title):
        """Click the '+ Thêm bài học' button inside an expanded chapter."""
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{chapter_title}"]'
            f'/ancestor::div[contains(@class, "border")][1]'
            f'//button[contains(., "Thêm bài học")]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    def click_edit_episode_for(self, episode_title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h4[normalize-space()="{episode_title}"]'
            f'/ancestor::div[.//button[@title="Chỉnh sửa bài học"]][1]'
            f'//button[@title="Chỉnh sửa bài học"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    def click_delete_episode_for(self, episode_title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h4[normalize-space()="{episode_title}"]'
            f'/ancestor::div[.//button[@title="Xóa bài học"]][1]'
            f'//button[@title="Xóa bài học"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    # ---- Materials tab ----

    def goto_materials_tab(self):
        self.click(self.TAB_MATERIALS)
        time.sleep(0.3)

    def click_add_material(self):
        self.click(self.ADD_MATERIAL_BUTTON)

    def click_edit_material_for(self, title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]'
            f'/ancestor::div[.//button[@title="Chỉnh sửa"]][1]'
            f'//button[@title="Chỉnh sửa"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)

    def click_delete_material_for(self, title):
        btn = self.driver.find_element(
            By.XPATH,
            f'//h3[normalize-space()="{title}"]'
            f'/ancestor::div[.//button[@title="Xóa"]][1]'
            f'//button[@title="Xóa"]'
        )
        self.driver.execute_script("arguments[0].click();", btn)


class ChapterModalPage(BasePage):
    MODAL_ROOT = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//h2[contains(., "chương")]/ancestor::div[contains(@class, "fixed")]'
    )
    HEADING = (By.XPATH, '//div[contains(@class, "fixed")]//h2')
    TITLE_INPUT = (
        By.XPATH,
        '//input[@placeholder="Ví dụ: Chương 1: Đường thẳng và mặt phẳng trong không gian"]'
    )
    ORDER_INPUT = (
        By.XPATH,
        '//input[@type="number" and @placeholder="1, 2, 3, ..."]'
    )
    CANCEL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[normalize-space()="Hủy"]'
    )
    SUBMIT_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//button[@type="submit" '
        'and (contains(., "Tạo chương") or contains(., "Cập nhật") or contains(., "Đang lưu"))]'
    )
    FIELD_ERRORS = (
        By.XPATH,
        '//div[contains(@class, "fixed")]//p[contains(@class, "text-red-500")]'
    )

    def is_visible(self, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(self.HEADING)
            )
            return True
        except Exception:
            return False

    def heading_text(self):
        return self.find(self.HEADING).text

    def fill_title(self, value):
        el = self.find(self.TITLE_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def fill_order(self, value):
        el = self.find(self.ORDER_INPUT)
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value is not None and value != "":
            el.send_keys(str(value))

    def title_placeholder(self):
        return self.find(self.TITLE_INPUT).get_attribute("placeholder")

    def order_placeholder(self):
        return self.find(self.ORDER_INPUT).get_attribute("placeholder")

    def field_error_texts(self):
        return [el.text for el in self.driver.find_elements(*self.FIELD_ERRORS) if el.text.strip()]

    def submit(self):
        self.driver.find_element(*self.SUBMIT_BUTTON).click()

    def cancel(self):
        self.driver.find_element(*self.CANCEL_BUTTON).click()

    def submit_button_text(self):
        return self.driver.find_element(*self.SUBMIT_BUTTON).text.strip()
