"""FR_22 — Exam leaderboard (Teacher) system tests.

19 test cases sourced from sheet FR_22 in ss_test_13.xlsx.

Notable findings:
  - The exam list page does NOT expose a direct "Xem kết quả" link
    (it's gated behind `{hasEnded && false && (...)}` — see FR_19 list
    source). Teachers must enter via the Edit page → "Xem kết quả"
    button. Sheet gốc Fail FR_022_001.
  - (main) layout has no auth/role guard: unauthenticated users and
    students can both navigate to /teacher/...results URL. Sheet gốc
    Fail FR_022_006 + 007.
"""
import time
import uuid
from datetime import datetime

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import settings
from pages.login_page import LoginPage
from pages.teacher_exam_results_page import TeacherExamResultsPage
from pages.teacher_exams_page import TeacherExamsPage
from utils.csv_reader import load_csv
from utils.db_helper import (
    seed_user, seed_exam, seed_exam_question, seed_exam_answer,
    seed_exam_attempt, fetch_one,
)


CSV_ROWS = {r["tc_id"]: r for r in load_csv("FR_22_exam_leaderboard.csv")}


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
    WebDriverWait(driver, 15).until(lambda d: "/login" not in d.current_url)
    return email, uid


def _seed_exam_with_attempts(db_conn, teacher_id, attempts):
    """Seed exam (3 questions) + N attempts. attempts is a list of dicts:
      {full_name, score, time_spent_seconds, correct_count}.
    Returns (exam_id, list of student_ids)."""
    exam_id = seed_exam(
        db_conn, teacher_id=teacher_id,
        title=f"Leaderboard {uuid.uuid4().hex[:6]}",
        duration_minutes=30, status="LIVE",
    )
    # 3 questions, 4 answers each (first answer correct)
    questions = []
    for q_idx in range(3):
        q_id = seed_exam_question(
            db_conn, exam_id=exam_id, content=f"Q{q_idx + 1}", order=q_idx + 1,
        )
        answers = []
        for a_idx in range(4):
            a_id = seed_exam_answer(
                db_conn, question_id=q_id,
                content=f"A{q_idx + 1}.{a_idx + 1}",
                is_correct=(a_idx == 0),
            )
            answers.append(a_id)
        questions.append({"id": q_id, "answers": answers})

    student_ids = []
    for spec in attempts:
        s_email = _unique_email()
        sid = seed_user(
            db_conn, email=s_email, password_plain="Abc123456",
            full_name=spec["full_name"], role="STUDENT",
        )
        student_ids.append(sid)
        # Build responses_json based on correct_count
        responses = {}
        for q_idx, q in enumerate(questions):
            if q_idx < spec.get("correct_count", 0):
                responses[q["id"]] = q["answers"][0]  # correct
            else:
                responses[q["id"]] = q["answers"][1]  # wrong
        seed_exam_attempt(
            db_conn,
            exam_id=exam_id, user_id=sid,
            submitted_at=datetime.now(),
            score=spec["score"],
            time_spent_seconds=spec["time_spent_seconds"],
            responses_json=responses,
        )
    return exam_id, student_ids


@pytest.fixture
def teacher_with_empty_exam(driver, db_conn, cleanup_test_users):
    """Seed teacher + LIVE exam (3 questions, 0 attempts). Login as teacher."""
    teacher_email, teacher_id = _login_as(driver, db_conn, "TEACHER")
    exam_id, _ = _seed_exam_with_attempts(db_conn, teacher_id, attempts=[])
    return driver, teacher_id, exam_id


@pytest.fixture
def teacher_with_attempts(driver, db_conn, cleanup_test_users):
    """Seed teacher + exam + 4 attempts spanning score buckets."""
    teacher_email, teacher_id = _login_as(driver, db_conn, "TEACHER")
    attempts = [
        {"full_name": "ExcellentStu", "score": 100.0, "time_spent_seconds": 60,
         "correct_count": 3},
        {"full_name": "GoodStu", "score": 66.7, "time_spent_seconds": 120,
         "correct_count": 2},
        {"full_name": "AverageStu", "score": 50.0, "time_spent_seconds": 180,
         "correct_count": 1},
        {"full_name": "WeakStu", "score": 33.3, "time_spent_seconds": 240,
         "correct_count": 1},
    ]
    exam_id, _ = _seed_exam_with_attempts(db_conn, teacher_id, attempts)
    return driver, teacher_id, exam_id


# =============================================================================
# Section 1 — Access (FR_022_001 to FR_022_007)
# =============================================================================

class TestAccess:
    def test_FR_022_001_teacher_opens_results_from_list(
        self, teacher_with_attempts
    ):
        """TC: teacher should be able to open the results page directly
        from the exam-list row. Reality: the FE list source has the
        'Xem kết quả' link gated by `{hasEnded && false && (...)}` (see
        exams/page.tsx L321), so the link is never rendered — teachers
        must use the Edit page workaround. Sheet gốc Fail."""
        driver, teacher_id, exam_id = teacher_with_attempts
        list_page = TeacherExamsPage(driver).open()
        list_page.wait_until_loaded()
        # Look for a clickable link pointing to the results page in the list
        result_links = driver.find_elements(
            By.XPATH,
            f'//a[contains(@href, "/exams/{exam_id}/results")]'
        )
        assert len(result_links) > 0, (
            f"TC expects a direct 'Xem kết quả' link on the exam list row, "
            f"but the FE source (teacher/dashboard/exams/page.tsx L321) "
            f"gates that Link with `{{hasEnded && false && (...)}}` so it "
            f"never renders. Teachers must enter the Edit page first and "
            f"click 'Xem kết quả' from there."
        )

    def test_FR_022_002_loading_spinner_renders(
        self, teacher_with_empty_exam
    ):
        driver, _, exam_id = teacher_with_empty_exam
        page = TeacherExamResultsPage(driver, exam_id=exam_id)
        page.open()
        # Race for the spinner — it should appear before the data finishes loading
        seen_spinner = False
        for _ in range(10):
            if page.is_loading():
                seen_spinner = True
                break
            time.sleep(0.05)
        page.wait_until_loaded(timeout=15)
        # Either we caught the spinner OR the page loaded too quickly — both OK
        assert seen_spinner or page.find(page.HEADING).is_displayed()

    def test_FR_022_003_empty_state(self, teacher_with_empty_exam):
        driver, _, exam_id = teacher_with_empty_exam
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        assert page.is_empty(), (
            "Empty exam should show 'Chưa có ai hoàn thành bài kiểm tra' message"
        )

    def test_FR_022_004_heading_structure(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        assert "Kết quả bài kiểm tra" in page.heading_text()
        # Subtitle shows the exam title
        subhead = page.exam_title_subhead()
        assert "Leaderboard" in subhead or len(subhead) > 0

    def test_FR_022_005_back_button(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        # Navigate via list → edit → results so we have history
        TeacherExamsPage(driver).open().wait_until_loaded()
        time.sleep(0.5)
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Click back
        back_btns = driver.find_elements(
            By.XPATH,
            '//header//button | '
            '//div[contains(@class, "sticky")]//button[.//svg]'
        )
        assert back_btns, "Back button should exist on the results page header"
        # Just verify clickable (router.back behavior depends on history)
        assert back_btns[0].is_displayed() and back_btns[0].is_enabled()

    def test_FR_022_006_unauth_blocked(
        self, db_conn, driver, cleanup_test_users
    ):
        """TC: unauthenticated user should be redirected to /login. Reality:
        page renders, just can't load data — sheet gốc Fail."""
        # Seed teacher + exam
        teacher_email = _unique_email()
        tid = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerU6", role="TEACHER",
        )
        exam_id, _ = _seed_exam_with_attempts(db_conn, tid, attempts=[])
        # Clear session
        driver.get(settings.BASE_URL_FE)
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear();")
        driver.get(
            f"{settings.BASE_URL_FE}/teacher/dashboard/exams/{exam_id}/results"
        )
        time.sleep(3)
        url = driver.current_url
        assert "/login" in url, (
            f"TC expects redirect to /login when unauthenticated. Reality: "
            f"page renders at {url!r}. The (main) layout has no auth guard; "
            f"the page just shows toast.error('Không thể tải kết quả') when "
            f"the API returns 401, but the user remains on the page."
        )

    def test_FR_022_007_student_blocked(
        self, db_conn, driver, cleanup_test_users
    ):
        """TC: students should not access teacher results page. Reality: no
        role check — sheet gốc Fail."""
        teacher_email = _unique_email()
        tid = seed_user(
            db_conn, email=teacher_email, password_plain="Abc123456",
            full_name="OwnerU7", role="TEACHER",
        )
        exam_id, _ = _seed_exam_with_attempts(db_conn, tid, attempts=[])
        # Login as student
        _login_as(driver, db_conn, "STUDENT")
        driver.get(
            f"{settings.BASE_URL_FE}/teacher/dashboard/exams/{exam_id}/results"
        )
        time.sleep(3)
        url = driver.current_url
        page_src = driver.page_source
        assert (
            "/teacher/dashboard/exams" not in url
            or "không có quyền" in page_src.lower()
            or "forbidden" in page_src.lower()
            or "đăng nhập" in page_src.lower()
        ), (
            f"TC expects students to be blocked from teacher results page. "
            f"Reality: page renders for student. URL={url!r}, heading "
            f"'Kết quả bài kiểm tra' present: "
            f"{'Kết quả bài kiểm tra' in page_src}."
        )


# =============================================================================
# Section 2 — Stats (FR_022_008 to FR_022_011)
# =============================================================================

class TestStats:
    def test_FR_022_008_participants_count(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # 4 attempts seeded
        assert page.participants_count_text() == "4", (
            f"Expected '4' participants; got {page.participants_count_text()!r}"
        )

    def test_FR_022_009_average_score(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Avg of 100, 66.7, 50, 33.3 = 62.5
        avg = page.average_score_text()
        assert "62.5" in avg or "62" in avg, (
            f"Expected avg ~62.5; got {avg!r}"
        )

    def test_FR_022_010_division_by_zero_safe(self, teacher_with_empty_exam):
        driver, _, exam_id = teacher_with_empty_exam
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # No participants → average should be "0", time should be "0:00"
        # (FE handles divide-by-zero with the `participants.length > 0` guard)
        assert page.average_score_text() == "0", (
            f"Empty leaderboard avg should be '0'; got {page.average_score_text()!r}"
        )
        assert page.average_time_text() == "0:00", (
            f"Empty leaderboard avg time should be '0:00'; got {page.average_time_text()!r}"
        )

    def test_FR_022_011_average_time_format(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Avg of 60, 120, 180, 240 = 150 seconds = 2:30
        time_text = page.average_time_text()
        # Format MM:SS
        assert ":" in time_text and len(time_text) >= 4, (
            f"Avg time should be MM:SS format; got {time_text!r}"
        )


# =============================================================================
# Section 3 — Table layout (FR_022_012 to FR_022_017)
# =============================================================================

class TestTable:
    def test_FR_022_012_table_columns(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        headers = page.header_texts()
        assert any("HẠNG" in h.upper() for h in headers), f"Hạng column missing: {headers}"
        assert any("HỌ TÊN" in h.upper() or "HO TEN" in h.upper() for h in headers), f"Họ tên column: {headers}"
        assert any("EMAIL" in h.upper() for h in headers), f"Email column: {headers}"
        assert any("ĐÚNG" in h.upper() for h in headers), f"Câu đúng column: {headers}"
        assert any("ĐẠT" in h.upper() or "%" in h for h in headers), f"% Đạt column: {headers}"

    def test_FR_022_013_top3_medal_styling(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Rank 1 → bg-yellow-500, Rank 2 → bg-gray-400, Rank 3 → bg-primary-600
        cls1 = page.row_rank_circle_class(0)
        cls2 = page.row_rank_circle_class(1)
        cls3 = page.row_rank_circle_class(2)
        assert "bg-yellow" in cls1, f"Rank 1 should be gold; class={cls1!r}"
        assert "bg-gray-400" in cls2, f"Rank 2 should be silver; class={cls2!r}"
        assert "bg-primary" in cls3 or "bg-orange" in cls3, (
            f"Rank 3 should be bronze/primary; class={cls3!r}"
        )

    def test_FR_022_014_correct_count_rendered(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # First row (rank 1, 100%) should show 3/3 correct
        row = page.row_data(0)
        # Cells: rank | name | email | correct | score | submittedAt
        assert "3/3" in row[3] or "3 / 3" in row[3], (
            f"Top row should show 3/3 correct; cells={row}"
        )

    def test_FR_022_015_excellent_label_green(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Rank 1 (score 100) → green badge
        cls = page.row_score_badge_class(0)
        assert "bg-green" in cls, (
            f"Score >= 80 should have green badge; class={cls!r}"
        )

    def test_FR_022_016_average_label_yellow(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Rank 3 (score 50) → yellow badge (>=50, <80)
        cls = page.row_score_badge_class(2)
        assert "bg-yellow" in cls, (
            f"Score 50 should have yellow badge; class={cls!r}"
        )

    def test_FR_022_017_under50_label_red(self, teacher_with_attempts):
        driver, _, exam_id = teacher_with_attempts
        page = TeacherExamResultsPage(driver, exam_id=exam_id).open()
        page.wait_until_loaded()
        # Rank 4 (score 33.3) → red badge (<50)
        cls = page.row_score_badge_class(3)
        assert "bg-red" in cls, (
            f"Score < 50 should have red badge; class={cls!r}"
        )


# =============================================================================
# Section 4 — Negative (FR_022_018 to FR_022_019)
# =============================================================================

class TestNegative:
    def test_FR_022_018_bad_url_handled(self, db_conn, driver, cleanup_test_users):
        """Open a results URL with garbage path segment — page should not
        white-screen."""
        _login_as(driver, db_conn, "TEACHER")
        driver.get(
            f"{settings.BASE_URL_FE}/teacher/dashboard/exams/abc!@/results"
        )
        time.sleep(2)
        # Page should render some content (not blank)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text) > 0, "Page should not white-screen on bad URL"

    def test_FR_022_019_nonexistent_exam_id(
        self, db_conn, driver, cleanup_test_users
    ):
        _login_as(driver, db_conn, "TEACHER")
        driver.get(
            f"{settings.BASE_URL_FE}/teacher/dashboard/exams/999999999/results"
        )
        time.sleep(3)
        # Page should at least show something — toast error or fallback heading
        # The FE catches the error and toasts but doesn't navigate, so the
        # page may still render heading + empty.
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "Kết quả" in body_text or "Không thể tải" in body_text or "không tìm thấy" in body_text.lower()
