# Tool_TestScript_01-09 — Selenium System Tests (FR_01 → FR_09)

Automated UI + DB system tests for the elearning project, driven by data
sourced from `ss_test_13.xlsx`.

## Prerequisites

- Python 3.11+ on PATH
- Microsoft Edge (pre-installed on Win 11) **or** Chrome / Firefox
- Docker Desktop (for MySQL + Redis)

## One-time setup

```powershell
# 1. Start MySQL + Redis
docker compose -f src_test/tool_test/Tool_TestScript_01-09/infra/docker-compose.yml up -d

# 2. Create Python virtual env
cd src_test/tool_test/Tool_TestScript_01-09
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install Python deps
pip install -r requirements.txt

# 4. Copy env file
Copy-Item .env.example .env

# 5. In separate terminals, start backend + frontend
#    Backend:  cd src_code/elearning-backend  && npm run start:dev
#    Frontend: cd src_code/elearning-frontend && npm run dev
```

## Run tests

```powershell
cd src_test/tool_test/Tool_TestScript_01-09
.\.venv\Scripts\Activate.ps1

# Run everything
pytest

# Run one feature
pytest tests/FR_01_registration

# Run a single test case ID
pytest -k FR_001_006
```

After the run:
- HTML report → `reports/html/index.html`
- Failure screenshots → `reports/screenshots/`

## Layout

```
src_test/tool_test/Tool_TestScript_01-09/
├── infra/docker-compose.yml   # MySQL + Redis
├── config/settings.py         # URLs, DB, browser config (reads .env)
├── conftest.py                # pytest fixtures: driver, db_conn, redis_conn, cleanup
├── pages/                     # Page Object Model
├── utils/                     # db_helper, otp_helper, csv_reader, screenshot
├── data/                      # CSV test data, one file per FR
├── tests/                     # Test scripts, one folder per FR
└── reports/                   # HTML report + failure screenshots
```

## Conventions

- Test data emails are prefixed with `auto_test_` so the cleanup fixture
  can wipe only test-created rows, not real users.
- OTPs are read directly from Redis (key `otp:<email>`) — no real email
  inbox needed.
- Each FR has its own subfolder under `tests/` so you can iterate one
  feature at a time.

## Docker housekeeping

```powershell
# Stop containers (keep data)
docker compose -f src_test/tool_test/Tool_TestScript_01-09/infra/docker-compose.yml stop

# Wipe everything and start fresh
docker compose -f src_test/tool_test/Tool_TestScript_01-09/infra/docker-compose.yml down -v
```
