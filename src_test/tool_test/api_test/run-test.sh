#!/usr/bin/env bash
# =============================================================================
#  RUN-TEST.SH — Pipeline 1-click (bash version)
# =============================================================================
set -e
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo " STEP 1/4: Cleanup test data trong MySQL"
echo "========================================"
docker exec -i elearning-mysql mysql -uroot -p1234 elearning < cleanup/cleanup.sql

echo ""
echo "========================================"
echo " STEP 2/4: Seed OTP vao Redis"
echo "========================================"
bash cleanup/seed-otp.sh

echo ""
echo "========================================"
echo " STEP 3/4: Chay Newman"
echo "========================================"
NEWMAN="${NEWMAN:-newman}"
"$NEWMAN" run collection/SQA03_Nhom13_API_Test.postman_collection.json \
    -e environment/SQA03_Nhom13_LOCAL.postman_environment.json \
    -r cli,htmlextra,json \
    --reporter-htmlextra-export reports/api_report.html \
    --reporter-json-export reports/result.json \
    --color off || true   # don't fail on assertion failures, we want to update Excel anyway

echo ""
echo "========================================"
echo " STEP 4/4: Cap nhat Excel"
echo "========================================"
python cleanup/update_excel_from_newman.py

echo ""
echo "========================================"
echo " DONE!"
echo "========================================"
echo " - HTML report:  reports/api_report.html"
echo " - Excel:        ss_api_test_13.xlsx (da auto cap nhat)"
echo " - Newman JSON:  reports/result.json"
echo ""
