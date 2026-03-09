from typing import Optional

from fastapi import Header

from app.services.auth_service import decode_token_payload


def get_current_user_email(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    payload = decode_token_payload(token)
    email = payload.get("email")
    return email if isinstance(email, str) else None

