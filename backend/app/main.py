# FastAPI 연동
# venv\Scripts\activate
# http://127.0.0.1:8000/docs

from app.database import engine, Base
import app.models

from fastapi import FastAPI
from app.routers import meeting_router, upload_router

# DB
def init_db():
    Base.metadata.create_all(bind=engine)
    print("테이블 생성 완료")

if __name__ == "__main__":
    init_db()

# FastAPI
app = FastAPI()

app.include_router(meeting_router.router)
app.include_router(upload_router.router)

@app.get("/")
def root():
    return {"message": "AI Minutes API"}