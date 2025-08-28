#!/usr/bin/env python3
"""Test script for species identification API"""

import requests
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import base64

def create_test_image():
    """Create a simple test image"""
    # Create a blue ocean-like image with a fish shape
    img = Image.new('RGB', (800, 600), color='#1e40af')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple fish shape
    # Body (ellipse)
    draw.ellipse([300, 250, 500, 350], fill='orange', outline='white', width=3)
    
    # Tail
    draw.polygon([(500, 300), (550, 270), (550, 330)], fill='orange', outline='white', width=2)
    
    # Eye
    draw.ellipse([340, 285, 360, 305], fill='white')
    draw.ellipse([345, 290, 355, 300], fill='black')
    
    # Stripes
    draw.rectangle([380, 270, 390, 330], fill='white')
    draw.rectangle([420, 270, 430, 330], fill='white')
    
    # Save to bytes
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def test_identification():
    """Test the identification endpoint"""
    print("🐠 Testing Marine Life Identification System")
    print("=" * 50)
    
    # Create test image
    print("Creating test image...")
    img_bytes = create_test_image()
    
    # Prepare the request
    url = "http://localhost:8000/api/v1/identify/"
    files = {'file': ('test_fish.jpg', img_bytes, 'image/jpeg')}
    data = {
        'save_image': 'true',
        'lat': '-18.2871',
        'lon': '147.6992'
    }
    
    print(f"Sending request to {url}")
    print(f"Location: lat={data['lat']}, lon={data['lon']}")
    print()
    
    try:
        # Make the request
        response = requests.post(url, files=files, data=data)
        
        print(f"Response Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Identification Successful!")
            print("-" * 40)
            
            if result.get('status') == 'success' and result.get('predictions'):
                print(f"Found {len(result['predictions'])} possible species:")
                print()
                
                for i, pred in enumerate(result['predictions'], 1):
                    confidence_pct = pred.get('confidence', 0) * 100
                    print(f"{i}. {pred.get('common_name', 'Unknown')}")
                    print(f"   Scientific: {pred.get('scientific_name', 'Unknown')}")
                    print(f"   Confidence: {confidence_pct:.1f}%")
                    
                    if pred.get('conservation_status'):
                        print(f"   Conservation: {pred['conservation_status']}")
                    if pred.get('habitat'):
                        print(f"   Habitat: {pred['habitat']}")
                    print()
                
                if result.get('observation_id'):
                    print(f"📝 Observation saved with ID: {result['observation_id']}")
                    
            elif result.get('status') == 'no_species_detected':
                print("ℹ️ No marine species detected in the image")
            else:
                print("Response:", json.dumps(result, indent=2))
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_identification()