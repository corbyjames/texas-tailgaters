#!/usr/bin/env python3
"""
Test Google Vision API integration for marine species identification
"""

import requests
import json
from PIL import Image, ImageDraw
import io

def create_marine_test_image():
    """Create a test image with marine-like features"""
    img = Image.new('RGB', (800, 600), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Draw fish-like shapes
    # Fish body (orange ellipse)
    draw.ellipse([200, 250, 400, 350], fill='orange', outline='darkorange', width=3)
    
    # Fish tail
    draw.polygon([(400, 300), (450, 270), (450, 330)], fill='orange', outline='darkorange')
    
    # Fish eye
    draw.ellipse([230, 280, 250, 300], fill='white', outline='black')
    draw.ellipse([235, 285, 245, 295], fill='black')
    
    # Fish stripes (like clownfish)
    draw.rectangle([260, 260, 280, 340], fill='white', outline='white')
    draw.rectangle([320, 260, 340, 340], fill='white', outline='white')
    
    # Add some coral-like shapes
    draw.ellipse([100, 450, 200, 550], fill='coral', outline='darkred')
    draw.ellipse([500, 450, 600, 550], fill='pink', outline='hotpink')
    
    # Add water effect
    for y in range(0, 600, 50):
        draw.arc([0, y, 800, y + 100], 0, 180, fill='white', width=1)
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    
    return img_bytes

def download_real_image():
    """Download a real marine life image from a public source"""
    # Using a public domain clownfish image
    url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg/640px-Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("✅ Downloaded real clownfish image")
            return io.BytesIO(response.content)
    except:
        pass
    
    print("⚠️ Could not download real image, using generated image")
    return None

def test_identification():
    """Test the identification endpoint"""
    print("\n" + "="*50)
    print("Testing Google Vision API Integration")
    print("="*50)
    
    # Try to get a real image first
    img_data = download_real_image()
    
    if not img_data:
        # Fall back to generated image
        print("📸 Creating test marine image...")
        img_data = create_marine_test_image()
    
    # Prepare the request
    url = "http://localhost:8000/api/v1/identify"
    
    files = {
        'file': ('test_fish.jpg', img_data, 'image/jpeg')
    }
    
    data = {
        'lat': -18.2871,  # Great Barrier Reef coordinates
        'lon': 147.6992,
        'save_image': 'false'  # Don't save to avoid filling storage
    }
    
    # Send identification request
    print("\n🔍 Sending image for identification...")
    
    try:
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n✅ Identification Results:")
            print("-" * 30)
            
            if result.get('status') == 'success':
                predictions = result.get('predictions', [])
                
                if predictions:
                    print(f"Found {len(predictions)} possible species:\n")
                    
                    for i, pred in enumerate(predictions, 1):
                        print(f"{i}. {pred.get('common_name', 'Unknown')}")
                        if pred.get('scientific_name'):
                            print(f"   Scientific: {pred['scientific_name']}")
                        print(f"   Confidence: {pred.get('confidence', 0)*100:.1f}%")
                        if pred.get('source'):
                            print(f"   Source: {pred['source']}")
                        if pred.get('original_label'):
                            print(f"   Original label: {pred['original_label']}")
                        print()
                else:
                    print("No species detected")
            else:
                print(f"Status: {result.get('status')}")
                print(f"Message: {result.get('message', 'No message')}")
            
            # Show raw response for debugging
            print("\n📋 Raw Response:")
            print(json.dumps(result, indent=2)[:500] + "...")
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_api_key():
    """Check if API key is configured"""
    print("\n🔑 Checking API configuration...")
    
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        
        # Check if we can access the endpoint
        response = requests.post("http://localhost:8000/api/v1/identify")
        if response.status_code == 422:  # Expected when no file provided
            print("✅ Identification endpoint is accessible")
            
    except Exception as e:
        print(f"❌ Backend check failed: {e}")

def main():
    print("🐠 Marine Life ID - Google Vision API Test")
    
    # Check API configuration
    test_api_key()
    
    # Test identification
    test_identification()
    
    print("\n" + "="*50)
    print("Test completed!")
    print("\nNote: If you see mock data, check that:")
    print("1. Google Vision API key is set in docker-compose.yml")
    print("2. Backend container was restarted")
    print("3. google-cloud-vision package is installed")

if __name__ == "__main__":
    main()