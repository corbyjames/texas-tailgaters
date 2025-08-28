#!/usr/bin/env python3
"""
Test image upload functionality
"""

import requests
import os
from PIL import Image
import io
import json

# Create a test image
def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (800, 600), color='blue')
    
    # Add some variation
    pixels = img.load()
    for i in range(100, 200):
        for j in range(100, 200):
            pixels[i, j] = (255, 255, 0)  # Yellow square
    
    for i in range(300, 400):
        for j in range(300, 400):
            pixels[i, j] = (0, 255, 0)  # Green square
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def test_upload():
    """Test uploading an image"""
    print("🧪 Testing Image Upload to Marine Life ID System")
    
    # API endpoint
    url = "http://localhost:8000/api/v1/images/upload"
    
    # Create test image
    print("📸 Creating test image...")
    img_data = create_test_image()
    
    # Prepare multipart form data
    files = {
        'file': ('test_marine_life.jpg', img_data, 'image/jpeg')
    }
    
    data = {
        'location': 'Test Location - Great Barrier Reef',
        'latitude': -18.2871,
        'longitude': 147.6992,
        'description': 'Test image upload with colorful squares representing marine life'
    }
    
    # Upload image
    print("📤 Uploading image...")
    try:
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload successful!")
            print(f"   Image ID: {result.get('id')}")
            print(f"   Filename: {result.get('filename')}")
            print(f"   URL: {result.get('url')}")
            
            # Test retrieving the image
            if result.get('id'):
                test_retrieve(result['id'])
            
            return result
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_retrieve(image_id):
    """Test retrieving image details"""
    print(f"\n📥 Retrieving image {image_id}...")
    
    url = f"http://localhost:8000/api/v1/images/{image_id}"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Image retrieved successfully!")
            print(f"   Original name: {result.get('original_filename')}")
            print(f"   Location: {result.get('location_name')}")
            print(f"   Upload date: {result.get('upload_date')}")
        else:
            print(f"❌ Retrieval failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_list_images():
    """Test listing all images"""
    print("\n📋 Listing all images...")
    
    url = "http://localhost:8000/api/v1/images/"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result.get('count', 0)} images")
            
            for img in result.get('images', [])[:3]:  # Show first 3
                print(f"   - {img.get('original_filename', 'Unknown')} (ID: {img.get('id')})")
        else:
            print(f"❌ List failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("=" * 50)
    print("Marine Life ID - Image Storage Test")
    print("=" * 50)
    
    # Test upload
    result = test_upload()
    
    # Test listing
    test_list_images()
    
    print("\n✅ All tests completed!")
    print("\nYou can now:")
    print("1. Visit http://localhost:3000 and click 'Gallery' to see the uploaded images")
    print("2. Visit http://localhost:9001 to access MinIO console")
    print("3. Use the 'Identify' page to upload and identify species")

if __name__ == "__main__":
    main()