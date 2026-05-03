"""Shared pytest fixtures for all Selenium tests."""
import sys
import os
import pytest

# Allow imports from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.driver_factory import create_driver
from utils.db_helper import DBHelper
from utils.screenshot import take_screenshot
from utils.excel_reporter import ExcelReporter
from config.config import get, ADMIN_URL, FRONTEND_URL
from pages.admin.admin_login_page import AdminLoginPage
from pages.frontend.frontend_login_page import FrontendLoginPage

# Global Excel reporter instance
excel_reporter = ExcelReporter()


# ── Driver fixture ────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def driver():
    d = create_driver()
    yield d
    d.quit()


# ── Auto-screenshot on failure ────────────────────────────────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        drv = item.funcargs.get("driver")
        if drv:
            path = take_screenshot(drv, item.name)
            print(f"\n  Screenshot: {path}")


# ── DB fixture ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def db():
    helper = DBHelper()
    yield helper
    helper.close()


# ── Admin login fixture ───────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def admin_driver(driver):
    """Open admin panel and log in as admin."""
    page = AdminLoginPage(driver)
    page.open()
    page.login_and_wait(
        get("admin_email"),
        get("admin_password"),
        redirect_fragment="/"  # Admin panel root (/) is the dashboard
    )
    yield driver


# ── Teacher login fixture (frontend) ─────────────────────────────────────────

@pytest.fixture(scope="function")
def teacher_driver(driver):
    """Open frontend and log in as teacher1."""
    page = FrontendLoginPage(driver)
    page.open()
    page.login_and_wait(
        get("teacher_email"),
        get("teacher_password"),
        redirect_fragment="/teacher",
        timeout=20
    )
    yield driver


# ── Student login fixture (frontend) ─────────────────────────────────────────

@pytest.fixture(scope="function")
def student_driver(driver):
    """Open frontend and log in as student1."""
    from selenium.webdriver.support.ui import WebDriverWait
    page = FrontendLoginPage(driver)
    page.open()
    page.login(get("student_email"), get("student_password"))
    # Students redirect to / (home), not /student — just wait for login to complete
    WebDriverWait(driver, 20).until(lambda d: "/login" not in d.current_url)
    yield driver


# ── Rollback fixture: auto-delete test teacher after test ─────────────────────

@pytest.fixture(scope="function")
def cleanup_test_teacher(db):
    """Delete any user with email LIKE test_auto_* after the test finishes."""
    yield
    db.execute("DELETE FROM users WHERE email LIKE 'test_auto_%'")
    db.commit()


# ── Pytest hooks: Capture test results and update Excel ──────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture test result status."""
    outcome = yield
    rep = outcome.get_result()

    # Only record when test call completes
    if rep.when == "call":
        status_map = {
            "passed": "PASSED",
            "failed": "FAILED",
            "skipped": "SKIPPED",
        }
        status = status_map.get(rep.outcome, "ERROR")
        excel_reporter.add_result(item.name, status, remarks="")


def pytest_sessionfinish(session, exitstatus):
    """Update Excel after all tests complete."""
    excel_reporter.finish()
    excel_reporter.save()
