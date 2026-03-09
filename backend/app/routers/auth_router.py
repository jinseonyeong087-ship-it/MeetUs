from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == body.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name.strip(),
        password_hash=hash_password(body.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user_id": str(user.user_id),
        "email": user.email,
        "name": user.name
    }


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        user_id=str(user.user_id),
        email=user.email,
        name=user.name
    )
    return {"access_token": token}
