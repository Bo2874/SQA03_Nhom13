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
                title="Auto Test Course", summary="", status="DRAFT"):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO courses (teacher_id, subject_id, grade_level_id, "
        "title, summary, status) VALUES (%s, %s, %s, %s, %s, %s)",
        (teacher_id, subject_id, grade_level_id, title, summary, status),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    return new_id


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
