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
            # If storage isn't configured, don't attempt initialization
            # (especially important in production so we don't default to localhost)
            if not settings.S3_ENDPOINT or not settings.S3_ACCESS_KEY or not settings.S3_SECRET_KEY:
                self.s3_client = None
                return

            # Only initialize if we have valid-looking credentials
            if not settings.S3_ACCESS_KEY or settings.S3_ACCESS_KEY == "minioadmin":
                # Check if we're in production (not localhost endpoint)
                if settings.S3_ENDPOINT and "localhost" not in settings.S3_ENDPOINT:
                    print(f"Warning: S3_ACCESS_KEY appears to be default value. Storage may not work in production.")
                    print(f"Please set S3_ACCESS_KEY and S3_SECRET_KEY in Railway environment variables.")
            
            # If you want AWS S3, set:
            # - S3_ENDPOINT=https://s3.amazonaws.com (or regional endpoint)
            # - S3_ACCESS_KEY / S3_SECRET_KEY
            # For MinIO, set endpoint to your MinIO URL.
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT or None,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
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
    
    def _validate_bucket_name(self, bucket_name: str) -> bool:
        """Validate S3 bucket name according to AWS rules"""
        if not bucket_name:
            return False
        
        # S3 bucket name rules:
        # - 3-63 characters
        # - Only lowercase letters, numbers, dots, and hyphens
        # - Must start and end with a letter or number
        # - Cannot be formatted as an IP address
        # - Cannot contain consecutive dots
        
        if len(bucket_name) < 3 or len(bucket_name) > 63:
            return False
        
        # Check for valid characters
        import re
        if not re.match(r'^[a-z0-9][a-z0-9.-]*[a-z0-9]$', bucket_name):
            return False
        
        # Cannot contain consecutive dots
        if '..' in bucket_name:
            return False
        
        # Cannot be formatted as IP address
        if re.match(r'^\d+\.\d+\.\d+\.\d+$', bucket_name):
            return False
        
        return True
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        if not self.s3_client:
            return
        
        # Validate bucket name first
        if not self._validate_bucket_name(self.bucket_name):
            error_msg = (
                f"Invalid bucket name: '{self.bucket_name}'. "
                "S3 bucket names must be 3-63 characters, contain only lowercase letters, numbers, dots, and hyphens, "
                "and must start and end with a letter or number."
            )
            print(f"Warning: {error_msg}")
            raise ValueError(error_msg)
        
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                # Don't fail startup if bucket creation fails - just log warning
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                error_message = e.response.get('Error', {}).get('Message', str(e))
                
                if error_code == 'InvalidAccessKeyId':
                    print(f"Warning: S3 credentials invalid. Storage will not be available until S3_ACCESS_KEY and S3_SECRET_KEY are configured correctly.")
                elif error_code == 'InvalidBucketName':
                    print(f"Warning: Invalid bucket name '{self.bucket_name}': {error_message}")
                    print(f"  Bucket names must be 3-63 characters, lowercase, and follow AWS naming rules.")
                else:
                    print(f"Warning: Could not create bucket: {error_code} - {error_message}")
                # Don't set s3_client to None here - let it try again later
    
    def _check_connection(self):
        """Check if storage service is available"""
        if not self.s3_client:
            if not settings.S3_ENDPOINT or not settings.S3_ACCESS_KEY or not settings.S3_SECRET_KEY:
                raise ConnectionError(
                    "Storage service not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, "
                    "and S3_BUCKET_NAME in your deployment environment (e.g., Railway Variables)."
                )
            raise ConnectionError(
                f"Storage service not available. Please ensure MinIO/S3 is reachable at {settings.S3_ENDPOINT}"
            )
    
    def upload_file(self, file_content: bytes, user_id: str, filename: str) -> str:
        """
        Upload file to object storage
        Returns: file path in storage
        """
        # Try to reinitialize if client is None
        self._reinitialize_if_needed()
        self._check_connection()
        
        # Validate bucket name before attempting upload
        if not self._validate_bucket_name(self.bucket_name):
            raise ValueError(
                f"Invalid bucket name: '{self.bucket_name}'. "
                "S3 bucket names must be 3-63 characters, contain only lowercase letters, numbers, dots, and hyphens, "
                "and must start and end with a letter or number. "
                f"Please check S3_BUCKET_NAME environment variable in Railway."
            )
        
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
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            
            # Provide more specific error messages
            if error_code == 'InvalidBucketName':
                raise ValueError(
                    f"Invalid bucket name: '{self.bucket_name}'. {error_message}. "
                    "Please check S3_BUCKET_NAME environment variable in Railway. "
                    "Bucket names must be 3-63 characters, lowercase, and follow AWS naming rules."
                )
            elif error_code == 'NoSuchBucket':
                raise ConnectionError(
                    f"Bucket '{self.bucket_name}' does not exist. "
                    f"Please create the bucket in your S3 service or check S3_BUCKET_NAME in Railway."
                )
            elif error_code == 'InvalidAccessKeyId' or error_code == 'SignatureDoesNotMatch':
                raise ConnectionError(
                    f"S3 credentials are invalid. Please check S3_ACCESS_KEY and S3_SECRET_KEY in Railway."
                )
            
            # Try to reinitialize and retry once
            self.s3_client = None
            self._reinitialize_if_needed()
            if self.s3_client is None:
                raise ConnectionError(
                    f"Storage service not available. Please ensure MinIO/S3 is running at {settings.S3_ENDPOINT}. "
                    f"Check S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY environment variables in Railway."
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
                retry_error_code = retry_error.response.get('Error', {}).get('Code', 'Unknown')
                retry_error_message = retry_error.response.get('Error', {}).get('Message', str(retry_error))
                
                if retry_error_code == 'InvalidBucketName':
                    raise ValueError(
                        f"Invalid bucket name: '{self.bucket_name}'. {retry_error_message}. "
                        "Please check S3_BUCKET_NAME environment variable in Railway."
                    )
                
                raise ConnectionError(
                    f"Failed to upload file to storage: {retry_error_code} - {retry_error_message}. "
                    f"Please ensure MinIO/S3 is running at {settings.S3_ENDPOINT} and check your S3 configuration in Railway."
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

