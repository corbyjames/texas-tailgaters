#!/usr/bin/env python3
"""
Initialize MinIO bucket for marine images
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from minio import Minio
from minio.error import S3Error
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_minio():
    """Initialize MinIO with bucket"""
    
    # MinIO configuration
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "marine-images")
    
    try:
        # Create MinIO client
        client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        
        # Check if bucket exists
        if not client.bucket_exists(MINIO_BUCKET):
            # Create bucket
            client.make_bucket(MINIO_BUCKET)
            logger.info(f"✅ Created bucket: {MINIO_BUCKET}")
            
            # Set bucket policy to allow public read (for image URLs)
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{MINIO_BUCKET}/*"]
                    }
                ]
            }
            
            import json
            client.set_bucket_policy(MINIO_BUCKET, json.dumps(policy))
            logger.info(f"✅ Set public read policy for bucket: {MINIO_BUCKET}")
        else:
            logger.info(f"✅ Bucket already exists: {MINIO_BUCKET}")
        
        # List buckets to verify
        buckets = client.list_buckets()
        logger.info(f"📦 Available buckets: {[b.name for b in buckets]}")
        
        return True
        
    except S3Error as e:
        logger.error(f"❌ MinIO error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = init_minio()
    if success:
        print("\n✅ MinIO initialized successfully!")
        print("   Bucket: marine-images")
        print("   Access via: http://localhost:9001")
        print("   Credentials: minioadmin / minioadmin123")
    else:
        print("\n❌ Failed to initialize MinIO")
        sys.exit(1)