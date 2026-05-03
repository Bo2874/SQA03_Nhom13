"""Admin Teacher Account Management page — FR26 (CRUD)."""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from pages.base_page import BasePage
from config.config import ADMIN_URL


class TeacherAccountPage(BasePage):
    POSSIBLE_PATHS = ["/teachers", "/users/teachers", "/manage/teachers"]

    # Buttons
    CREATE_BTN   = (By.XPATH, "//button[contains(., 'Tạo') or contains(., 'Thêm') or contains(., 'Create')]")
    MODAL        = (By.CSS_SELECTOR, ".ant-modal-content, [role='dialog']")
    MODAL_TITLE  = (By.CSS_SELECTOR, ".ant-modal-title, [role='dialog'] h3, [role='dialog'] h2")

    # Form fields inside modal
    EMAIL_INPUT    = (By.CSS_SELECTOR, ".ant-modal input[placeholder='teacher@example.com']")
    NAME_INPUT     = (By.CSS_SELECTOR, ".ant-modal input[placeholder='Nguyễn Văn A']")
    PHONE_INPUT    = (By.CSS_SELECTOR, ".ant-modal input[placeholder='0901234567']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, ".ant-modal input[placeholder='Tối thiểu 6 ký tự']")
    CONFIRM_PASS   = (By.CSS_SELECTOR, ".ant-modal input[placeholder='Nhập lại mật khẩu']")
    MODAL_SUBMIT   = (By.CSS_SELECTOR, ".ant-modal button[type='submit']")
    MODAL_CANCEL   = (By.CSS_SELECTOR, ".ant-modal-footer .ant-btn:not(.ant-btn-primary)")

    # Table
    TABLE_ROWS   = (By.CSS_SELECTOR, ".ant-table-tbody tr, tbody tr")
    EDIT_BTNS    = (By.XPATH, "//button[contains(., 'Sửa') or contains(., 'Edit') or contains(@class,'edit')]")
    DELETE_BTNS  = (By.XPATH, "//button[contains(., 'Xóa') or contains(., 'Delete') or contains(@class,'delete')]")
    CONFIRM_OK   = (By.CSS_SELECTOR, ".ant-popconfirm .ant-btn-primary, .ant-modal-confirm-btns .ant-btn-danger, .ant-modal-confirm-btns .ant-btn-primary")
    CANCEL_CONFIRM = (By.CSS_SELECTOR, ".ant-popconfirm .ant-btn:not(.ant-btn-primary), .ant-popover .ant-btn:not(.ant-btn-primary)")

    # Toast / notification
    TOAST        = (By.CSS_SELECTOR, ".ant-notification-notice, .ant-message-notice")
    ERROR_MSG    = (By.CSS_SELECTOR, ".ant-form-item-explain-error, .ant-alert-message")

    def navigate(self):
        for path in self.POSSIBLE_PATHS:
            self.go(f"{ADMIN_URL}{path}")
            if self.is_present(*self.TABLE_ROWS, timeout=4):
                return self
        self.go(ADMIN_URL)
        return self

    def open_create_modal(self):
        self.click(*self.CREATE_BTN)
        self.find_visible(*self.MODAL)

    def fill_create_form(self, email: str, name: str, phone: str, password: str, confirm: str = None):
        self.type(*self.EMAIL_INPUT, email)
        self.type(*self.NAME_INPUT, name)
        self.type(*self.PHONE_INPUT, phone)
        # password fields - use specific placeholders to avoid confusion
        self.type(*self.PASSWORD_INPUT, password)
        self.type(*self.CONFIRM_PASS, confirm or password)

    def submit_modal(self):
        self.click(*self.MODAL_SUBMIT)
        time.sleep(0.5)

    def cancel_modal(self):
        self.click(*self.MODAL_CANCEL)

    def get_error_messages(self) -> list[str]:
        errors = self.driver.find_elements(*self.ERROR_MSG)
        return [e.text.strip() for e in errors if e.text.strip()]

    def is_toast_visible(self, timeout: int = 5) -> bool:
        return self.is_present(*self.TOAST, timeout=timeout)

    def get_row_texts(self) -> list[str]:
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        return [r.text.strip() for r in rows]

    def click_edit_for_row(self, row_index: int = 0):
        edits = self.driver.find_elements(*self.EDIT_BTNS)
        if row_index < len(edits):
            edits[row_index].click()
            self.find_visible(*self.MODAL)

    def click_delete_for_row(self, row_index: int = 0):
        deletes = self.driver.find_elements(*self.DELETE_BTNS)
        if row_index < len(deletes):
            deletes[row_index].click()

    def confirm_delete(self):
        self.find_clickable(*self.CONFIRM_OK)
        self.click(*self.CONFIRM_OK)
        time.sleep(0.5)

    def cancel_delete(self):
        self.click(*self.CANCEL_CONFIRM)

    def get_row_count(self) -> int:
        if not self.is_present(*self.TABLE_ROWS, timeout=5):
            return 0
        return len(self.driver.find_elements(*self.TABLE_ROWS))
