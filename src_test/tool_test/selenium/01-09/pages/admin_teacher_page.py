"""Page Objects for the elearning-admin app (port 3002).

Covers /login (admin login) and /teachers (teacher management). The admin
panel is built with Ant Design — its inputs and modals have specific
selectors that don't match the FE conventions used elsewhere.
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings


class AdminLoginPage:
    URL_PATH = "/login"

    EMAIL = (By.CSS_SELECTOR, 'input[id="login_email"]')
    PASSWORD = (By.CSS_SELECTOR, 'input[id="login_password"]')
    SUBMIT_BUTTON = (By.XPATH, '//button[@type="submit"]')

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, settings.EXPLICIT_WAIT)

    def open(self):
        self.driver.get(f"{settings.BASE_URL_ADMIN}{self.URL_PATH}")
        return self

    def login(self, email, password):
        self.wait.until(EC.visibility_of_element_located(self.EMAIL)).send_keys(email)
        self.driver.find_element(*self.PASSWORD).send_keys(password)
        self.driver.find_element(*self.SUBMIT_BUTTON).click()


class AdminTeacherPage:
    URL_PATH = "/teachers"

    PAGE_TITLE = (By.XPATH, '//h2[normalize-space()="Quản Lý Giáo Viên"]')
    TABLE_ROWS = (By.CSS_SELECTOR, 'tbody.ant-table-tbody > tr.ant-table-row')
    EDIT_BUTTONS = (By.XPATH, '//button[.//span[contains(text(), "Sửa")]]')

    EDIT_MODAL = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content") '
        'and .//*[contains(text(), "Chỉnh Sửa Thông Tin Giáo Viên")]]',
    )
    # Locate inputs by their Form.Item label inside the edit modal.
    EDIT_FULLNAME = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//div[contains(@class, "ant-form-item") '
        'and .//label[contains(text(), "Họ và Tên")]]//input',
    )
    EDIT_PHONE = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//div[contains(@class, "ant-form-item") '
        'and .//label[contains(text(), "Số Điện Thoại")]]//input',
    )
    EDIT_EMAIL = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//div[contains(@class, "ant-form-item") '
        'and .//label[contains(text(), "Email")]]//input',
    )
    EDIT_SUBMIT = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//button[.//span[contains(text(), "Cập Nhật")]]',
    )
    UPLOAD_BUTTON = (
        By.XPATH,
        '//div[contains(@class, "ant-modal-content")]'
        '//button[.//span[contains(text(), "Upload")]]',
    )

    # Antd success/error toast
    ANTD_MESSAGE = (By.CSS_SELECTOR, '.ant-message-notice-content')
    # Antd Form.Item error
    FIELD_ERROR_FULLNAME = (By.XPATH, '//div[@class="ant-modal-content"]//div[contains(@class, "ant-form-item-explain-error")]')

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, settings.EXPLICIT_WAIT)

    def open(self):
        self.driver.get(f"{settings.BASE_URL_ADMIN}{self.URL_PATH}")
        self.wait.until(EC.visibility_of_element_located(self.PAGE_TITLE))
        return self

    def wait_for_table(self):
        # Either rows or "No data" should appear
        WebDriverWait(self.driver, 15).until(
            lambda d: d.find_elements(*self.TABLE_ROWS) or d.find_elements(
                By.CSS_SELECTOR, ".ant-empty"
            )
        )

    def find_teacher_row_by_email(self, email):
        """Find the table row whose Giáo Viên cell shows this email."""
        rows = self.driver.find_elements(*self.TABLE_ROWS)
        for row in rows:
            if email in row.text:
                return row
        return None

    def click_edit_for(self, email):
        row = self.find_teacher_row_by_email(email)
        assert row is not None, f"No row found for {email}"
        edit_btn = row.find_element(By.XPATH, './/button[.//span[contains(text(), "Sửa")]]')
        edit_btn.click()
        self.wait.until(EC.visibility_of_element_located(self.EDIT_MODAL))

    def edit_modal_visible(self):
        return self.driver.find_elements(*self.EDIT_MODAL) != []

    def fill_edit_fullname(self, value):
        el = self.wait.until(EC.visibility_of_element_located(self.EDIT_FULLNAME))
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def fill_edit_phone(self, value):
        el = self.wait.until(EC.visibility_of_element_located(self.EDIT_PHONE))
        el.send_keys(Keys.CONTROL, "a")
        el.send_keys(Keys.DELETE)
        if value:
            el.send_keys(value)

    def submit_edit(self):
        self.driver.find_element(*self.EDIT_SUBMIT).click()

    def get_antd_message(self, timeout=5):
        try:
            els = WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_all_elements_located(self.ANTD_MESSAGE)
            )
            return [el.text for el in els]
        except Exception:
            return []

    def get_field_errors(self):
        els = self.driver.find_elements(*self.FIELD_ERROR_FULLNAME)
        return [el.text for el in els if el.text.strip()]

    def upload_avatar_via_js(self, filename, mime_type, size_bytes=None,
                             byte_list=None):
        """Bypass the dynamic file-input creation in TeacherApproval.tsx by
        creating a File object in JS and dispatching it to the upload
        handler. The page builds an `<input type="file">` on click, so we
        hijack document.createElement before clicking Upload.

        Args:
          size_bytes: if byte_list is None, build a zero-filled buffer of
            this size (used for the >5MB or PDF "fake content" tests).
          byte_list: Python list of int 0–255 representing the file's real
            bytes (used for the happy-path test, where Cloudinary
            content-validates the upload).
        """
        prep_script = """
        const realCreate = document.createElement.bind(document);
        window.__capturedInput = null;
        document.createElement = function(tag) {
            const el = realCreate(tag);
            if (String(tag).toLowerCase() === 'input') {
                window.__capturedInput = el;
                el.click = function () { /* no-op to prevent OS dialog */ };
                document.body.appendChild(el);
            }
            return el;
        };
        """
        self.driver.execute_script(prep_script)
        self.driver.find_element(*self.UPLOAD_BUTTON).click()
        time.sleep(0.3)

        size = size_bytes if size_bytes is not None else 100
        dispatch_script = """
        const filename = arguments[0];
        const mime = arguments[1];
        const size = arguments[2];
        const byteList = arguments[3];
        const bytes = byteList ? new Uint8Array(byteList) : new Uint8Array(size);
        const file = new File([bytes], filename, { type: mime });
        const input = window.__capturedInput;
        if (!input) throw new Error('No file input was captured');
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        """
        self.driver.execute_script(
            dispatch_script, filename, mime_type, size, byte_list
        )
        time.sleep(0.5)
