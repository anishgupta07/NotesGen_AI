import os
import time
import json
import base64
import hmac
import hashlib
import secrets
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("JWT_SECRET", "notesgen_jwt_secret_key_2026_super_secure")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with a unique salt."""
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against stored PBKDF2 hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        meta, salt, stored_hash = parts
        iterations = int(meta.split(":")[-1])
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(derived.hex(), stored_hash)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(s: str) -> bytes:
    padding = "=" * (4 - (len(s) % 4)) if (len(s) % 4) != 0 else ""
    return base64.urlsafe_b64decode(s + padding)


def create_access_token(user_id: str, email: str, name: str) -> str:
    """Generate a standard signed HMAC-SHA256 bearer token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{header_b64}.{payload_b64}"

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{message}.{signature_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify signature and return payload if token is valid and not expired."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts

        message = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).digest()
        actual_sig = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None
