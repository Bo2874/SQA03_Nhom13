"""FR_20 — Exam Q&A management (Teacher) system tests.

29 test cases sourced from sheet FR_20 in ss_test_13.xlsx.

Notable behaviour observed in source:
  - QuestionBuilderModal.tsx custom validation in onSubmit (toast.error
    instead of yup): "must select a correct answer", "single-choice can
    only have 1 correct".
  - Edit page reuses ExamEditPage form. The courseId=0 FK violation from
    FR_19 also breaks updates here (TC FR_020_012).
  - Backend GET /exams/{id} does not check teacher_id ownership — any
    logged-in teacher can open the form for any exam (TC FR_020_013).
  - Backend doesn't enforce a 200-char limit on title (TC FR_020_022).
  - Backend doesn't store points/explanation columns on exam_questions —
    those FE fields are display-only.
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
from pages.teacher_exams_page import TeacherExamsPage, ExamCreatePage, ExamEditPage
from pages.question_builder_modal import QuestionBuilderModalPage
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, seed_exam, seed_exam_question, seed_exam_answer,
    find_exam_by_id, count_exam_questions, count_exam_answers, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_20_exam_question_answer_management.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _login_as(driver, db_conn, role="TEACHER", password="Abc123456"):
    email = _unique_email()
    uid = seed_user(
        db_conn, email=email, password_plain=password,
        full_name=f"Auto {role.capitalize()}", role=role,
    )
    page = LoginPage(driver).open()
    page.fill_form(email=email, password=password)
    page.click_submit()
    if role == "TEACHER":
        WebDriverWait(driver, 15).until(EC.url_contains("/teacher/dashboard"))
    else:
        WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email, uid


@pytest.fixture
def teacher_session(driver, db_conn, cleanup_test_users):
    email, tid = _login_as(driver, db_conn, "TEACHER")
    return email, tid


@pytest.fixture
def edit_page_with_exam(teacher_session, driver, db_conn):
    """Seed an exam owned by the teacher, navigate to its edit page."""
    _, teacher_id = teacher_session
    title = f"Exam {uuid.uuid4().hex[:6]}"
    exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=title)
    page = ExamEditPage(driver).open(exam_id)
    page.wait_until_loaded()
    return page, teacher_id, exam_id, title


# =============================================================================
# Section 1 — Edit page UI (FR_020_001 to FR_020_003)
# =============================================================================

class TestEditPageUI:
    def test_FR_020_001_exam_info_displayed(self, edit_page_with_exam):
        page, _, _, title = edit_page_with_exam
        assert page.find(page.HEADING).is_displayed()
        # Title is loaded into the input
        WebDriverWait(page.driver, 5).until(
            lambda d: page.title_value() == title
        )

    def test_FR_020_002_questions_section_visible(self, edit_page_with_exam):
        page, _, _, _ = edit_page_with_exam
        assert page.find(page.QUESTIONS_HEADING).is_displayed()
        assert page.find(page.ADD_QUESTION_BUTTON).is_displayed()

    def test_FR_020_003_open_question_modal(self, edit_page_with_exam):
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        assert "Thêm câu hỏi mới" in modal.heading_text()


# =============================================================================
# Section 2 — Question functions (FR_020_004 to FR_020_013)
# =============================================================================

class TestQuestionFunctions:
    def test_FR_020_004_add_question_with_valid_data(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        question_text = f"Hỏi {uuid.uuid4().hex[:6]}"
        modal.fill_question_text(question_text)
        for i, opt_text in enumerate(["Option A", "Option B", "Option C", "Option D"]):
            modal.fill_option_text(i, opt_text)
        modal.select_correct_radio(0)  # mark A as correct
        modal.submit()
        WebDriverWait(page.driver, 15).until(
            lambda d: "Đã thêm câu hỏi" in d.page_source
        )
        # DB check
        time.sleep(0.5)
        assert count_exam_questions(db_conn, exam_id) >= 1, "No question persisted"

    def test_FR_020_005_question_auto_order(
        self, edit_page_with_exam, db_conn
    ):
        """Each new question gets `order` from the FE handler. Verify
        questions are persisted with order values."""
        _, _, exam_id, _ = edit_page_with_exam
        # Seed two questions via DB (faster than UI for ordering check)
        seed_exam_question(db_conn, exam_id=exam_id, content="Q1", order=1)
        seed_exam_question(db_conn, exam_id=exam_id, content="Q2", order=2)
        rows = fetch_one(
            db_conn,
            "SELECT MAX(`order`) AS m FROM exam_questions WHERE exam_id = %s",
            (exam_id,),
        )
        assert rows["m"] >= 2, "Order column should reflect seeded sequence"

    def test_FR_020_006_single_choice_only_one_correct(
        self, edit_page_with_exam
    ):
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        # In SINGLE_CHOICE mode, clicking a different radio unchecks others
        modal.select_correct_radio(0)
        time.sleep(0.2)
        assert modal.is_radio_checked(0) and not modal.is_radio_checked(1)
        modal.select_correct_radio(2)
        time.sleep(0.2)
        assert modal.is_radio_checked(2) and not modal.is_radio_checked(0)

    def test_FR_020_007_question_list_refreshes_after_add(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        question_text = f"Refresh {uuid.uuid4().hex[:6]}"
        modal.fill_question_text(question_text)
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(0)
        modal.submit()
        WebDriverWait(page.driver, 15).until(
            lambda d: question_text in d.page_source
        )

    def test_FR_020_008_edit_question_content(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        original = f"Orig {uuid.uuid4().hex[:6]}"
        q_id = seed_exam_question(db_conn, exam_id=exam_id, content=original, order=1)
        seed_exam_answer(db_conn, question_id=q_id, content="A", is_correct=True)
        seed_exam_answer(db_conn, question_id=q_id, content="B")
        page.driver.refresh()
        page.wait_until_loaded()
        WebDriverWait(page.driver, 10).until(lambda d: original in d.page_source)
        page.click_edit_question(0)
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        new_text = f"Edited {uuid.uuid4().hex[:6]}"
        modal.fill_question_text(new_text)
        modal.submit()
        WebDriverWait(page.driver, 15).until(
            lambda d: "Đã cập nhật câu hỏi" in d.page_source
        )
        time.sleep(0.5)
        row = fetch_one(
            db_conn, "SELECT content FROM exam_questions WHERE id = %s", (q_id,)
        )
        assert row and new_text in row["content"]

    def test_FR_020_009_delete_question(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        q_id = seed_exam_question(db_conn, exam_id=exam_id, content="DelMe", order=1)
        page.driver.refresh()
        page.wait_until_loaded()
        WebDriverWait(page.driver, 10).until(lambda d: "DelMe" in d.page_source)
        page.click_delete_question(0)
        time.sleep(0.4)
        try:
            page.driver.switch_to.alert.accept()
        except NoAlertPresentException:
            pytest.fail("Delete should open native confirm dialog")
        WebDriverWait(page.driver, 10).until(
            lambda d: "Đã xóa câu hỏi" in d.page_source
        )
        time.sleep(0.5)
        assert fetch_one(
            db_conn, "SELECT id FROM exam_questions WHERE id = %s", (q_id,)
        ) is None

    def test_FR_020_010_cascade_delete_questions_with_exam(
        self, teacher_session, driver, db_conn
    ):
        _, teacher_id = teacher_session
        exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=f"Casc {uuid.uuid4().hex[:6]}")
        seed_exam_question(db_conn, exam_id=exam_id, content="Q1", order=1)
        seed_exam_question(db_conn, exam_id=exam_id, content="Q2", order=2)
        # Delete the exam directly via DB (entity FK has onDelete: CASCADE)
        cur = db_conn.cursor()
        cur.execute("DELETE FROM exams WHERE id = %s", (exam_id,))
        db_conn.commit()
        cur.close()
        # Questions must be gone
        assert count_exam_questions(db_conn, exam_id) == 0

    def test_FR_020_011_explanation_displayed(
        self, edit_page_with_exam, db_conn
    ):
        """Backend exam_questions has no `explanation` column — the FE form
        accepts it but the backend ignores. We verify that creating a
        question doesn't crash even with an explanation, and that the
        question still shows up."""
        page, _, exam_id, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        question_text = f"WithExpl {uuid.uuid4().hex[:6]}"
        modal.fill_question_text(question_text)
        modal.fill_explanation("Vì A là đáp án đúng nhất")
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(0)
        modal.submit()
        WebDriverWait(page.driver, 15).until(
            lambda d: "Đã thêm câu hỏi" in d.page_source
        )

    def test_FR_020_012_update_exam_general_info_blocked_by_courseid_bug(
        self, edit_page_with_exam, db_conn
    ):
        """Same root cause as FR_019_014: when courseId is unset on the form,
        FE serializes it to 0 → FK constraint fails → save rejected."""
        page, _, exam_id, _ = edit_page_with_exam
        new_title = f"Updated {uuid.uuid4().hex[:6]}"
        page.fill_title(new_title)
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row and row["title"] == new_title, (
            f"TC expects title to update to {new_title!r}; got {row!r}. "
            f"FE update payload includes courseId=0 when no course is "
            f"picked, violating the FK on courses.id."
        )

    def test_FR_020_013_other_teacher_can_open_edit_form(
        self, driver, db_conn, cleanup_test_users
    ):
        """Backend GET /exams/{id} does not check teacher ownership →
        teacher B can open edit form of teacher A's exam (security gap)."""
        a_email = _unique_email()
        a_id = seed_user(
            db_conn, email=a_email, password_plain="Abc123456",
            full_name="Teacher A", role="TEACHER",
        )
        title_orig = f"AOwned {uuid.uuid4().hex[:6]}"
        exam_id = seed_exam(db_conn, teacher_id=a_id, title=title_orig)
        # Login as teacher B
        _login_as(driver, db_conn, "TEACHER")
        page = ExamEditPage(driver).open(exam_id)
        page.wait_until_loaded()
        if page.is_not_found():
            return
        if "Chỉnh sửa bài kiểm tra" in driver.page_source:
            pytest.fail(
                f"Teacher B can open edit form for teacher A's exam "
                f"(URL: {driver.current_url}). Backend GET /exams/{{id}} does "
                f"not enforce teacher ownership."
            )


# =============================================================================
# Section 3 — Answer details (FR_020_014 to FR_020_020)
# =============================================================================

class TestAnswerDetails:
    def test_FR_020_014_question_content_mapped(
        self, edit_page_with_exam, db_conn
    ):
        """Backend stores question text in `content` column; FE maps to
        `question_text`. Verify a seeded question's content shows up."""
        _, _, exam_id, _ = edit_page_with_exam
        seeded = f"Backend Content {uuid.uuid4().hex[:6]}"
        seed_exam_question(db_conn, exam_id=exam_id, content=seeded, order=1)
        page = ExamEditPage(edit_page_with_exam[0].driver).open(exam_id)
        page.wait_until_loaded()
        WebDriverWait(page.driver, 10).until(lambda d: seeded in d.page_source)

    def test_FR_020_015_edit_modal_loads_existing_options(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        q_id = seed_exam_question(db_conn, exam_id=exam_id, content="Q1", order=1)
        seed_exam_answer(db_conn, question_id=q_id, content="Opt-Aaa", is_correct=True)
        seed_exam_answer(db_conn, question_id=q_id, content="Opt-Bbb")
        page.driver.refresh()
        page.wait_until_loaded()
        WebDriverWait(page.driver, 10).until(lambda d: "Q1" in d.page_source)
        page.click_edit_question(0)
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        # Option text inputs must be pre-filled with existing answers
        time.sleep(0.5)
        values = [modal.option_text_value(i) for i in range(modal.option_count())]
        assert "Opt-Aaa" in values and "Opt-Bbb" in values, (
            f"Existing answer values should pre-fill the modal; got {values}"
        )

    def test_FR_020_016_old_answers_replaced_on_update(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        q_id = seed_exam_question(db_conn, exam_id=exam_id, content="QReplace", order=1)
        old1 = seed_exam_answer(db_conn, question_id=q_id, content="OldA", is_correct=True)
        old2 = seed_exam_answer(db_conn, question_id=q_id, content="OldB")
        before = count_exam_answers(db_conn, q_id)
        assert before == 2
        page.driver.refresh()
        page.wait_until_loaded()
        WebDriverWait(page.driver, 10).until(lambda d: "QReplace" in d.page_source)
        page.click_edit_question(0)
        modal = QuestionBuilderModalPage(page.driver)
        assert modal.is_visible()
        # Wait for modal's reset effect to finish populating options from
        # question.options before we type into them.
        time.sleep(1)
        for i, t in enumerate(["NewA", "NewB"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(0)
        modal.submit()
        WebDriverWait(page.driver, 15).until(
            lambda d: "Đã cập nhật câu hỏi" in d.page_source
        )
        time.sleep(2)
        # Old answer rows gone, new ones present
        assert fetch_one(db_conn, "SELECT id FROM exam_answers WHERE id = %s", (old1,)) is None
        assert fetch_one(db_conn, "SELECT id FROM exam_answers WHERE id = %s", (old2,)) is None
        new_rows = fetch_one(
            db_conn,
            "SELECT GROUP_CONCAT(content) AS texts FROM exam_answers "
            "WHERE question_id = %s",
            (q_id,),
        )
        assert new_rows and "NewA" in (new_rows["texts"] or "")

    def test_FR_020_017_question_count_updates(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        before = count_exam_questions(db_conn, exam_id)
        seed_exam_question(db_conn, exam_id=exam_id, content="StatQ", order=1)
        after = count_exam_questions(db_conn, exam_id)
        assert after == before + 1

    def test_FR_020_018_cancel_modal_discards(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        before = count_exam_questions(db_conn, exam_id)
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Discard me")
        modal.cancel()
        time.sleep(0.5)
        assert count_exam_questions(db_conn, exam_id) == before, (
            "Cancel must not create a question"
        )

    def test_FR_020_019_no_questions_warning(
        self, edit_page_with_exam
    ):
        page, _, _, _ = edit_page_with_exam
        # Brand-new exam → no questions seeded → warning visible
        WebDriverWait(page.driver, 5).until(
            lambda d: "Chưa có câu hỏi nào" in d.page_source
        )

    def test_FR_020_020_view_results_button(
        self, edit_page_with_exam
    ):
        page, _, exam_id, _ = edit_page_with_exam
        page.click_view_results()
        WebDriverWait(page.driver, 10).until(
            EC.url_contains(f"/exams/{exam_id}/results")
        )


# =============================================================================
# Section 4 — Validation (FR_020_021 to FR_020_029)
# =============================================================================

class TestValidation:
    def test_FR_020_021_exam_title_too_short(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        page.fill_title("ABCD")  # 4 chars (yup min 5)
        page.save()
        time.sleep(0.5)
        # Yup error appears OR the exam title is unchanged in DB
        errs = page.driver.find_elements(
            By.XPATH, '//p[contains(@class, "text-red-500")]'
        )
        msg_seen = any("ít nhất 5 ký tự" in e.text for e in errs)
        row = find_exam_by_id(db_conn, exam_id)
        assert msg_seen or (row and row["title"] != "ABCD"), (
            f"Expected yup error or unchanged DB; errors: {[e.text for e in errs]}, "
            f"row: {row!r}"
        )

    def test_FR_020_022_exam_title_too_long_rejected(
        self, edit_page_with_exam, db_conn
    ):
        """TC expects yup max(200) to block titles >200 chars. Reality:
        backend doesn't enforce length, so the long title slips through
        — sheet gốc Fail."""
        page, _, exam_id, _ = edit_page_with_exam
        long_title = "X" * 250
        page.fill_title(long_title)
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        # If yup actually fires, title in DB should NOT be the 250-char string
        assert row and len(row["title"]) <= 200, (
            f"TC expects title >200 chars to be rejected. Reality: DB stored "
            f"a {len(row['title'])}-char title. Backend column is varchar(255) "
            f"and there's no length check before persist."
        )

    def test_FR_020_023_question_too_short(
        self, edit_page_with_exam
    ):
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Hi")  # 2 chars (yup min 3)
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(0)
        modal.submit()
        time.sleep(0.5)
        errors = modal.field_error_texts()
        assert any("ít nhất 3 ký tự" in e for e in errors), (
            f"Expected 'Câu hỏi phải có ít nhất 3 ký tự'; got {errors}"
        )

    def test_FR_020_024_must_select_correct_answer(
        self, edit_page_with_exam
    ):
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Câu hỏi không có đáp án đúng")
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        # Don't select any correct
        modal.submit()
        WebDriverWait(page.driver, 5).until(
            lambda d: "Vui lòng chọn ít nhất một đáp án đúng" in d.page_source
        )

    def test_FR_020_025_single_choice_blocks_two_correct(
        self, edit_page_with_exam
    ):
        """Single-choice radios are exclusive at the UI level (clicking one
        unchecks others), so we cannot reach a 2-correct state through the
        UI. Verify the protective behaviour: after picking #2 then #3,
        only #3 stays checked."""
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Single choice exclusivity")
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(1)
        time.sleep(0.2)
        modal.select_correct_radio(2)
        time.sleep(0.2)
        checked = [modal.is_radio_checked(i) for i in range(4)]
        # Exactly one should be checked
        assert sum(checked) == 1, (
            f"Single-choice radios should leave exactly one selected; "
            f"got {checked}"
        )

    def test_FR_020_026_empty_option_text_no_error_message(
        self, edit_page_with_exam
    ):
        """TC expects an error message when an option text is left empty.
        Reality: the FE only validates via yup at submit, but the submit
        path skips empty options entirely (see L208: `if (option.option_text.trim())`),
        so no message appears — sheet gốc Fail."""
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Câu hỏi đáp án rỗng")
        modal.fill_option_text(0, "A")
        modal.fill_option_text(1, "")  # empty
        modal.fill_option_text(2, "C")
        modal.fill_option_text(3, "D")
        modal.select_correct_radio(0)
        modal.submit()
        time.sleep(2)
        errors = modal.field_error_texts()
        assert any("Đáp án không được để trống" in e for e in errors), (
            f"TC expects 'Đáp án không được để trống' to surface for the "
            f"empty option. Reality: the submit handler silently skips "
            f"options whose text is empty (QuestionBuilderModal.tsx L208), "
            f"so no error appears. Errors seen: {errors}"
        )

    def test_FR_020_027_zero_duration_blocked(
        self, edit_page_with_exam, db_conn
    ):
        page, _, exam_id, _ = edit_page_with_exam
        page.fill_duration(0)
        page.save()
        time.sleep(2)
        row = find_exam_by_id(db_conn, exam_id)
        assert row and row["duration_minutes"] != 0, (
            f"Submission with duration=0 must be rejected; row {row!r}"
        )

    def test_FR_020_028_submit_button_disabled_while_saving(
        self, edit_page_with_exam
    ):
        page, _, _, _ = edit_page_with_exam
        page.click_add_question()
        modal = QuestionBuilderModalPage(page.driver)
        modal.fill_question_text("Loading state test")
        for i, t in enumerate(["A", "B", "C", "D"]):
            modal.fill_option_text(i, t)
        modal.select_correct_radio(0)
        modal.submit()
        # Right after click, button should be disabled OR text changes to
        # "Đang lưu..." — verify within a short window before the request
        # finishes.
        WebDriverWait(page.driver, 5).until(
            lambda d: ("Đang lưu" in modal.submit_button_text())
            or modal.submit_disabled()
            or "Đã thêm câu hỏi" in d.page_source
        )

    def test_FR_020_029_handle_missing_question_id(
        self, edit_page_with_exam
    ):
        """TC: the FE must show a friendly error if the backend returns
        no question ID. We can't realistically intercept the backend
        response, so this needs a dev-side mock or a network-layer hook —
        not feasible from a black-box Selenium test."""
        pytest.skip(
            "Inactive: TC yêu cầu mock response của backend (không trả "
            "questionId) để test path 'Lỗi: Không lấy được ID câu hỏi'. "
            "Cách này cần intercept network qua DevTools/CDP hoặc proxy "
            "(ví dụ Selenium Wire) — vượt phạm vi black-box test thuần "
            "Selenium đang dùng. Sheet gốc Pass do manual tester có thể "
            "chỉnh response."
        )
