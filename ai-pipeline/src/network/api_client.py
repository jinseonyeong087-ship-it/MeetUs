import json
import urllib.request
from ..config import config

class APIClient:
    """
    단비님(TA)이 구축한 Core API(FastAPI)와 통신하는 우체부(Client) 모듈입니다.
    DB 트랜잭션 등 복잡한 처리는 TA 서버에 위임하고, SA 엔진은 이 모듈을 통해
    진행 상태 업데이트(TRANSCRIBING, COMPLETED 등) 및 최종 결과 텍스트/JSON만 REST API로 전송합니다.
    """
    def __init__(self):
        # 환경 변수에 정의된 메인 서버 URL 호스트
        self.base_url = config.CORE_API_URL

    def _send_request(self, endpoint: str, method: str, payload: dict = None) -> dict:
        """
        urllib를 활용한 공통 HTTP 요청 메서드. 외부 라이브러리(requests) 최소화.
        """
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            # 필요 시 내부 인증용 Auth 토큰 헤더 추가 가능
        }
        
        data = None
        if payload:
            data = json.dumps(payload).encode('utf-8')
            
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode('utf-8')
                return json.loads(res_body) if res_body else {}
        except Exception as e:
            print(f"[API_ERROR] Core API 통신 실패 ({url}): {e}")
            raise e

    def update_meeting_status(self, meeting_id: str, status: str, reason: str = None):
        """
        회의의 진행 상태(PROCESSING, COMPLETED, FAILED 등)를 Core DB에 업데이트합니다.
        
        :param meeting_id: UUID 형식의 회의 식별자
        :param status: 변경할 상태 상수
        :param reason: FAILED 등 실패 시 사유 (Optional)
        """
        endpoint = f"/meetings/{meeting_id}/status"
        payload = {"status": status}
        if reason:
            payload["reason"] = reason
            
        print(f"[API] 상태 업데이트 요청: {meeting_id} -> {status}")
        return self._send_request(endpoint, "PATCH", payload)

    def submit_ai_result(self, meeting_id: str, transcript: str, summary_data: dict, todo_data: list):
        """
        STT 및 Bedrock 처리 결과물을 Core API 웹훅으로 전송하여 DB에 적재합니다.
        
        :param meeting_id: 회의 식별자
        :param transcript: STT 전체 원본 텍스트
        :param summary_data: 5~7줄 요약 및 결정사항 딕셔너리
        :param todo_data: JSON 형식으로 파싱된 담당자별 To-Do 배열
        """
        endpoint = "/internal/ai/result"  # 명세서(api-spec.md) 기준 내부 통신 엔드포인트
        payload = {
            "meeting_id": meeting_id,
            "transcript": transcript,
            "summary": summary_data.get("summary", ""),
            "decisions": summary_data.get("decisions", ""),
            "todos": todo_data
        }
        
        print(f"[API] 최종 AI 분석 결과 전송 (Meeting: {meeting_id})")
        return self._send_request(endpoint, "POST", payload)
