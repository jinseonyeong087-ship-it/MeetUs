import os
from dotenv import load_dotenv

# .env 파일 로드 (루트 디렉토리 기준 절대 경로 지정)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=env_path)

class Config:
    """
    프로젝트 전반에 사용되는 환경 변수 및 설정값을 관리하는 중앙 클래스입니다.
    이곳을 통해서만 보안 키에 접근하도록 통제합니다.
    """
    
    # [AWS Settings]
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
    

    # [Network Settings]
    CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:8080/api/v1")

# 싱글톤처럼 사용할 전역 설정 객체
config = Config()
