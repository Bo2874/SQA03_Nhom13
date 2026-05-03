"""Central configuration for Selenium test suite (FR25-FR31)."""
import csv
import os

# --- URLs ---
ADMIN_URL    = "http://localhost:3002"
FRONTEND_URL = "http://localhost:3001"
API_URL      = "http://localhost:3000/api/v1"

# --- WebDriver ---
TIMEOUT  = 10   # seconds for WebDriverWait
BROWSER  = "chrome"
HEADLESS = False  # set True for CI / no-display environments

# --- Database ---
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "database": "elearning",
    "user":     "root",
    "password": "12345678",
}

# --- Load test data from CSV ---
_TEST_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "test_data", "test_data.csv")

def load_test_data() -> dict:
    data = {}
    try:
        with open(_TEST_DATA_PATH, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                data[row["key"]] = row["value"]
        print(f"[OK] Loaded test_data.csv from: {_TEST_DATA_PATH}")
        print(f"[INFO] Loaded {len(data)} keys: {list(data.keys())}")
    except FileNotFoundError:
        print(f"[ERROR] test_data.csv NOT found at: {_TEST_DATA_PATH}")
    return data

TEST_DATA = load_test_data()

def get(key: str, default: str = "") -> str:
    return TEST_DATA.get(key, default)
