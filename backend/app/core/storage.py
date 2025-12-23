"""
Object Storage Service (S3/MinIO)
"""
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
from typing import Optional


class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            use_ssl=settings.S3_USE_SSL
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket_name)
    
    def upload_file(self, file_content: bytes, user_id: str, filename: str) -> str:
        """
        Upload file to object storage
        Returns: file path in storage
        """
        file_key = f"transcripts/{user_id}/{uuid.uuid4()}/{filename}"
        
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=file_key,
            Body=file_content,
            ContentType="application/pdf"
        )
        
        return file_key
    
    def download_file(self, file_key: str) -> Optional[bytes]:
        """Download file from object storage"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
            return response['Body'].read()
        except ClientError:
            return None
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from object storage"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError:
            return False
    
    def get_file_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL for file access"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expires_in
            )
            return url
        except ClientError:
            return ""


storage_service = StorageService()

