from typing import Optional

from fastapi import Header

from app.services.auth_service import decode_token_payload


def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    payload = decode_token_payload(token)
    user_id = payload.get("user_id") or payload.get("sub")
    return user_id if isinstance(user_id, str) else None
