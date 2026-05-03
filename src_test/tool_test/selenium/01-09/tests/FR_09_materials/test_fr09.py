"""FR_09 — Course material management system tests.

18 test cases sourced from sheet FR_09 in ss_test_13.xlsx.

Implementation notes:
  - MaterialModal uses native window.alert() for everything (file
    validation errors, upload success, submit success/failure). The TC
    sheet flags the success-path alerts as a UX deviation (toast
    expected) for FR_009_004 and FR_009_015.
  - The accept attribute on the file input lists `.doc,.docx,.ppt,.pptx,
    .xls,.xlsx,.txt` — PDF is intentionally NOT supported, so
    FR_009_005 fails (sheet gốc also Fail).
  - Delete on courses/[id]/page.tsx uses native confirm()/alert()
    (L148/L152) — FR_009_017 fails for the same alert-vs-toast reason
    as FR_06/FR_07/FR_08.
  - Drag-and-drop (FR_009_018) is hard to simulate reliably in
    Selenium and the FE only wires a click-to-browse label (no onDrop
    handler), so it's marked Inactive with explanation.
"""
import time
import uuid

import pytest
from selenium.common.exceptions import NoAlertPresentException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.teacher_course_detail_page import TeacherCourseDetailPage
from pages.material_modal_page import MaterialModalPage
from pages.teacher_courses_page import grab_alert_text
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, get_or_create_subject, get_or_create_grade_level,
    seed_course, seed_material, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_09_course_material_management.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _drain_alerts(driver, max_count=5):
    """Accept any pending native alerts (upload-success, etc.)."""
    out = []
    for _ in range(max_count):
        try:
            a = driver.switch_to.alert
            out.append(a.text)
            a.accept()
            time.sleep(0.2)
        except NoAlertPresentException:
            break
    return out


@pytest.fixture(scope="session")
def db_conn_session():
    import mysql.connector
    conn = mysql.connector.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    yield conn
    conn.close()


@pytest.fixture(scope="session")
def metadata_ids(db_conn_session):
    return {
        "subject_id": get_or_create_subject(db_conn_session, "Toán học"),
        "grade_id": get_or_create_grade_level(db_conn_session, "Lớp 10"),
    }


@pytest.fixture
def materials_ready(driver, db_conn, metadata_ids, cleanup_test_users):
    """Seed teacher + course, log in, navigate to course detail Materials tab."""
    email = _unique_email()
    password = "Abc123456"
    teacher_id = seed_user(
        db_conn, email=email, password_plain=password,
        full_name="MaterialTeacher", role="TEACHER",
    )
    course_title = f"Course {uuid.uuid4().hex[:6]}"
    course_id = seed_course(
        db_conn, teacher_id=teacher_id,
        subject_id=metadata_ids["subject_id"],
        grade_level_id=metadata_ids["grade_id"],
        title=course_title,
    )
    login = LoginPage(driver).open()
    login.fill_form(email=email, password=password)
    login.click_submit()
    WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
    page = TeacherCourseDetailPage(driver, course_id=course_id)
    page.open()
    page.wait_until_loaded()
    page.goto_materials_tab()
    return page, course_id


# ---- File fixtures ----

@pytest.fixture
def docx_file(tmp_path):
    p = tmp_path / "doc1.docx"
    # Minimal "DOCX" — just the file extension matters for FE validator;
    # Cloudinary 'raw' uploads accept any bytes.
    p.write_bytes(b"PK\x03\x04" + b"\x00" * 200)
    return str(p.resolve())


@pytest.fixture
def pptx_file(tmp_path):
    p = tmp_path / "slides.pptx"
    p.write_bytes(b"PK\x03\x04" + b"\x00" * 200)
    return str(p.resolve())


@pytest.fixture
def xlsx_file(tmp_path):
    p = tmp_path / "data.xlsx"
    p.write_bytes(b"PK\x03\x04" + b"\x00" * 200)
    return str(p.resolve())


@pytest.fixture
def txt_file(tmp_path):
    p = tmp_path / "notes.txt"
    p.write_text("Hello world – auto test\n", encoding="utf-8")
    return str(p.resolve())


@pytest.fixture
def pdf_file(tmp_path):
    p = tmp_path / "doc.pdf"
    p.write_bytes(b"%PDF-1.4\n" + b"\x00" * 200)
    return str(p.resolve())


@pytest.fixture
def jpg_file(tmp_path):
    p = tmp_path / "image.jpg"
    p.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 100)
    return str(p.resolve())


@pytest.fixture
def mp4_file(tmp_path):
    p = tmp_path / "video.mp4"
    p.write_bytes(b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 100)
    return str(p.resolve())


@pytest.fixture
def big_docx(tmp_path):
    """11 MB DOCX-named file to trip the 10 MB size validator."""
    p = tmp_path / "big.docx"
    p.write_bytes(b"PK\x03\x04" + b"\x00" * (11 * 1024 * 1024))
    return str(p.resolve())


# =============================================================================
# Section 1 — UI/UX (FR_009_001 to FR_009_003)
# =============================================================================

class TestMaterialModalUI:
    def test_FR_009_001_modal_layout(self, materials_ready):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        assert "Thêm tài liệu mới" in modal.heading_text()
        assert page.driver.find_element(*modal.CANCEL_BUTTON).is_displayed()
        assert "Thêm tài liệu" in modal.submit_button_text()

    def test_FR_009_002_placeholder(self, materials_ready):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        assert modal.title_placeholder() == "Nhập tên tài liệu..."

    def test_FR_009_003_helper_text(self, materials_ready):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        helper = modal.helper_text()
        assert "DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT" in helper
        assert "10MB" in helper


# =============================================================================
# Section 2 — Add material (FR_009_004 to FR_009_008)
# =============================================================================

class TestAddMaterial:
    def test_FR_009_004_add_docx_uses_alert_not_toast(
        self, materials_ready, db_conn, docx_file
    ):
        page, course_id = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        modal.upload_file(docx_file)
        # First an upload-success alert from the modal (after Cloudinary).
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload file thành công" in upload_text, (
            f"Upload-success alert not seen — Cloudinary may have rejected "
            f"the bogus DOCX. Got: {upload_text!r}"
        )
        title = f"DOCX {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.submit()
        submit_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM course_materials WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is not None, "Material was not saved in DB"
        assert submit_text is None, (
            f"TC expects toast 'Thêm tài liệu thành công!' but "
            f"MaterialModal.tsx L124 calls window.alert(). Native alert "
            f"seen: {submit_text!r}. Material was created in DB; only the "
            f"success-delivery channel is wrong."
        )

    def test_FR_009_005_add_pdf_rejected(self, materials_ready, pdf_file):
        """TC expects PDF to upload successfully but the FE accept attribute
        is `.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt` (no `.pdf`). Combined
        with isValidDocumentFile, PDF triggers an alert reject."""
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        modal.upload_file(pdf_file)
        alert_text = grab_alert_text(page.driver, timeout=5)
        assert alert_text is None, (
            f"TC expects PDF to be uploaded successfully ('Thêm tài liệu "
            f"thành công!'), but the FE rejects PDF: it's not in the file "
            f"input's accept list (.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt) "
            f"and isValidDocumentFile fires an alert. Reject alert seen: "
            f"{alert_text!r}. Feature does not support PDF."
        )

    def test_FR_009_006_add_pptx(
        self, materials_ready, db_conn, pptx_file
    ):
        page, course_id = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(pptx_file)
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload file thành công" in upload_text, (
            f"Cloudinary upload alert missing for PPTX: {upload_text!r}"
        )
        title = f"PPTX {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.submit()
        grab_alert_text(page.driver, timeout=10)  # accept the alert
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM course_materials WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is not None, "PPTX material was not saved"

    def test_FR_009_007_add_xlsx(
        self, materials_ready, db_conn, xlsx_file
    ):
        page, course_id = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(xlsx_file)
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload file thành công" in upload_text, (
            f"Cloudinary upload alert missing for XLSX: {upload_text!r}"
        )
        title = f"XLSX {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.submit()
        grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM course_materials WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is not None

    def test_FR_009_008_add_txt(self, materials_ready, db_conn, txt_file):
        page, course_id = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(txt_file)
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload file thành công" in upload_text, (
            f"Cloudinary upload alert missing for TXT: {upload_text!r}"
        )
        title = f"TXT {uuid.uuid4().hex[:6]}"
        modal.fill_title(title)
        modal.submit()
        grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT id FROM course_materials WHERE course_id = %s AND title = %s",
            (course_id, title),
        )
        assert row is not None


# =============================================================================
# Section 3 — Validation (FR_009_009 to FR_009_013)
# =============================================================================

class TestMaterialValidation:
    def test_FR_009_009_jpg_rejected(self, materials_ready, jpg_file):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(jpg_file)
        alert_text = grab_alert_text(page.driver, timeout=5)
        assert alert_text and "Vui lòng chọn file tài liệu hợp lệ" in alert_text, (
            f"Expected reject alert for JPG; got {alert_text!r}"
        )

    def test_FR_009_010_mp4_rejected(self, materials_ready, mp4_file):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(mp4_file)
        alert_text = grab_alert_text(page.driver, timeout=5)
        assert alert_text and "Vui lòng chọn file tài liệu hợp lệ" in alert_text, (
            f"Expected reject alert for MP4; got {alert_text!r}"
        )

    def test_FR_009_011_oversize_rejected(self, materials_ready, big_docx):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(big_docx)
        alert_text = grab_alert_text(page.driver, timeout=5)
        assert alert_text and "không được vượt quá 10MB" in alert_text, (
            f"Expected oversize reject alert; got {alert_text!r}"
        )

    def test_FR_009_012_empty_title_blocks_submit(
        self, materials_ready, db_conn, txt_file
    ):
        """Title input has HTML5 `required`, so the browser blocks form
        submission before handleSubmit's alert("Vui lòng nhập tên tài liệu!")
        runs. Either way the user is prevented; verify no DB row created."""
        page, course_id = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        modal.upload_file(txt_file)
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload" in upload_text
        # Auto-fills title from filename — wipe it back to empty
        modal.fill_title("")
        # Get the auto-filled name we just cleared, so we can search DB
        modal.submit()
        time.sleep(1)
        # Modal stays open and no row added
        rows = fetch_one(
            db_conn,
            "SELECT COUNT(*) AS c FROM course_materials WHERE course_id = %s",
            (course_id,),
        )
        assert rows and rows["c"] == 0, (
            f"Submission with empty title must be rejected; "
            f"course_materials count = {rows!r}"
        )

    def test_FR_009_013_no_file_blocks_submit(self, materials_ready):
        """Submit button is disabled while !fileUrl, so the user can't even
        click it without a file. Verify that protective state."""
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        modal.fill_title("Some title")
        assert modal.submit_disabled(), (
            "Submit button must be disabled when no file has been uploaded "
            "(MaterialModal.tsx L256: disabled={... || !fileUrl})."
        )


# =============================================================================
# Section 4 — Auto-fill title (FR_009_014)
# =============================================================================

class TestAutoFillTitle:
    def test_FR_009_014_title_auto_fills_from_filename(
        self, materials_ready, txt_file
    ):
        page, _ = materials_ready
        page.click_add_material()
        modal = MaterialModalPage(page.driver)
        # Title initially empty
        assert modal.title_value() == ""
        modal.upload_file(txt_file)
        # Filename without extension → 'notes' (txt_file fixture writes notes.txt)
        # The auto-fill happens synchronously in handleFileSelect *before*
        # the upload-success alert.
        time.sleep(0.5)
        # An upload-success alert may already have appeared; dismiss it so
        # we can read the input afterwards.
        _drain_alerts(page.driver)
        assert modal.title_value() == "notes", (
            f"Title should auto-fill from filename 'notes.txt' → 'notes'; "
            f"got {modal.title_value()!r}"
        )


# =============================================================================
# Section 5 — Edit material (FR_009_015, FR_009_016)
# =============================================================================

class TestEditMaterial:
    def test_FR_009_015_edit_title_uses_alert_not_toast(
        self, materials_ready, db_conn
    ):
        page, course_id = materials_ready
        title_old = f"Old {uuid.uuid4().hex[:6]}"
        mat_id = seed_material(
            db_conn, course_id=course_id, title=title_old,
            file_url="https://example.com/a.docx", file_size_kb=10,
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_materials_tab()
        WebDriverWait(page.driver, 10).until(lambda d: title_old in d.page_source)
        page.click_edit_material_for(title_old)
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        title_new = f"Renamed {uuid.uuid4().hex[:6]}"
        modal.fill_title(title_new)
        modal.submit()
        alert_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT title FROM course_materials WHERE id = %s", (mat_id,)
        )
        assert row and row["title"] == title_new, (
            f"DB title not updated; row = {row!r}"
        )
        assert alert_text is None, (
            f"TC expects toast 'Cập nhật tài liệu thành công!' but "
            f"MaterialModal.tsx L116 calls window.alert(). Native alert "
            f"seen: {alert_text!r}."
        )

    def test_FR_009_016_replace_file(
        self, materials_ready, db_conn, xlsx_file
    ):
        page, course_id = materials_ready
        title_old = f"ReplaceMe {uuid.uuid4().hex[:6]}"
        mat_id = seed_material(
            db_conn, course_id=course_id, title=title_old,
            file_url="https://example.com/old.docx", file_size_kb=5,
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_materials_tab()
        WebDriverWait(page.driver, 10).until(lambda d: title_old in d.page_source)
        page.click_edit_material_for(title_old)
        modal = MaterialModalPage(page.driver)
        assert modal.is_visible()
        # Click the upload label (now reads "Chọn file khác") and select new file
        modal.upload_file(xlsx_file)
        upload_text = grab_alert_text(page.driver, timeout=15)
        assert upload_text and "Upload file thành công" in upload_text, (
            f"New file upload alert missing: {upload_text!r}"
        )
        modal.submit()
        grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn,
            "SELECT fileUrl FROM course_materials WHERE id = %s",
            (mat_id,),
        )
        assert row and row["fileUrl"] != "https://example.com/old.docx", (
            f"fileUrl should be updated to a new Cloudinary URL after "
            f"replacing the file; got {row!r}"
        )


# =============================================================================
# Section 6 — Delete (FR_009_017)
# =============================================================================

class TestDeleteMaterial:
    def test_FR_009_017_delete_uses_native_confirm_and_alert(
        self, materials_ready, db_conn
    ):
        page, course_id = materials_ready
        title = f"DelMe {uuid.uuid4().hex[:6]}"
        mat_id = seed_material(
            db_conn, course_id=course_id, title=title,
            file_url="https://example.com/x.docx", file_size_kb=10,
        )
        page.driver.refresh()
        page.wait_until_loaded()
        page.goto_materials_tab()
        WebDriverWait(page.driver, 10).until(lambda d: title in d.page_source)
        page.click_delete_material_for(title)
        time.sleep(0.3)
        try:
            confirm = page.driver.switch_to.alert
            confirm_text = confirm.text
            confirm.accept()
        except NoAlertPresentException:
            confirm_text = None
        success_text = grab_alert_text(page.driver, timeout=10)
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT id FROM course_materials WHERE id = %s", (mat_id,)
        )
        assert row is None, "Material was not deleted from DB"
        assert confirm_text is None and success_text is None, (
            f"TC expects an in-app confirm modal and a toast for delete success. "
            f"courses/[id]/page.tsx L148 calls window.confirm() (text: "
            f"{confirm_text!r}) and L152 calls window.alert() (text: "
            f"{success_text!r}) — both native browser dialogs."
        )


# =============================================================================
# Section 7 — Drag-and-drop (FR_009_018)
# =============================================================================

class TestDragAndDrop:
    def test_FR_009_018_drag_and_drop_upload(self, materials_ready):
        pytest.skip(
            "Inactive: Khu vực upload chỉ là một <label htmlFor='material-"
            "file-input'> wrapping click-to-browse — KHÔNG có handler "
            "onDrop/onDragOver. Browser có thể nhận drop trên file input "
            "nhưng thao tác kéo-thả không thể mô phỏng tin cậy trong "
            "Selenium (cần OS-level drag, không qua WebDriver protocol). "
            "Manual tester có thể test bằng cách kéo file thật vào ô upload. "
            "Chức năng tương đương đã được verify qua FR_009_004 (file "
            "input cùng accept list)."
        )
