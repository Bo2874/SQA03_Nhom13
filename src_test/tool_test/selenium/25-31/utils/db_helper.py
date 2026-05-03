"""MySQL helper for DB verification and rollback in tests."""
import mysql.connector
from config.config import DB_CONFIG, get


def get_connection():
    cfg = dict(DB_CONFIG)
    cfg["user"]     = get("db_user") or cfg["user"]
    cfg["password"] = get("db_password")
    return mysql.connector.connect(**cfg)


class DBHelper:
    def __init__(self):
        self.conn   = get_connection()
        self.cursor = self.conn.cursor(dictionary=True)

    def query(self, sql: str, params=None) -> list:
        self.cursor.execute(sql, params or ())
        return self.cursor.fetchall()

    def query_one(self, sql: str, params=None) -> dict | None:
        rows = self.query(sql, params)
        return rows[0] if rows else None

    def execute(self, sql: str, params=None):
        self.cursor.execute(sql, params or ())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.cursor.close()
        self.conn.close()

    # --- Convenience methods ---

    def count_users_by_role(self, role: str) -> int:
        row = self.query_one("SELECT COUNT(*) AS cnt FROM users WHERE role = %s AND status != 'INACTIVE'", (role,))
        return row["cnt"] if row else 0

    def count_courses(self) -> int:
        row = self.query_one("SELECT COUNT(*) AS cnt FROM courses")
        return row["cnt"] if row else 0

    def count_published_courses(self) -> int:
        row = self.query_one("SELECT COUNT(*) AS cnt FROM courses WHERE status IN ('APPROVED', 'PUBLISHED')")
        return row["cnt"] if row else 0

    def find_user_by_email(self, email: str) -> dict | None:
        return self.query_one("SELECT * FROM users WHERE email = %s", (email,))

    def delete_user_by_email(self, email: str):
        self.execute("DELETE FROM users WHERE email = %s", (email,))
        self.commit()

    def count_zoom_meetings_by_title(self, title: str) -> int:
        row = self.query_one("SELECT COUNT(*) AS cnt FROM zoom_meetings WHERE title = %s", (title,))
        return row["cnt"] if row else 0

    def delete_zoom_meeting_by_title(self, title: str):
        self.execute("DELETE FROM zoom_meetings WHERE title = %s", (title,))
        self.commit()

    def count_published_courses_by_teacher(self, teacher_id: int) -> int:
        row = self.query_one(
            "SELECT COUNT(*) AS cnt FROM courses WHERE teacher_id = %s AND status = 'PUBLISHED'",
            (teacher_id,)
        )
        return row["cnt"] if row else 0

    def get_user_avatar_url(self, user_id: int) -> str | None:
        row = self.query_one("SELECT avatar_url FROM users WHERE id = %s", (user_id,))
        return row["avatar_url"] if row else None
