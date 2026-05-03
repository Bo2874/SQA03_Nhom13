"""Save screenshots when a test fails."""
import re
from datetime import datetime
from config import settings


_SAFE = re.compile(r"[^A-Za-z0-9_.-]+")


def save_screenshot(driver, test_name):
    settings.SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    safe = _SAFE.sub("_", test_name)
    path = settings.SCREENSHOTS_DIR / f"{safe}_{datetime.now():%Y%m%d_%H%M%S}.png"
    try:
        driver.save_screenshot(str(path))
    except Exception:
        return None
    return str(path)
