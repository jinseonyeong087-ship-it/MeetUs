import base64
import hashlib
import hmac
import json
import os
import time


def hash_password(raw_password: str) -> str:
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def verify_password(raw_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(raw_password), hashed_password)


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(user_id: str, email: str, name: str, expires_in_seconds: int = 24 * 3600) -> str:
    secret = os.getenv("JWT_SECRET", "dev-secret")
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "email": email,
        "name": name,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in_seconds
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_token_payload(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload_raw = _base64url_decode(parts[1])
        return json.loads(payload_raw.decode("utf-8"))
    except Exception:
        return {}

