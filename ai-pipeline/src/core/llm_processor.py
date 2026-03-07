import json
import boto3
from ..config import config

class LLMProcessor:
    """
    Amazon Bedrock (Claude 3)과 통신하여 STT 원본 텍스트로부터 
    5~7줄 요약, 결정사항, 그리고 담당자별 할일(JSON)을 추출해내는 모듈입니다.
    """
    def __init__(self):
        # Bedrock Runtime 클라이언트 생성
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
        
        # 가장 최신의 고성능 모델이자 On-Demand가 지원되는 Claude 3.5 Sonnet 사용
        self.model_id = 'anthropic.claude-3-5-sonnet-20240620-v1:0'
        
        # 회의 확정 명세서를 바탕으로 설계된 마스터 프롬프트
        self.system_prompt = """
당신은 회의 녹취록을 분석하는 최고의 AI 비서입니다.
주어진 회의 녹취록을 분석하여 반드시 아래 JSON 형식으로만 딱 떨어지게 응답해야 합니다.
마크다운 코드 블록(```json)이나 다른 사족은 절대 포함하지 마세요.

응답 JSON 규격:
{
  "summary": "전체 회의 내용 핵심 요약 (반드시 5~7줄 분량으로 작성)",
  "decisions": "회의에서 결정된 사항들 (목록형 또는 문단형)",
  "todos": [
    {
      "assignee": "담당자 이름 (문자열, 할당된 사람이 없으면 빈 문자열)",
      "task": "수행해야 할 작업 내용 (문자열)",
      "due_date": "마감일 (YYYY-MM-DD 형식의 문자열, 언급되지 않았다면 null)"
    }
  ]
}
"""

    def process_transcript(self, transcript_text: str) -> dict:
        """
        STT로 추출된 전체 텍스트를 Amazon Bedrock 모델에 전달하여 정형화된 JSON 데이터를 추출합니다.
        
        :param transcript_text: STT 원본 텍스트
        :return: 파싱 완료된 요약 및 To-Do 딕셔너리
        """
        print("[LLM] Amazon Bedrock (Claude 3) 모델에 텍스트 분석 요청...")
        
        try:
            # Bedrock Claude 3 Messages API 형식 규격
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2048,
                "system": self.system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": f"다음 회의 녹취록을 분석하여 반드시 지정된 JSON 형식으로만 반환해주세요:\n\n<transcript>\n{transcript_text}\n</transcript>"
                    }
                ],
                "temperature": 0.3
            })

            response = self.bedrock_runtime.invoke_model(
                body=body,
                modelId=self.model_id,
                accept='application/json',
                contentType='application/json'
            )
            
            # API 반환 결과에서 실제 응답 텍스트(JSON 문자열) 추출
            response_body = json.loads(response.get('body').read())
            result_json_str = response_body.get('content')[0].get('text')
            
            # 마크다운 블록이 섞여있을 경우 제거
            if result_json_str.startswith("```json"):
                result_json_str = result_json_str.replace("```json", "", 1)
            if result_json_str.endswith("```"):
                result_json_str = result_json_str.rsplit("```", 1)[0]
                
            result_json_str = result_json_str.strip()
            
            # 문자열을 파이썬 딕셔너리로 확실하게 변환
            parsed_result = json.loads(result_json_str)
            
            todo_count = len(parsed_result.get('todos', []))
            print(f"[LLM] 요약 및 To-Do 추출 완료! (추출된 할 일: {todo_count}건)")
            
            return parsed_result
            
        except Exception as e:
            print(f"[LLM_ERROR] Amazon Bedrock API 호출 또는 JSON 파싱 중 오류 발생: {e}")
            raise e
