import re
import time
from collections import defaultdict
from datetime import datetime

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
import mysql.connector
import redis as redis_lib

from config import settings
from utils.excel_report import generate_results_xlsx
from utils.screenshot import save_screenshot

# Collected during the run, consumed in pytest_sessionfinish to write Excel.
_TEST_RESULTS = {}
_TC_ID_RE = re.compile(r"FR_\d{3}_\d{3}")
_SESSION_START = None


def _build_driver():
    if settings.BROWSER == "edge":
        opts = EdgeOptions()
        if settings.HEADLESS:
            opts.add_argument("--headless=new")
        opts.add_argument("--window-size=1366,768")
        return webdriver.Edge(options=opts)
    if settings.BROWSER == "firefox":
        opts = FirefoxOptions()
        if settings.HEADLESS:
            opts.add_argument("--headless")
        opts.add_argument("--width=1366")
        opts.add_argument("--height=768")
        return webdriver.Firefox(options=opts)
    opts = ChromeOptions()
    if settings.HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1366,768")
    opts.add_argument("--disable-notifications")
    return webdriver.Chrome(options=opts)


@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Expose test result on the item, and record outcome by tc_id."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)

    if rep.when == "call":
        match = _TC_ID_RE.search(item.nodeid)
        if match:
            _TEST_RESULTS[match.group(0)] = {
                "outcome": rep.outcome,
                "duration": rep.duration,
                "error": str(rep.longrepr) if rep.failed else "",
                "nodeid": item.nodeid,
            }


def pytest_sessionstart(session):
    global _SESSION_START
    _SESSION_START = time.time()


def pytest_sessionfinish(session, exitstatus):
    """After the run, write one Excel results file per FR feature touched."""
    if not _TEST_RESULTS:
        return
    duration_total = time.time() - _SESSION_START if _SESSION_START else 0.0

    meta = {
        "browser": settings.BROWSER,
        "headless": settings.HEADLESS,
        "fe_url": settings.BASE_URL_FE,
        "be_url": settings.BASE_URL_BE,
        "db": f"MySQL @ {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}",
        "redis": f"Redis @ {settings.REDIS_HOST}:{settings.REDIS_PORT}",
        "run_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "duration_total": duration_total,
    }

    by_feature = defaultdict(dict)
    for tc_id, info in _TEST_RESULTS.items():
        feature = f"FR_{int(tc_id.split('_')[1]):02d}"  # FR_001_NNN -> FR_01
        by_feature[feature][tc_id] = info

    print("")
    for feature, results in by_feature.items():
        try:
            path, p, f, s = generate_results_xlsx(feature, results, meta)
            print(f"[Excel] {feature}: Pass={p} Fail={f} Skipped={s} -> {path}")
        except Exception as e:
            import traceback
            print(f"[Excel] {feature}: FAILED to generate ({e})")
            traceback.print_exc()


@pytest.fixture(scope="function")
def driver(request):
    drv = _build_driver()
    drv.implicitly_wait(settings.IMPLICIT_WAIT)
    yield drv
    rep_call = getattr(request.node, "rep_call", None)
    if rep_call is not None and rep_call.failed:
        save_screenshot(drv, request.node.name)
    drv.quit()


@pytest.fixture(scope="session")
def db_conn():
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    yield conn
    conn.close()


@pytest.fixture(scope="session")
def redis_conn():
    r = redis_lib.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
    )
    yield r
    r.close()


@pytest.fixture(scope="function")
def cleanup_test_users(db_conn):
    """Yield, then wipe any users (and their courses) created during the test."""
    yield
    cur = db_conn.cursor()
    # Courses have a FK to users(teacher_id) — delete them first.
    cur.execute(
        "DELETE c FROM courses c JOIN users u ON c.teacher_id = u.id "
        "WHERE u.email LIKE %s",
        (f"{settings.TEST_EMAIL_PREFIX}%",),
    )
    cur.execute(
        "DELETE FROM users WHERE email LIKE %s",
        (f"{settings.TEST_EMAIL_PREFIX}%",),
    )
    db_conn.commit()
    cur.close()
