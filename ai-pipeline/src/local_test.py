import sys
import os

# 모듈 경로 인식 버그 방지 (ai-pipeline 폴더를 기준으로 환경 설정)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.llm_processor import LLMProcessor
from src.network.api_client import APIClient

class MockSTTProcessor:
    """AWS 비용을 방지하기 위해 STT 로직을 텍스트 뱉는 가짜(Mock) 모듈로 교체합니다."""
    def process_audio(self, s3_uri: str) -> str:
        print(f"[MOCK_STT] 가상의 S3 파일({s3_uri})을 AWS Transcribe 대신 읽어왔습니다.")
        return """
        주환: 자, 오늘 회의 시작할게요. 프론트엔드 작업 어떻게 되고 있나요? 선영님?
        선영: 네 바닐라 자바스크립트로 변경하는 작업은 내일(3월 5일)까지 완료할 예정입니다.
        단비: DB 설계는 아까 제가 공유드린 대로 파이썬 스네이크 케이스로 전부 통일해서 수정 완료했습니다. 
        주환: 좋습니다. 그럼 단비님은 내일 모레(3월 6일)까지 API 연동 문서 초안 작성해 주시고요. 
              저는 다음 주 월요일(3월 9일)까지 AI 엔진 통합 테스트 마무리하겠습니다.
        """

class MockAPIClient(APIClient):
    """서버 통신 오류 방지를 위해 HTTP Request를 가로채어 화면에만 출력하는 가짜(Mock) 우체부입니다."""
    def _send_request(self, endpoint: str, method: str, payload: dict = None) -> dict:
        print(f"\n[MOCK_API_REQUEST] 👉 {method} {self.base_url}{endpoint}")
        if payload:
            import json
            print(f"[MOCK_API_PAYLOAD] {json.dumps(payload, ensure_ascii=False, indent=2)}")
        return {"status": "success", "mocked": True}

def run_local_mock_pipeline():
    print("========== 🚀 로컬 모의(Mock) 파이프라인 통합 테스트 시작 ==========")
    
    # 1. 뼈대 모듈(진짜+가짜 섞어서) 조립
    stt = MockSTTProcessor()             # S3/Transcribe 가짜 대체
    llm = LLMProcessor()                 # Amazon Bedrock Claude 로직은 단독으로 100% 진짜 실행!
    api = MockAPIClient()                # TA 서버 통신은 가짜 대체
    
    meeting_id = "test-uuid-1234-5678"
    dummy_s3_uri = "s3://mock-bucket/test-meeting.m4a"
    
    # 2. 파이프라인 흐름(Flow) 재현
    print("\n1️⃣ 단계: 상태 업데이트 (TRANSCRIBING)")
    api.update_meeting_status(meeting_id, "TRANSCRIBING")
    
    print("\n2️⃣ 단계: STT 음성 추출 (Mock)")
    transcript = stt.process_audio(dummy_s3_uri)
    
    print("\n3️⃣ 단계: 상태 업데이트 (PROCESSING)")
    api.update_meeting_status(meeting_id, "PROCESSING")
    
    print("\n4️⃣ 단계: 강력한 LLM 요약 및 JSON To-Do 파싱 (진짜 Bedrock Claude 3 통신중...)")
    try:
        # 이 부분은 미리 발급된 IAM 권한을 사용하여 진짜 AWS Bedrock 서버와 통신합니다.
        llm_result = llm.process_transcript(transcript)
        
        summary_data = {
            "summary": llm_result.get("summary", ""),
            "decisions": llm_result.get("decisions", "")
        }
        todo_data = llm_result.get("todos", [])
        
        print("\n5️⃣ 단계: 최종 결과 Core API로 전송 (Mock)")
        api.submit_ai_result(meeting_id, transcript, summary_data, todo_data)
        
        print("\n========== 🎉 로컬 모의 파이프라인 테스트 성공적으로 통과! ==========")
        
    except Exception as e:
        print(f"\n❌ [에러 발생] LLM 혹은 다른 모듈에서 문제가 발생했습니다: {e}")

if __name__ == "__main__":
    run_local_mock_pipeline()
