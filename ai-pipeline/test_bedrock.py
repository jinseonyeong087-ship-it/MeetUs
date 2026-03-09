import os
import boto3
from dotenv import load_dotenv

load_dotenv()

client = boto3.client(
    'bedrock',
    region_name=os.getenv('AWS_REGION', 'ap-northeast-2'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

response = client.list_foundation_models()
for model in response['modelSummaries']:
    if 'anthropic.claude' in model['modelId']:
        print(f"Model ID: {model['modelId']}, Inference Types: {model.get('inferenceTypesSupported', [])}")

response2 = client.list_inference_profiles()
for profile in response2['inferenceProfileSummaries']:
    if 'anthropic.claude' in profile.get('models', [{}])[0].get('modelArn', ''):
        print(f"Profile ARN: {profile['inferenceProfileArn']}, Profile ID: {profile['inferenceProfileId']}")

