"""Load test data from CSV files in data/."""
import csv
import pytest
from config import settings


def load_csv(filename):
    path = settings.DATA_DIR / filename
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def to_pytest_params(rows, id_field="tc_id"):
    """Wrap rows so pytest's -v output shows the test case ID."""
    return [
        pytest.param(row, id=row.get(id_field) or f"row_{i}")
        for i, row in enumerate(rows)
    ]
