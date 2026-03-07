import sys
import time
import json
import boto3
from config import config
from core.stt_processor import STTProcessor
from core.llm_processor import LLMProcessor
from network.api_client import APIClient

class SQSListener:
    """
    AWS SQS를 24시간 실시간 모니터링하며(Long Polling), 
    신규 음성 파일 업로드 이벤트가 발생하면 STT -> LLM -> API Client 순서로
    전체 파이프라인을 조립하고 실행하는 메인 지휘통제(Orchestrator) 모듈입니다.
    """
    def __init__(self):
        print(f"[SQS] 초기화 시작... (Region: {config.AWS_REGION})")
        # boto3 sqs 클라이언트 생성
        self.sqs = boto3.client(
            'sqs',
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
        
        # 추후 TA가 생성한 SQS 큐 URL을 환경변수(.env)에서 로드
        self.queue_url = config.SQS_QUEUE_URL 
        
        # 파이프라인의 각 기능 컴포넌트(부품) 조립
        self.stt = STTProcessor()
        self.llm = LLMProcessor()
        self.api = APIClient()

    def process_message(self, message: dict):
        """
        단일 SQS 메시지를 파싱하여 AI 파이프라인을 온전히 한 사이클 실행합니다.
        문제가 생기면 Exception을 발생시켜 재처리(Retry) 로직을 타게 합니다.
        """
        try:
            body = json.loads(message['Body'])
            meeting_id = body.get('meeting_id')
            audio_s3_key = body.get('audio_s3_key')
            
            if not meeting_id or not audio_s3_key:
                raise ValueError("메시지에 필수 필드(meeting_id, audio_s3_key)가 누락되었습니다.")

            # 프론트/TA가 단순히 key만 보냈을 때를 대비해 정식 "s3://버킷/키" 형태로 컨버팅
            s3_uri = audio_s3_key if audio_s3_key.startswith("s3://") else f"s3://{config.S3_BUCKET_NAME}/{audio_s3_key}"

            print(f"\n[PIPELINE] >>> 회의록 분석 파이프라인 시작 (Meeting: {meeting_id}, S3: {s3_uri})")
            
            # 1. 상태 업데이트: 분석 전처리 시작 (PROCESSING)
            self.api.update_meeting_status(meeting_id, "PROCESSING")
            
            # 2. STT 변환 (오디오 -> 텍스트)
            transcript_text = self.stt.process_audio(s3_uri)
            
            # 3. LLM 변환 (텍스트 -> JSON 요약/할일)
            llm_result = self.llm.process_transcript(transcript_text)
            
            # 5. 최종 결과 Core API로 전송 및 완료 상태(COMPLETED)로 변경
            summary_data = {
                "summary": llm_result.get("summary", ""),
                "decisions": llm_result.get("decisions", "")
            }
            todo_data = llm_result.get("todos", [])
            
            self.api.submit_ai_result(meeting_id, transcript_text, summary_data, todo_data)
            
            print(f"[PIPELINE] <<< 파이프라인 성공적 종료 (Meeting: {meeting_id})\n")
            
        except Exception as e:
            print(f"[PIPELINE_ERROR] 파이프라인 실행 중 치명적 오류: {e}")
            # 여기서 에러를 던져야 부모 루프에서 재시도(Retry)나 SQS 큐 유지 처리를 할 수 있음
            raise e

    def start_polling(self):
        """
        무한 루프를 돌며 SQS를 모니터링합니다. (20초 Long Polling 방식)
        """
        print(f"[SQS] 20초 롱 폴링(Long Polling) 대기 시작... (Queue: {self.queue_url})")
        
        while True:
            try:
                # SQS로부터 메시지 수신 (최대 20초 대기)
                response = self.sqs.receive_message(
                    QueueUrl=self.queue_url,
                    MaxNumberOfMessages=1,         # 한 번에 하나씩 처리하여 안정성 확보
                    WaitTimeSeconds=20,            # 비용 절감 및 타임아웃 방지 (Long Polling)
                    MessageAttributeNames=['All']
                )

                messages = response.get('Messages', [])
                if not messages:
                    # 메시지가 없으면 조용히 다음 루프로 넘어감
                    continue
                
                # 메시지 루프 처리
                for msg in messages:
                    receipt_handle = msg['ReceiptHandle']
                    
                    try:
                        # 파이프라인 처리
                        self.process_message(msg)
                        
                        # 처리가 무사히 끝났으므로 SQS에서 메시지 삭제 (Ack)
                        self.sqs.delete_message(
                            QueueUrl=self.queue_url,
                            ReceiptHandle=receipt_handle
                        )
                    except Exception as e:
                        print(f"[SQS_RETRY] {e} -> 메시지 처리 실패, 큐에 그대로 냅두어 재처리 유도.")
                        # 재처리 횟수 파악이나 Dead Line Queue 처리는 SQS 콘솔 설정(3회 제한)에 맡김
                        
            except KeyboardInterrupt:
                print("종료 신호 감지. SQS 리스너를 정지합니다.")
                sys.exit(0)
            except Exception as e:
                print(f"[SQS_FATAL] Polling 중 문제 발생: {e}")
                time.sleep(10) # 뻗지 않도록 약간 대기 후 다시 시도

if __name__ == "__main__":
    listener = SQSListener()
    listener.start_polling()
