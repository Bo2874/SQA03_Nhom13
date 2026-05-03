"""WebDriver factory using webdriver-manager for automatic ChromeDriver setup."""
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from config.config import HEADLESS


def create_driver() -> webdriver.Chrome:
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])

    # Fix: ChromeDriverManager().install() returns wrong path
    # Get the directory and construct correct path to chromedriver.exe
    chrome_path = ChromeDriverManager().install()
    chrome_dir = os.path.dirname(chrome_path)
    chromedriver_exe = os.path.join(chrome_dir, "chromedriver.exe")

    service = Service(chromedriver_exe)
    driver = webdriver.Chrome(service=service, options=opts)
    driver.implicitly_wait(5)
    return driver
