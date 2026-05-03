"""Auto-screenshot helper — called in conftest on test failure."""
import os
from datetime import datetime


def take_screenshot(driver, test_name: str) -> str:
    folder = os.path.join(os.path.dirname(__file__), "..", "reports", "screenshots")
    os.makedirs(folder, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(folder, f"{test_name}_{ts}.png")
    driver.save_screenshot(path)
    return path
