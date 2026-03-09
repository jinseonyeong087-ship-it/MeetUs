import boto3
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

BUCKET = os.getenv("S3_BUCKET")


def generate_upload_url(meeting_id: str):

    key = f"audio/{meeting_id}/{uuid.uuid4()}.wav"

    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET,
            "Key": key,
            "ContentType": "audio/wav"
        },
        ExpiresIn=3600
    )

    return {
        "upload_url": url,
        "s3_key": key
    }