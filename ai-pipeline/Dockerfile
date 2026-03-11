# 1. Base Image 명시 (안정성과 경량화를 위해 python 3.12 slim 버전 사용)
FROM python:3.12-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 필수 패키지 설치
# 캐시를 지우고 보안 패치 등 최신화 작업 수행
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스 코드 복사
COPY src/ /app/src/

# 6. 환경 변수 설정 (우분투/ECS 환경에서 Python 로깅이 바로바로 출력되게 설정)
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# 7. 실행 컨테이너 명령 지정
# SQS Listener를 24시간 백그라운드로 돌리는 메인 프로세스 가동
CMD ["python", "-m", "src.sqs_listener"]
