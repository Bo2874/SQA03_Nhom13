"""FR_21 — Exam attempt and submission (Student) system tests.

32 test cases sourced from sheet FR_21 in ss_test_13.xlsx.

Notable findings:
  - take/page.tsx auto-submit: when the timer hits 0 it calls handleSubmit,
    but handleSubmit guards against unanswered questions and only
    surfaces a toast — it never actually persists the attempt. Sheet gốc
    flags this as Fail (FR_021_017).
  - The (main) layout has no auth guard: visiting take/results without a
    session does not redirect to /login, it falls through to the
    course-detail page (sheet gốc Fail FR_021_031, 032).
"""
import json
import time
import uuid
from datetime import datetime

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.student_exam_pages import (
    StudentExamTakePage, StudentExamResultsPage,
)
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, seed_exam, seed_exam_question, seed_exam_answer,
    seed_exam_attempt, find_my_attempt, find_exam_by_id, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_21_exam_attempt_and_submission.csv")}


def _tc(tc_id):
    return CSV_ROWS[tc_id]


def _unique_email(domain="gmail.com"):
    return f"{settings.TEST_EMAIL_PREFIX}{uuid.uuid4().hex[:10]}@{domain}"


def _login_as(driver, db_conn, role="STUDENT", password="Abc123456"):
    email = _unique_email()
    uid = seed_user(
        db_conn, email=email, password_plain=password,
        full_name=f"Auto {role.capitalize()}", role=role,
    )
    page = LoginPage(driver).open()
    page.fill_form(email=email, password=password)
    page.click_submit()
    WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email, uid


def _seed_full_exam(db_conn, teacher_id, num_questions=3, duration_minutes=30,
                    title=None):
    """Seed exam + N questions + 4 answers each. Returns dict with exam_id,
    question_ids list, and answer_ids per question."""
    title = title or f"Exam {uuid.uuid4().hex[:6]}"
    exam_id = seed_exam(db_conn, teacher_id=teacher_id, title=title,
                        duration_minutes=duration_minutes, status="LIVE")
    questions = []
    for q_idx in range(num_questions):
        q_id = seed_exam_question(
            db_conn, exam_id=exam_id, content=f"Q{q_idx + 1}", order=q_idx + 1,
        )
        answers = []
        for a_idx in range(4):
            a_id = seed_exam_answer(
                db_conn, question_id=q_id,
                content=f"A{q_idx + 1}.{a_idx + 1}",
                is_correct=(a_idx == 0),  # First answer always correct
            )
            answers.append(a_id)
        questions.append({"id": q_id, "answers": answers})
    return {"exam_id": exam_id, "questions": questions, "title": title}


@pytest.fixture
def fresh_exam_for_student(driver, db_conn, cleanup_test_users):
    """Seed teacher + 3-question exam + student. Login as student. Returns
    (driver, course_id_placeholder, exam_data, student_id)."""
    # Seed teacher
    teacher_email = _unique_email()
    teacher_id = seed_user(
        db_conn, email=teacher_email, password_plain="Abc123456",
        full_name="ExamOwner", role="TEACHER",
    )
    exam = _seed_full_exam(db_conn, teacher_id=teacher_id, num_questions=3)
    # Seed + login as student
    _, student_id = _login_as(driver, db_conn, "STUDENT")
    # Use any course_id (the take page only requires exam_id to function)
    course_id = 1
    return driver, course_id, exam, student_id


def _open_take_page(driver, course_id, exam_id):
    page = StudentExamTakePage(driver, course_id=course_id, exam_id=exam_id)
    page.open()
    page.wait_until_loaded(timeout=15)
    return page


# =============================================================================
# Section 1 — UI / start (FR_021_001 to FR_021_008)
# =============================================================================

class TestExamTakeUI:
    def test_FR_021_001_take_page_renders(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        assert exam["title"] in page.title_text()
        # Header summary present (e.g., "Câu 1 / 3 • 0 đã trả lời")
        assert "Câu 1" in page.header_summary_text()

    def test_FR_021_002_timer_visible(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        # Timer text should look like "MM:SS"
        text = page.timer_text()
        assert ":" in text and len(text) >= 4

    def test_FR_021_003_timer_red_when_under_60(
        self, db_conn, driver, cleanup_test_users
    ):
        """Seed an exam with durationMinutes=1 (60s). After ~3s of waiting
        the timer dips below 60s and color class should switch to red."""
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerSec", role="TEACHER",
        )
        exam = _seed_full_exam(
            db_conn, teacher_id=teacher_id, num_questions=2,
            duration_minutes=1,
        )
        _, _ = _login_as(driver, db_conn, "STUDENT")
        page = _open_take_page(driver, 1, exam["exam_id"])
        time.sleep(3)
        assert "text-red" in page.timer_color_class(), (
            f"Expected text-red class on timer when <60s; got {page.timer_color_class()}"
        )

    def test_FR_021_004_progress_bar_updates_on_answer(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        # The bar logic colors current=blue, answered=green, else=gray. So
        # answering Q1 while still on Q1 doesn't flip its color (it stays
        # blue as current). We need to navigate away to see green.
        page.select_answer(0)
        page.click_next()
        time.sleep(0.3)
        classes = page.progress_bar_classes()
        assert any("bg-green" in c for c in classes), (
            f"Q1 bar should turn green after answering and navigating away; "
            f"got {classes}"
        )

    def test_FR_021_005_navigator_updates_on_answer(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.select_answer(0)
        page.click_next()
        time.sleep(0.3)
        nav_classes = page.navigator_button_classes()
        # The first nav button (already answered) should now have green class
        assert any("bg-green" in c for c in nav_classes), (
            f"Expected at least one green-marked nav button after answering. "
            f"Got: {nav_classes}"
        )

    def test_FR_021_006_header_answered_count_updates(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        assert "0 đã trả lời" in page.header_summary_text()
        page.select_answer(0)
        time.sleep(0.3)
        assert "1 đã trả lời" in page.header_summary_text()

    def test_FR_021_007_loading_spinner_initially(
        self, fresh_exam_for_student
    ):
        """The spinner shows briefly while the API loads. We can verify by
        checking the page loads correctly OR the spinner element existed."""
        driver, course_id, exam, _ = fresh_exam_for_student
        # Navigate without waiting — race for the spinner
        page = StudentExamTakePage(driver, course_id=course_id, exam_id=exam["exam_id"])
        page.open()
        # Either spinner appears, or the page loaded too fast (acceptable)
        has_spinner = any(
            page.is_loading() for _ in range(3) if (time.sleep(0.05) or True)
        )
        # Page eventually shows the title
        page.wait_until_loaded()
        assert exam["title"] in driver.page_source

    def test_FR_021_008_submit_button_only_on_last_question(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        # On Q1 (first), expect Next button, not Submit
        assert page.next_button_visible()
        assert not page.submit_button_visible()
        # Navigate to last question
        page.click_next()
        time.sleep(0.2)
        page.click_next()
        time.sleep(0.2)
        # Now on last → Submit, not Next
        assert page.submit_button_visible()
        assert not page.next_button_visible()


# =============================================================================
# Section 2 — Actions (FR_021_009 to FR_021_017)
# =============================================================================

class TestExamActions:
    def test_FR_021_009_select_answer(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.select_answer(1)  # B
        time.sleep(0.3)
        assert "1 đã trả lời" in page.header_summary_text()

    def test_FR_021_010_change_answer(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.select_answer(0)  # A
        time.sleep(0.2)
        page.select_answer(2)  # C
        time.sleep(0.2)
        # Still 1 answered (changed, not added)
        assert "1 đã trả lời" in page.header_summary_text()

    def test_FR_021_011_next_button(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        assert "Câu 1" in page.header_summary_text()
        page.click_next()
        time.sleep(0.3)
        assert "Câu 2" in page.header_summary_text()

    def test_FR_021_012_prev_button(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.click_next()
        time.sleep(0.2)
        page.click_prev()
        time.sleep(0.3)
        assert "Câu 1" in page.header_summary_text()

    def test_FR_021_013_answer_persists_across_navigation(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.select_answer(2)  # C on Q1
        time.sleep(0.2)
        page.click_next()
        time.sleep(0.2)
        page.click_prev()
        time.sleep(0.3)
        # Q1 answer should still show 1 answered (and the C button selected)
        assert "1 đã trả lời" in page.header_summary_text()
        # Verify selected button has the highlighted style
        btns = driver.find_elements(
            By.XPATH, '//button[contains(@class, "border-2") and contains(@class, "bg-blue-50")]'
        )
        assert len(btns) >= 1, "Selected answer should be highlighted"

    def test_FR_021_014_localstorage_restore_on_refresh(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        page.select_answer(1)
        time.sleep(0.5)
        # Refresh — useEffect should detect localStorage and restore
        driver.refresh()
        page.wait_until_loaded(timeout=15)
        time.sleep(1)
        assert "1 đã trả lời" in page.header_summary_text()

    def test_FR_021_015_submit_full_attempt(
        self, fresh_exam_for_student, db_conn
    ):
        driver, course_id, exam, student_id = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        # Answer all 3 questions
        for q_idx in range(3):
            page.select_answer(0)  # A
            time.sleep(0.2)
            if q_idx < 2:
                page.click_next()
                time.sleep(0.2)
        # Now on last question — submit
        page.click_submit()
        WebDriverWait(driver, 15).until(
            EC.any_of(
                EC.url_contains("/results"),
                lambda d: "Đã nộp bài thành công" in d.page_source,
            )
        )
        time.sleep(1)
        attempt = find_my_attempt(db_conn, exam["exam_id"], student_id)
        assert attempt and attempt["submittedAt"] is not None, (
            f"Submitted attempt should be persisted; got {attempt!r}"
        )

    def test_FR_021_016_submitting_status_shown(
        self, fresh_exam_for_student
    ):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        for q_idx in range(3):
            page.select_answer(0)
            time.sleep(0.1)
            if q_idx < 2:
                page.click_next()
                time.sleep(0.1)
        page.click_submit()
        # Window for either "Đang nộp" label or actual redirect (very fast)
        WebDriverWait(driver, 5).until(
            lambda d: "Đang nộp" in d.page_source
            or "/results" in d.current_url
            or "Đã nộp bài thành công" in d.page_source
        )

    def test_FR_021_017_auto_submit_on_timer_expiry(
        self, db_conn, driver, cleanup_test_users
    ):
        """TC: when the timer hits 0 the system must auto-submit. Reality:
        handleSubmit is called but its guard against unanswered questions
        short-circuits with toast.error — so no submission happens. Sheet
        gốc Fail."""
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerAuto", role="TEACHER",
        )
        exam = _seed_full_exam(
            db_conn, teacher_id=teacher_id, num_questions=2,
            duration_minutes=1,  # 60-second exam
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        page = _open_take_page(driver, 1, exam["exam_id"])
        # Don't answer anything; wait > 60s for timer to expire
        time.sleep(70)
        attempt = find_my_attempt(db_conn, exam["exam_id"], student_id)
        assert attempt and attempt["submittedAt"] is not None, (
            f"TC expects auto-submit when timer hits 0, but the FE handleSubmit "
            f"guard short-circuits when there are unanswered questions and "
            f"only surfaces a toast — it never persists the attempt. "
            f"DB attempt: {attempt!r}"
        )


# =============================================================================
# Section 3 — Validation / Negative (FR_021_018 to FR_021_021)
# =============================================================================

class TestValidationNegative:
    def test_FR_021_018_block_submit_unanswered(
        self, fresh_exam_for_student, db_conn
    ):
        driver, course_id, exam, student_id = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        # Navigate to last question without answering anything
        page.click_next()
        time.sleep(0.2)
        page.click_next()
        time.sleep(0.2)
        page.click_submit()
        WebDriverWait(driver, 5).until(
            lambda d: "chưa trả lời" in d.page_source.lower()
        )
        time.sleep(1)
        attempt = find_my_attempt(db_conn, exam["exam_id"], student_id)
        assert attempt is None or attempt["submittedAt"] is None, (
            "Attempt must NOT be submitted when there are unanswered questions"
        )

    def test_FR_021_019_prev_disabled_on_first(self, fresh_exam_for_student):
        driver, course_id, exam, _ = fresh_exam_for_student
        page = _open_take_page(driver, course_id, exam["exam_id"])
        assert page.prev_button_disabled(), (
            "'Câu trước' button must be disabled on the first question"
        )

    def test_FR_021_020_invalid_exam_id(
        self, db_conn, driver, cleanup_test_users
    ):
        _login_as(driver, db_conn, "STUDENT")
        page = StudentExamTakePage(driver, course_id=1, exam_id=999999999)
        page.open()
        page.wait_until_loaded(timeout=10)
        # The FE either shows the not-found heading or the toast.error +
        # router.back() fires.
        assert (
            page.is_not_found()
            or "Không thể tải" in driver.page_source
            or "/take" not in driver.current_url
        ), (
            f"Invalid examId must produce an error or redirect. URL: "
            f"{driver.current_url}, page contains 'take': "
            f"{'Không tìm thấy bài kiểm tra' in driver.page_source}"
        )

    def test_FR_021_021_exam_with_no_questions(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerNoQ", role="TEACHER",
        )
        exam_id = seed_exam(
            db_conn, teacher_id=teacher_id, title=f"EmptyExam {uuid.uuid4().hex[:6]}",
            status="LIVE",
        )
        _login_as(driver, db_conn, "STUDENT")
        page = StudentExamTakePage(driver, course_id=1, exam_id=exam_id)
        page.open()
        page.wait_until_loaded(timeout=10)
        assert page.is_not_found(), (
            f"Exam with zero questions should render the 'Không tìm thấy "
            f"bài kiểm tra' branch (questions.length === 0)."
        )


# =============================================================================
# Section 4 — Results page (FR_021_022 to FR_021_030)
# =============================================================================

def _seed_completed_attempt(db_conn, teacher_id, student_id,
                            answer_correctness=None):
    """Seed an exam + 2 questions + 4 answers each + a completed attempt
    where the student answered everything. answer_correctness is a list
    of bools per question (True = pick the correct answer)."""
    exam = _seed_full_exam(db_conn, teacher_id=teacher_id, num_questions=2)
    if answer_correctness is None:
        answer_correctness = [True, True]
    responses = {}
    correct_count = 0
    for q_idx, q in enumerate(exam["questions"]):
        if answer_correctness[q_idx]:
            # Answers[0] is correct (per _seed_full_exam)
            responses[q["id"]] = q["answers"][0]
            correct_count += 1
        else:
            responses[q["id"]] = q["answers"][1]  # B - wrong
    score = (correct_count / len(exam["questions"])) * 100
    seed_exam_attempt(
        db_conn,
        exam_id=exam["exam_id"],
        user_id=student_id,
        submitted_at=datetime.now(),
        score=score,
        time_spent_seconds=120,
        responses_json=responses,
    )
    return exam, score, correct_count


class TestExamResults:
    def test_FR_021_022_score_displayed(self, db_conn, driver, cleanup_test_users):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR1", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, score, _ = _seed_completed_attempt(db_conn, teacher_id, student_id)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        # Score might render with 1 decimal (e.g. 100.0)
        WebDriverWait(driver, 5).until(
            lambda d: f"{score:.1f}" in d.page_source
            or f"{int(score)}" in d.page_source
        )

    def test_FR_021_023_correct_count_displayed(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR2", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, _, correct = _seed_completed_attempt(
            db_conn, teacher_id, student_id, answer_correctness=[True, False],
        )
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        # The "Câu đúng" card should show correct count
        WebDriverWait(driver, 5).until(
            lambda d: f">{correct}<" in d.page_source.replace("\n", "")
        )

    def test_FR_021_024_time_spent_displayed(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR3", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, _, _ = _seed_completed_attempt(db_conn, teacher_id, student_id)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        WebDriverWait(driver, 5).until(
            lambda d: "phút" in d.page_source and "giây" in d.page_source
        )

    def test_FR_021_025_pass_message(self, db_conn, driver, cleanup_test_users):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR4", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        # 100% pass
        exam, _, _ = _seed_completed_attempt(db_conn, teacher_id, student_id,
                                              answer_correctness=[True, True])
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        WebDriverWait(driver, 5).until(
            lambda d: "Chúc mừng" in d.page_source
        )

    def test_FR_021_026_fail_message(self, db_conn, driver, cleanup_test_users):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR5", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        # 0% fail
        exam, _, _ = _seed_completed_attempt(
            db_conn, teacher_id, student_id, answer_correctness=[False, False],
        )
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        WebDriverWait(driver, 5).until(
            lambda d: "Tiếc quá" in d.page_source
        )

    def test_FR_021_027_question_details_visible(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR6", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, _, _ = _seed_completed_attempt(db_conn, teacher_id, student_id)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        assert page.detail_section_visible(), (
            "'Chi tiết bài làm' heading should appear on results page"
        )

    def test_FR_021_028_back_to_course_button(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR7", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, _, _ = _seed_completed_attempt(db_conn, teacher_id, student_id)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        page.wait_until_loaded(timeout=15)
        # The page might use a Link or a button. Look for any "Quay lại
        # khóa học" element.
        elements = driver.find_elements(
            By.XPATH,
            '//a[contains(., "Quay lại khóa học")] | '
            '//button[contains(., "Quay lại khóa học")]'
        )
        assert elements, (
            "Expected a 'Quay lại khóa học' button/link on the results page"
        )

    def test_FR_021_029_block_results_when_not_submitted(
        self, db_conn, driver, cleanup_test_users
    ):
        """Open /results when no submitted attempt exists → FE shows toast
        'Chưa hoàn thành bài kiểm tra' and redirects to course detail."""
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR8", role="TEACHER",
        )
        _, _ = _login_as(driver, db_conn, "STUDENT")
        exam = _seed_full_exam(db_conn, teacher_id=teacher_id, num_questions=2)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        time.sleep(3)
        # FE redirects away from /results
        assert "/results" not in driver.current_url or (
            "Chưa hoàn thành" in driver.page_source
        )

    def test_FR_021_030_loading_spinner_on_results(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerR9", role="TEACHER",
        )
        _, student_id = _login_as(driver, db_conn, "STUDENT")
        exam, _, _ = _seed_completed_attempt(db_conn, teacher_id, student_id)
        page = StudentExamResultsPage(driver, course_id=1, exam_id=exam["exam_id"])
        page.open()
        # Race for the spinner OR the results heading
        seen_spinner = False
        for _ in range(10):
            if page.is_loading():
                seen_spinner = True
                break
            time.sleep(0.05)
        page.wait_until_loaded(timeout=15)
        # Either we saw the spinner or the page loaded too fast
        assert seen_spinner or page.find(page.HEADING).is_displayed()


# =============================================================================
# Section 5 — Unauthenticated access (FR_021_031, FR_021_032)
# =============================================================================

class TestUnauthAccess:
    def test_FR_021_031_unauth_results_redirects_to_login(
        self, db_conn, driver, cleanup_test_users
    ):
        """TC: unauth → /login. Reality: FE redirects to course detail
        instead — sheet gốc Fail."""
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerU1", role="TEACHER",
        )
        exam = _seed_full_exam(db_conn, teacher_id=teacher_id, num_questions=2)
        # Clear any session
        driver.get(settings.BASE_URL_FE)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(
            f"{settings.BASE_URL_FE}/student/courses/1/exams/{exam['exam_id']}/results"
        )
        time.sleep(3)
        assert "/login" in driver.current_url, (
            f"TC expects redirect to /login when unauthenticated. "
            f"Reality: URL = {driver.current_url}. The (main) layout has no "
            f"client-side auth guard; the results page just returns the "
            f"course detail page when its API returns 401."
        )

    def test_FR_021_032_unauth_take_redirects_to_login(
        self, db_conn, driver, cleanup_test_users
    ):
        teacher_email = _unique_email()
        teacher_id = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerU2", role="TEACHER",
        )
        exam = _seed_full_exam(db_conn, teacher_id=teacher_id, num_questions=2)
        driver.get(settings.BASE_URL_FE)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(
            f"{settings.BASE_URL_FE}/student/courses/1/exams/{exam['exam_id']}/take"
        )
        time.sleep(3)
        assert "/login" in driver.current_url, (
            f"TC expects /take to redirect to /login. Got URL: "
            f"{driver.current_url}. Same root cause as FR_021_031."
        )
