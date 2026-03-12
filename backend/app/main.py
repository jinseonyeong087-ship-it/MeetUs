# FastAPI 연동
# http://127.0.0.1:8000/docs

from app.database import engine, Base
import app.models
import os

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import (
    auth_router,
    internal_router,
    meeting_router,
    todo_router,
    upload_router,
    workspace_router,
)

# DB
def init_db():
    Base.metadata.create_all(bind=engine)
    print("테이블 생성 완료")

if __name__ == "__main__":
    init_db()

# FastAPI
app = FastAPI()

default_origins = "http://localhost:8080"
allow_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", default_origins).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error_code_from_status(status_code: int) -> str:
    if status_code >= 500:
        return "INTERNAL_ERROR"
    if status_code == status.HTTP_401_UNAUTHORIZED:
        return "UNAUTHORIZED"
    if status_code == status.HTTP_403_FORBIDDEN:
        return "FORBIDDEN"
    if status_code == status.HTTP_404_NOT_FOUND:
        return "NOT_FOUND"
    if status_code == status.HTTP_409_CONFLICT:
        return "CONFLICT"
    if status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
        return "VALIDATION_ERROR"
    if status_code == status.HTTP_400_BAD_REQUEST:
        return "BAD_REQUEST"
    return f"HTTP_{status_code}"


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": _error_code_from_status(exc.status_code),
            "message": message
        }
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    message = first_error.get("msg", "Validation failed.")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "message": message
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_ERROR",
            "message": "처리 중 오류가 발생했습니다."
        }
    )

app.include_router(auth_router.router)
app.include_router(workspace_router.router)
app.include_router(meeting_router.router)
app.include_router(todo_router.router)
app.include_router(internal_router.router)
app.include_router(upload_router.router)

@app.get("/")
def root():
    return {"message": "AI Minutes API"}

