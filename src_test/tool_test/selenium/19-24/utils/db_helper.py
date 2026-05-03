"""MySQL helpers for asserting database state during tests."""
import bcrypt
import mysql.connector
from config import settings


def get_connection():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )


def fetch_one(conn, sql, params=None):
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, params or ())
    row = cur.fetchone()
    cur.close()
    return row


def fetch_all(conn, sql, params=None):
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, params or ())
    rows = cur.fetchall()
    cur.close()
    return rows


def execute(conn, sql, params=None):
    cur = conn.cursor()
    cur.execute(sql, params or ())
    conn.commit()
    affected = cur.rowcount
    cur.close()
    return affected


def find_user_by_email(conn, email):
    return fetch_one(conn, "SELECT * FROM users WHERE email = %s", (email,))


def delete_user_by_email(conn, email):
    return execute(conn, "DELETE FROM users WHERE email = %s", (email,))


def cleanup_by_email_prefix(conn, prefix):
    return execute(conn, "DELETE FROM users WHERE email LIKE %s", (f"{prefix}%",))


def hash_password(plain):
    """Bcrypt hash compatible with backend (NestJS bcrypt.hash with rounds=10)."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=10)).decode()


def seed_user(conn, email, password_plain, full_name="Auto Test User",
              role="STUDENT", status="ACTIVE", phone=None):
    """Insert a user with a real bcrypt-hashed password and return the new id."""
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (email, password_hash, full_name, phone, role, status) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (email, hash_password(password_plain), full_name, phone, role, status),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def get_or_create_subject(conn, name="Toán học"):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM subjects WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        cur.close()
        return row["id"]
    cur.close()
    cur = conn.cursor()
    cur.execute("INSERT INTO subjects (name) VALUES (%s)", (name,))
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def get_or_create_grade_level(conn, name="Lớp 10"):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM grade_levels WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        cur.close()
        return row["id"]
    cur.close()
    cur = conn.cursor()
    cur.execute("INSERT INTO grade_levels (name) VALUES (%s)", (name,))
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def seed_course(conn, teacher_id, subject_id, grade_level_id,
                title="Auto Test Course", summary="", status="DRAFT",
                submitted_at=None, rejection_reason=None):
    """Seed a course. For non-DRAFT statuses we auto-fill submitted_at to
    the current time so the FE 'submittedAt' column shows something."""
    cur = conn.cursor()
    if submitted_at is None and status in (
        "PENDING_REVIEW", "APPROVED", "REJECTED", "PUBLISHED",
    ):
        from datetime import datetime
        submitted_at = datetime.now()
    cur.execute(
        "INSERT INTO courses (teacher_id, subject_id, grade_level_id, "
        "title, summary, status, submitted_at, rejection_reason) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (teacher_id, subject_id, grade_level_id, title, summary, status,
         submitted_at, rejection_reason),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def find_course_by_id(conn, course_id):
    return fetch_one(conn, "SELECT * FROM courses WHERE id = %s", (course_id,))


def seed_chapter(conn, course_id, title="Auto Chapter", order=1):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chapters (course_id, title, `order`) VALUES (%s, %s, %s)",
        (course_id, title, order),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def seed_episode(conn, chapter_id, title="Auto Episode",
                 ep_type="VIDEO", order=1):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO episodes (chapter_id, title, type, `order`) "
        "VALUES (%s, %s, %s, %s)",
        (chapter_id, title, ep_type, order),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def seed_material(conn, course_id, title="Auto Material",
                  file_url="https://example.com/seed.docx", file_size_kb=10):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO course_materials (course_id, title, fileUrl, fileSizeKb) "
        "VALUES (%s, %s, %s, %s)",
        (course_id, title, file_url, file_size_kb),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def seed_exam(conn, teacher_id, title="Auto Test Exam", duration_minutes=45,
              status="DRAFT", course_id=None):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO exams (teacher_id, course_id, title, duration_minutes, status) "
        "VALUES (%s, %s, %s, %s, %s)",
        (teacher_id, course_id, title, duration_minutes, status),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def find_exam_by_id(conn, exam_id):
    return fetch_one(conn, "SELECT * FROM exams WHERE id = %s", (exam_id,))


def seed_exam_question(conn, exam_id, content="Auto Question", order=1):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO exam_questions (exam_id, content, `order`) "
        "VALUES (%s, %s, %s)",
        (exam_id, content, order),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def seed_exam_answer(conn, question_id, content="Option A", is_correct=False):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO exam_answers (question_id, content, is_correct) "
        "VALUES (%s, %s, %s)",
        (question_id, content, 1 if is_correct else 0),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def count_exam_questions(conn, exam_id):
    row = fetch_one(
        conn, "SELECT COUNT(*) AS c FROM exam_questions WHERE exam_id = %s",
        (exam_id,),
    )
    return row["c"] if row else 0


def count_exam_answers(conn, question_id):
    row = fetch_one(
        conn, "SELECT COUNT(*) AS c FROM exam_answers WHERE question_id = %s",
        (question_id,),
    )
    return row["c"] if row else 0


def seed_exam_attempt(conn, exam_id, user_id, started_at=None,
                      submitted_at=None, score=None,
                      time_spent_seconds=None, responses_json=None):
    """Insert an exam_attempt row. Pass submitted_at to mark it complete."""
    import json
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO exam_attempts (exam_id, user_id, startedAt, "
        "submittedAt, score, timeSpentSeconds, responses_json) "
        "VALUES (%s, %s, COALESCE(%s, NOW()), %s, %s, %s, %s)",
        (
            exam_id, user_id, started_at, submitted_at,
            score, time_spent_seconds,
            json.dumps(responses_json) if responses_json else None,
        ),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


def find_exam_attempt(conn, attempt_id):
    return fetch_one(conn, "SELECT * FROM exam_attempts WHERE id = %s",
                     (attempt_id,))


def find_my_attempt(conn, exam_id, user_id):
    return fetch_one(
        conn,
        "SELECT * FROM exam_attempts WHERE exam_id = %s AND user_id = %s "
        "ORDER BY id DESC LIMIT 1",
        (exam_id, user_id),
    )
