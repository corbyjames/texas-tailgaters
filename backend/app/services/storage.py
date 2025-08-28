from minio import Minio
from minio.error import S3Error
import io
import logging
from typing import Optional, BinaryIO
from app.core.config import settings
import hashlib
from datetime import timedelta

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created bucket: {self.bucket}")
        except S3Error as e:
            logger.error(f"Error creating bucket: {e}")
            raise
    
    def upload_image(self, file_data: BinaryIO, filename: str, content_type: str = "image/jpeg") -> dict:
        """Upload image to MinIO"""
        try:
            # Read file data into memory
            file_bytes = file_data.read()
            file_data.seek(0)
            
            # Generate unique filename using hash
            file_hash = hashlib.md5(file_bytes).hexdigest()
            
            # Determine file extension
            ext = filename.split('.')[-1] if '.' in filename else 'jpg'
            stored_filename = f"{file_hash}.{ext}"
            
            # Create BytesIO object for upload
            file_stream = io.BytesIO(file_bytes)
            file_size = len(file_bytes)
            
            # Upload to MinIO
            result = self.client.put_object(
                self.bucket,
                stored_filename,
                file_stream,
                length=file_size,
                content_type=content_type
            )
            
            logger.info(f"Uploaded image: {stored_filename}")
            
            return {
                "filename": stored_filename,
                "original_filename": filename,
                "etag": result.etag,
                "size": file_size,
                "bucket": self.bucket
            }
            
        except S3Error as e:
            logger.error(f"Error uploading image: {e}")
            raise
    
    def get_image_url(self, filename: str, expires: int = 3600) -> str:
        """Get direct public URL for image"""
        # Since bucket is public, we can use direct URL
        return f"http://localhost:9000/{self.bucket}/{filename}"
    
    def delete_image(self, filename: str) -> bool:
        """Delete image from MinIO"""
        try:
            self.client.remove_object(self.bucket, filename)
            logger.info(f"Deleted image: {filename}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting image: {e}")
            return False
    
    def get_image(self, filename: str) -> bytes:
        """Get image data from MinIO"""
        try:
            response = self.client.get_object(self.bucket, filename)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Error getting image: {e}")
            raise
    
    def list_images(self, prefix: Optional[str] = None) -> list:
        """List all images in bucket"""
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix)
            return [
                {
                    "name": obj.object_name,
                    "size": obj.size,
                    "modified": obj.last_modified
                }
                for obj in objects
            ]
        except S3Error as e:
            logger.error(f"Error listing images: {e}")
            return []

# Global storage instance
storage_service = StorageService()