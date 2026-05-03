@echo off
REM =============================================================================
REM Seed OTP into Redis for Postman happy-path tests
REM =============================================================================
REM Postman không đọc được Redis trực tiếp, nên trước khi chạy collection,
REM ta seed sẵn OTP với giá trị cố định (999991, 999992) cho các email test.
REM File register/reset trong Postman dùng đúng cặp email + OTP này.
REM
REM Chạy lệnh này TRƯỚC mỗi lần Run Collection (hoặc thêm vào CI).
REM =============================================================================

echo Seeding OTPs into Redis...

REM OTP cho register happy path
docker exec elearning-redis redis-cli SETEX otp:test_api_register_happy@example.com 600 999991

REM OTP cho reset-password happy path (dùng prefix khác: reset-password:otp)
docker exec elearning-redis redis-cli SETEX reset-password:otp:test_api_reset_happy@example.com 600 999992

echo.
echo Done. OTPs seeded:
echo   test_api_register_happy@example.com  ^=^>  999991
echo   test_api_reset_happy@example.com     ^=^>  999992  (reset prefix)
echo.
echo Now you can run Postman/Newman.
