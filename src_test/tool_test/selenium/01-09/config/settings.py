import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

BASE_URL_FE = os.getenv("BASE_URL_FE", "http://localhost:3001")
BASE_URL_BE = os.getenv("BASE_URL_BE", "http://localhost:3000")
BASE_URL_ADMIN = os.getenv("BASE_URL_ADMIN", "http://localhost:3002")
API_PREFIX = os.getenv("API_PREFIX", "/api/v1")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "1234")
DB_NAME = os.getenv("DB_NAME", "elearning")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
OTP_PREFIX = os.getenv("OTP_PREFIX", "otp")

BROWSER = os.getenv("BROWSER", "edge").lower()
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "5"))
EXPLICIT_WAIT = int(os.getenv("EXPLICIT_WAIT", "10"))

# Prefix added to every email used by automated tests.
# Lets the cleanup fixture wipe just this run's data, not real users.
TEST_EMAIL_PREFIX = "auto_test_"

DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
HTML_REPORT_DIR = REPORTS_DIR / "html"
