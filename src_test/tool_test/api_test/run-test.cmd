@echo off
REM =============================================================================
REM  RUN-TEST.CMD — Pipeline 1-click
REM  1. Cleanup DB     (xoa data test cu)
REM  2. Seed OTP       (set OTP co dinh vao Redis)
REM  3. Run Newman     (chay collection, sinh HTML + JSON report)
REM  4. Update Excel   (tu dong dien Actual_Status / Result vao file Excel)
REM =============================================================================
setlocal
cd /d "%~dp0"

REM Them duong dan npm globals vao PATH (de newman tim duoc)
set "PATH=%PATH%;%APPDATA%\npm"

echo.
echo ========================================
echo  STEP 1/4: Cleanup test data trong MySQL
echo ========================================
docker exec -i elearning-mysql mysql -uroot -p1234 elearning < cleanup\cleanup.sql
if errorlevel 1 (
    echo [ERROR] Cleanup that bai. Kiem tra container elearning-mysql co dang chay khong.
    exit /b 1
)

echo.
echo ========================================
echo  STEP 2/4: Seed OTP vao Redis
echo ========================================
call cleanup\seed-otp.cmd

echo.
echo ========================================
echo  STEP 3/4: Chay Newman (Postman runner)
echo ========================================
newman run collection\SQA03_Nhom13_API_Test.postman_collection.json ^
    -e environment\SQA03_Nhom13_LOCAL.postman_environment.json ^
    -r cli,htmlextra,json ^
    --reporter-htmlextra-export reports\api_report.html ^
    --reporter-json-export reports\result.json ^
    --color off

echo.
echo ========================================
echo  STEP 4/4: Cap nhat Excel
echo ========================================
python cleanup\update_excel_from_newman.py
if errorlevel 1 (
    echo [ERROR] Update Excel that bai.
    exit /b 1
)

echo.
echo ========================================
echo  DONE!
echo ========================================
echo  - HTML report:  reports\api_report.html
echo  - Excel:        ss_api_test_13.xlsx (da auto cap nhat)
echo  - Newman JSON:  reports\result.json
echo.
endlocal
