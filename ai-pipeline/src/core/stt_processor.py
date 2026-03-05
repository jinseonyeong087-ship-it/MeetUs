import time
import uuid
import json
import urllib.request
import boto3
from ..config import config

class STTProcessor:
    """
    AWS Transcribe API와 통신하여 오디오 파일(m4a)을 텍스트로 변환하는 코어 로직입니다.
    이 모듈은 SQS나 DB에 대해 모르며, 오직 STT 변환 역할만 수행합니다. (Single Responsibility)
    """
    def __init__(self):
        # config.py를 통해 로드된 환경변수 적용
        self.transcribe_client = boto3.client(
            'transcribe',
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
        
    def process_audio(self, s3_uri: str) -> str:
        """
        S3 URI를 받아 AWS Transcribe 작업을 시작하고, 완료되면 전체 텍스트를 반환합니다.
        
        :param s3_uri: "s3://my-bucket/path/to/meeting.m4a" 형태의 오디오 URI
        :return: 변환 완료된 원본 텍스트 (Transcript)
        """
        # 충돌 방지를 위해 UUID를 사용한 고유한 Job 이름 생성
        job_name = f"ai_minutes_job_{uuid.uuid4().hex}"
        
        print(f"[STT] AWS Transcribe 작업 시작 (Job: {job_name}, URI: {s3_uri})")
        
        # 1. Transcribe Job 시작
        try:
            self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': s3_uri},
                MediaFormat='m4a', # 프론트엔드 명세와 동일하게 m4a 한정
                LanguageCode='ko-KR' # 항상 한국어 회의로 가정
            )
        except Exception as e:
            print(f"[STT_ERROR] 작업 시작 실패: {e}")
            raise e

        # 2. 작업 완료 대기 (Polling)
        while True:
            response = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
            status = response['TranscriptionJob']['TranscriptionJobStatus']
            
            if status == 'COMPLETED':
                print(f"[STT] Job '{job_name}' 처리 완료!")
                # 완료 시 AWS가 제공하는 결과물(JSON)이 저장된 임시 URL 주소
                transcript_file_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
                break
            elif status == 'FAILED':
                error_msg = response['TranscriptionJob'].get('FailureReason', 'Unknown error')
                print(f"[STT_ERROR] Job '{job_name}' 실패: {error_msg}")
                raise Exception(f"AWS Transcribe failed: {error_msg}")
            
            # 처리 중인 경우 5초 대기 후 다시 확인
            time.sleep(5)
            
        # 3. 결과 JSON 파일 다운로드 및 파싱
        try:
            # 외부 라이브러리(requests) 없이 내장 urllib 사용으로 경량화
            with urllib.request.urlopen(transcript_file_uri) as res:
                data = json.loads(res.read().decode('utf-8'))
                # AWS Transcribe 결과 구조에서 문장만 확실하게 뽑아내기
                transcript_text = data['results']['transcripts'][0]['transcript']
                
                print(f"[STT] 텍스트 파싱 성공. (길이: {len(transcript_text)}자)")
                return transcript_text
        except Exception as e:
            print(f"[STT_ERROR] 결과 JSON 파싱 실패: {e}")
            raise e
