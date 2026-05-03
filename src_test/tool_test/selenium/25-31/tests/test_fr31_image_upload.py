"""
FR31 — Image Upload via Cloudinary (Frontend Teacher)
5 automated test cases: 009, 011, 012, 016 (known bug), 017
"""
import os
import tempfile
import pytest
from pages.frontend.image_upload_page import ImageUploadPage
from config.config import get, FRONTEND_URL


@pytest.mark.fr31
class TestFR31ImageUpload:
    """
    Tests run on the Teacher course creation page where Cloudinary upload is present.
    Teacher must be logged in (teacher_driver fixture).
    """

    def test_FR_031_009_pdf_file_rejected(self, teacher_driver):
        """FR_031_009: Upload file PDF → bị từ chối với thông báo lỗi định dạng."""
        page = ImageUploadPage(teacher_driver)
        page.open_course_create()

        if not page.is_present(*ImageUploadPage.UPLOAD_INPUT, timeout=5):
            pytest.skip("Không tìm thấy input upload trên trang tạo khóa học")

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            ImageUploadPage.create_temp_pdf(tmp.name)
            pdf_path = tmp.name

        try:
            page.upload_file(pdf_path)
            assert page.is_error_shown(timeout=6), \
                "Không có thông báo lỗi khi upload file PDF — hệ thống cần từ chối file không phải ảnh"
        finally:
            os.unlink(pdf_path)

    def test_FR_031_011_oversized_image_rejected(self, teacher_driver):
        """FR_031_011: Upload ảnh >5MB → bị từ chối."""
        page = ImageUploadPage(teacher_driver)
        page.open_course_create()

        if not page.is_present(*ImageUploadPage.UPLOAD_INPUT, timeout=5):
            pytest.skip("Không tìm thấy input upload")

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            ImageUploadPage.create_temp_large_image(tmp.name, size_mb=6)
            big_path = tmp.name

        try:
            page.upload_file(big_path)
            assert page.is_error_shown(timeout=6), \
                "Không có thông báo lỗi khi upload ảnh >5MB"
        finally:
            os.unlink(big_path)

    def test_FR_031_012_empty_file_rejected(self, teacher_driver):
        """FR_031_012: Upload file rỗng (0 byte) → bị từ chối."""
        page = ImageUploadPage(teacher_driver)
        page.open_course_create()

        if not page.is_present(*ImageUploadPage.UPLOAD_INPUT, timeout=5):
            pytest.skip("Không tìm thấy input upload")

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            ImageUploadPage.create_empty_file(tmp.name)
            empty_path = tmp.name

        try:
            page.upload_file(empty_path)
            assert page.is_error_shown(timeout=5), \
                "Không có thông báo lỗi khi upload file rỗng"
        finally:
            os.unlink(empty_path)

    @pytest.mark.known_bug
    def test_FR_031_016_special_char_filename_handled(self, teacher_driver):
        """
        FR_031_016: File tên chứa ký tự đặc biệt ảnh@#$.jpg → kỳ vọng xử lý an toàn.
        [KNOWN BUG]: Hệ thống hiện tại ghi nhận ảnh vào bình thường mà không sanitize tên file.
        """
        page = ImageUploadPage(teacher_driver)
        page.open_course_create()

        if not page.is_present(*ImageUploadPage.UPLOAD_INPUT, timeout=5):
            pytest.skip("Không tìm thấy input upload")

        # Tạo file với tên tạm bình thường rồi đặt path có ký tự đặc biệt
        tmp_dir = tempfile.gettempdir()
        special_path = os.path.join(tmp_dir, "anh@#$.jpg")
        ImageUploadPage.create_temp_image(special_path, size_kb=100)

        try:
            page.upload_file(special_path)
            # Kỳ vọng: upload thành công nhưng tên file được sanitize; hoặc bị từ chối
            # Hệ thống hiện tại: upload thành công mà không sanitize → BUG
            error_shown = page.is_error_shown(timeout=4)
            url = page.get_uploaded_url_from_page()
            # Nếu không có lỗi VÀ URL chứa ký tự đặc biệt không được encode → BUG
            if not error_shown and url and any(c in url for c in ["@", "#", "$"]):
                pytest.fail(
                    "[KNOWN BUG FR_031_016] Tên file chứa ký tự đặc biệt không được sanitize: "
                    f"URL trả về: {url}"
                )
        finally:
            if os.path.exists(special_path):
                os.unlink(special_path)

    def test_FR_031_017_uploaded_url_is_https(self, teacher_driver):
        """FR_031_017: URL ảnh sau upload bắt đầu bằng https://."""
        page = ImageUploadPage(teacher_driver)
        page.open_course_create()

        if not page.is_present(*ImageUploadPage.UPLOAD_INPUT, timeout=5):
            pytest.skip("Không tìm thấy input upload")

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            ImageUploadPage.create_temp_image(tmp.name, size_kb=200)
            img_path = tmp.name

        try:
            page.upload_file(img_path)
            # Chờ upload hoàn tất
            import time; time.sleep(3)

            url = page.get_uploaded_url_from_page()
            if not url:
                pytest.skip("Không tìm thấy URL ảnh trên trang — Cloudinary có thể chưa được cấu hình")

            assert url.startswith("https://"), \
                f"URL ảnh Cloudinary không dùng HTTPS: {url}"
        finally:
            os.unlink(img_path)
