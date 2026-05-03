#!/usr/bin/env bash
# =============================================================================
# Seed OTP into Redis for Postman happy-path tests (bash version)
# =============================================================================
set -e

echo "Seeding OTPs into Redis..."

docker exec elearning-redis redis-cli SETEX otp:test_api_register_happy@example.com 600 999991
docker exec elearning-redis redis-cli SETEX reset-password:otp:test_api_reset_happy@example.com 600 999992

echo ""
echo "Done. OTPs seeded:"
echo "  test_api_register_happy@example.com  =>  999991"
echo "  test_api_reset_happy@example.com     =>  999992  (reset prefix)"
echo ""
echo "Now you can run Postman/Newman."
