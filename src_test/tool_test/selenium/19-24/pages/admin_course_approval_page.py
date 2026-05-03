"""Page Object for admin /courses (CourseApproval).

Antd table + dropdown menu. Each row has a "Đổi trạng thái" dropdown that
opens a portal-rendered menu with 4 items (Chờ duyệt / Duyệt / Từ chối /
Xuất bản). Item is `disabled` only when its key === record.status.

Reject flow opens a Modal asking for a rejection reason (TextArea with
maxLength=500 and showCount).
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

from pages.base_page import BasePage
from config import settings


class AdminCourseApprovalPage(BasePage):
    URL_PATH = "/courses"

    PAGE_TITLE = (By.XPATH, '//h2[normalize-space()="Quản Lý Khóa Học"]')
    STATUS_FILTER = (By.CSS_SELECTOR, '.ant-select')
    TABLE_ROWS = (
        By.CSS_SELECTOR, 'tbody.ant-table-tbody > tr.ant-table-row'
    )
    EMPTY_STATE = (By.CSS_SELECTOR, '.ant-empty')
    LOADING_INDICATOR = (
        By.CSS_SELECTOR, '.ant-table-wrapper .ant-spin-spinning'
    )
    REJECT_MODAL = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content") '
        'and .//*[contains(text(), "Từ Chối Khóa Học")]]'
    )
    REJECT_REASON_TEXTAREA = (
        By.XPATH, '//div[contains(@class, "ant-modal-content")]//textarea'
    )
    REJECT_CONFIRM_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//button[.//span[contains(text(), "Xác Nhận Từ Chối")]]'
    )
    REJECT_CANCEL_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//button[.//span[contains(text(), "Hủy")]]'
    )
    DROPDOWN_MENU = (
        By.CSS_SELECTOR, '.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu'
    )
    ANTD_MESSAGE = (By.CSS_SELECTOR, '.ant-message-notice-content')

    def open(self):
        self.driver.get(f"{settings.BASE_URL_ADMIN}{self.URL_PATH}")
        return self

    def wait_until_loaded(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(self.PAGE_TITLE)
        )
        # Wait for table loading spinner to disappear
        try:
            WebDriverWait(self.driver, timeout).until_not(
                EC.presence_of_element_located(self.LOADING_INDICATOR)
            )
        except Exception:
            pass

    def status_filter_label(self):
        """Return the currently selected option text in the filter Select."""
        sel = self.find(self.STATUS_FILTER)
        item = sel.find_elements(By.CSS_SELECTOR, '.ant-select-selection-item')
        return item[0].text if item else ""

    def select_status_filter(self, label):
        sel = self.find(self.STATUS_FILTER)
        sel.click()
        time.sleep(0.3)
        # Antd Select renders options in a portal
        opt = WebDriverWait(self.driver, 5).until(
            EC.element_to_be_clickable(
                (By.XPATH, f'//div[contains(@class, "ant-select-item-option")]'
                           f'//*[normalize-space()="{label}"]')
            )
        )
        opt.click()
        time.sleep(0.5)

    def row_count(self):
        return len(self.driver.find_elements(*self.TABLE_ROWS))

    def visible_titles(self):
        cells = self.driver.find_elements(
            By.CSS_SELECTOR,
            'tbody.ant-table-tbody > tr.ant-table-row td:nth-child(2) div:nth-child(1)'
        )
        return [c.text for c in cells]

    def find_row_by_title(self, title):
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        for row in rows:
            if title in row.text:
                return row
        return None

    def status_tag_text_for(self, title):
        row = self.find_row_by_title(title)
        if not row:
            return None
        tags = row.find_elements(By.CSS_SELECTOR, '.ant-tag')
        return tags[-1].text if tags else None

    def status_tag_color_class_for(self, title):
        row = self.find_row_by_title(title)
        if not row:
            return None
        tags = row.find_elements(By.CSS_SELECTOR, '.ant-tag')
        return tags[-1].get_attribute("class") if tags else None

    def click_change_status_for(self, title):
        row = self.find_row_by_title(title)
        if not row:
            raise RuntimeError(f"No row matching {title!r}")
        btn = row.find_element(
            By.XPATH, './/button[.//span[contains(text(), "Đổi trạng thái")]]'
        )
        self.driver.execute_script("arguments[0].click();", btn)
        time.sleep(0.4)

    def open_dropdown_menu_items(self):
        """Return list of (label, is_disabled) for the open dropdown menu."""
        try:
            menu = self.find(self.DROPDOWN_MENU)
        except Exception:
            return []
        items = menu.find_elements(By.CSS_SELECTOR, '.ant-dropdown-menu-item')
        out = []
        for it in items:
            label = it.text.strip()
            is_disabled = "ant-dropdown-menu-item-disabled" in (
                it.get_attribute("class") or ""
            )
            out.append((label, is_disabled))
        return out

    def click_dropdown_item(self, label):
        try:
            menu = self.find(self.DROPDOWN_MENU)
        except Exception:
            return False
        items = menu.find_elements(By.CSS_SELECTOR, '.ant-dropdown-menu-item')
        for it in items:
            if it.text.strip() == label:
                self.driver.execute_script("arguments[0].click();", it)
                return True
        return False

    def reject_modal_visible(self):
        return len(self.driver.find_elements(*self.REJECT_MODAL)) > 0

    def fill_rejection_reason(self, value):
        el = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located(self.REJECT_REASON_TEXTAREA)
        )
        el.clear()
        if value:
            el.send_keys(value)

    def reject_textarea_placeholder(self):
        el = self.find(self.REJECT_REASON_TEXTAREA)
        return el.get_attribute("placeholder") or ""

    def reject_textarea_max_length(self):
        el = self.find(self.REJECT_REASON_TEXTAREA)
        return el.get_attribute("maxlength") or ""

    def reject_textarea_count_visible(self):
        # Antd showCount renders a count span inside a wrapper
        return len(self.driver.find_elements(
            By.CSS_SELECTOR, '.ant-input-data-count'
        )) > 0

    def click_reject_confirm(self):
        self.driver.find_element(*self.REJECT_CONFIRM_BUTTON).click()

    def click_reject_cancel(self):
        self.driver.find_element(*self.REJECT_CANCEL_BUTTON).click()

    def get_messages(self, timeout=5):
        try:
            els = WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_all_elements_located(self.ANTD_MESSAGE)
            )
            return [el.text for el in els]
        except Exception:
            return []
