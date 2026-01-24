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
        self.s3_client = None
        self.bucket_name = settings.S3_BUCKET_NAME
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize S3 client - gracefully handles failures without crashing"""
        try:
            # Only initialize if we have valid-looking credentials
            if not settings.S3_ACCESS_KEY or settings.S3_ACCESS_KEY == "minioadmin":
                # Check if we're in production (not localhost endpoint)
                if settings.S3_ENDPOINT and "localhost" not in settings.S3_ENDPOINT:
                    print(f"Warning: S3_ACCESS_KEY appears to be default value. Storage may not work in production.")
                    print(f"Please set S3_ACCESS_KEY and S3_SECRET_KEY in Railway environment variables.")
            
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                use_ssl=settings.S3_USE_SSL
            )
            self._ensure_bucket_exists()
        except Exception as e:
            # Never crash on storage initialization - just log and continue
            print(f"Warning: Could not initialize storage service: {e}")
            print(f"MinIO/S3 may not be running at {settings.S3_ENDPOINT}")
            print(f"Application will continue without file storage. Configure S3 credentials to enable file uploads.")
            self.s3_client = None
    
    def _reinitialize_if_needed(self):
        """Reinitialize client if it's None (lazy initialization)"""
        if self.s3_client is None:
            self._initialize_client()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        if not self.s3_client:
            return
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                # Don't fail startup if bucket creation fails - just log warning
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                if error_code == 'InvalidAccessKeyId':
                    print(f"Warning: S3 credentials invalid. Storage will not be available until S3_ACCESS_KEY and S3_SECRET_KEY are configured correctly.")
                else:
                    print(f"Warning: Could not create bucket: {e}")
                # Don't set s3_client to None here - let it try again later
    
    def _check_connection(self):
        """Check if storage service is available"""
        if not self.s3_client:
            raise ConnectionError(
                f"Storage service not available. Please ensure MinIO/S3 is running at {settings.S3_ENDPOINT}"
            )
    
    def upload_file(self, file_content: bytes, user_id: str, filename: str) -> str:
        """
        Upload file to object storage
        Returns: file path in storage
        """
        # Try to reinitialize if client is None
        self._reinitialize_if_needed()
        self._check_connection()
        
        file_key = f"transcripts/{user_id}/{uuid.uuid4()}/{filename}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType="application/pdf"
            )
            return file_key
        except ClientError as e:
            # Try to reinitialize and retry once
            self.s3_client = None
            self._reinitialize_if_needed()
            if self.s3_client is None:
                raise ConnectionError(
                    f"Storage service not available. Please ensure MinIO/S3 is running at {settings.S3_ENDPOINT}"
                )
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=file_content,
                    ContentType="application/pdf"
                )
                return file_key
            except ClientError as retry_error:
                raise ConnectionError(
                    f"Failed to upload file to storage: {str(retry_error)}. "
                    f"Please ensure MinIO/S3 is running at {settings.S3_ENDPOINT}"
                )
    
    def download_file(self, file_key: str) -> Optional[bytes]:
        """Download file from object storage"""
        if self.s3_client is None:
            self._reinitialize_if_needed()
        if not self.s3_client:
            return None
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
            return response['Body'].read()
        except ClientError:
            return None
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from object storage"""
        # Try to reinitialize if client is None
        if self.s3_client is None:
            self._reinitialize_if_needed()
        
        # If still None, storage is not available - return False but don't raise
        if not self.s3_client:
            print(f"Warning: Storage service not available, skipping file deletion: {file_key}")
            return False
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except (ClientError, AttributeError) as e:
            print(f"Warning: Could not delete file from storage: {file_key}, error: {e}")
            return False
    
    def get_file_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL for file access"""
        # Try to reinitialize if client is None
        if self.s3_client is None:
            self._reinitialize_if_needed()
        
        # If still None, storage is not available - return empty string
        if not self.s3_client:
            print(f"Warning: Storage service not available, cannot generate URL for: {file_key}")
            return ""
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expires_in
            )
            return url
        except (ClientError, AttributeError) as e:
            print(f"Warning: Could not generate presigned URL for file: {file_key}, error: {e}")
            return ""


storage_service = StorageService()

