"""Read OTP straight from Redis — backend stores it at key `${prefix}:${email}`.

Reference: src_code/elearning-backend/src/common/utils/otp.service.ts
"""
import time
import redis as redis_lib
from config import settings


def get_redis():
    return redis_lib.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
    )


def get_otp(redis_conn, email, prefix=None):
    key = f"{prefix or settings.OTP_PREFIX}:{email}"
    return redis_conn.get(key)


def wait_for_otp(redis_conn, email, prefix=None, timeout=10, poll=0.5):
    """Poll Redis until OTP appears or timeout. Returns the OTP or raises TimeoutError."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        otp = get_otp(redis_conn, email, prefix)
        if otp:
            return otp
        time.sleep(poll)
    raise TimeoutError(f"OTP for {email} did not appear in Redis within {timeout}s")


def delete_otp(redis_conn, email, prefix=None):
    key = f"{prefix or settings.OTP_PREFIX}:{email}"
    return redis_conn.delete(key)
