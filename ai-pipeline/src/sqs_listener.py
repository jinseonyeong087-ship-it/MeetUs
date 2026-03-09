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
    신규 음성 파일 업로드 이벤트가 발생하면 STT -> LLM -> DB Client 순서로
    전체 파이프라인을 조립하고 실행하는 메인 지휘통제(Orchestrator) 모듈입니다.
    """
    def __init__(self):
        print(f"[SQS] Initializing... (Region: {config.AWS_REGION})")
        # boto3 sqs 클라이언트 생성
        self.sqs = boto3.client(
            'sqs',
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
        
        # 환경변수(.env)에서 SQS 큐 URL 로드
        self.queue_url = config.SQS_QUEUE_URL 
        
        # 파이프라인 각 컴포넌트 조립
        self.stt = STTProcessor()
        self.llm = LLMProcessor()
        self.api = APIClient()

    def process_message(self, message: dict):
        """
        단일 SQS 메시지를 파싱하여 AI 파이프라인 전체 사이클을 실행합니다.
        실패 시 예외를 발생시켜 SQS 재처리 로직이 작동하도록 합니다.
        """
        try:
            body = json.loads(message['Body'])
            meeting_id = body.get('meeting_id')
            audio_s3_key = body.get('audio_s3_key')
            
            if not meeting_id or not audio_s3_key:
                raise ValueError("메시지에 필수 필드(meeting_id, audio_s3_key)가 누락되었습니다.")

            # S3 URI 형식 보정 (s3://bucket/key)
            s3_uri = audio_s3_key if audio_s3_key.startswith("s3://") else f"s3://{config.S3_BUCKET_NAME}/{audio_s3_key}"

            print(f"\n[PIPELINE] >>> Starting analysis pipeline (Meeting ID: {meeting_id}, S3 URI: {s3_uri})")
            
            # 1. 상태 확인: PROCESSING 상태는 백엔드 발행 시점에 이미 변경됨을 가정 (Master Spec v1.0)
            
            # 2. STT 변환 (음성 -> 텍스트)
            transcript_text = self.stt.process_audio(s3_uri)
            
            # 3. LLM 분석 (텍스트 -> 요약/결정사항/할일)
            llm_result = self.llm.process_transcript(transcript_text)
            
            # 4. 데이터 가공
            summary_data = {
                "summary": llm_result.get("summary", ""),
                "decisions": llm_result.get("decisions", "")
            }
            todo_data = llm_result.get("todos", [])
            
            # 5. 최종 결과 Webhook 발송 (백엔드 Core API가 DB 적재 및 COMPLETED 상태 변경)
            self.api.submit_ai_result(meeting_id, transcript_text, summary_data, todo_data)
            
            print(f"[PIPELINE] <<< Pipeline completed successfully (Meeting ID: {meeting_id})\n")
            
        except Exception as e:
            print(f"[PIPELINE_ERROR] Fatal error during pipeline execution: {e}")
            raise e

    def start_polling(self):
        """
        24시간 무한 루프를 돌며 SQS 대기열을 감시합니다. (20초 롱 폴링 방식)
        """
        print(f"[SQS] Waiting for messages (Long Polling 20s)... (Queue: {self.queue_url})")
        
        while True:
            try:
                # SQS로부터 메시지 수신 (최대 20초 대기)
                response = self.sqs.receive_message(
                    QueueUrl=self.queue_url,
                    MaxNumberOfMessages=1,         # 안정성을 위해 한 번에 한 건씩 처리
                    WaitTimeSeconds=20,            # 롱 폴링 설정 (비용 절감 및 효율화)
                    MessageAttributeNames=['All']
                )

                messages = response.get('Messages', [])
                if not messages:
                    # 메시지가 없으면 다음 주기로 넘어감
                    continue
                
                for msg in messages:
                    receipt_handle = msg['ReceiptHandle']
                    
                    try:
                        # 파이프라인 엔진 가동
                        self.process_message(msg)
                        
                        # 성공 시 SQS에서 메시지 영구 제거 (Ack)
                        self.sqs.delete_message(
                            QueueUrl=self.queue_url,
                            ReceiptHandle=receipt_handle
                        )
                    except Exception as e:
                        print(f"[SQS_RETRY] {e} -> Processing failed. Leaving message in queue for retry.")
                        
            except KeyboardInterrupt:
                print("[SQS] Termination signal received. Stopping listener...")
                sys.exit(0)
            except Exception as e:
                print(f"[SQS_FATAL] Error during polling: {e}")
                time.sleep(10) # 10초 대기 후 루프 재시도


if __name__ == "__main__":
    listener = SQSListener()
    listener.start_polling()
