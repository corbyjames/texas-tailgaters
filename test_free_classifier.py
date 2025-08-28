#!/usr/bin/env python3
"""Test the free marine classifier with different colored images"""

import requests
from PIL import Image, ImageDraw
from io import BytesIO
import time

def create_test_images():
    """Create test images with different characteristics"""
    images = []
    
    # Orange fish (should detect clownfish)
    img1 = Image.new('RGB', (400, 300), color='#1e40af')  # Blue background
    draw = ImageDraw.Draw(img1)
    draw.ellipse([150, 100, 250, 200], fill='orange')  # Orange body
    draw.rectangle([180, 120, 190, 180], fill='white')  # White stripe
    draw.rectangle([210, 120, 220, 180], fill='white')  # White stripe
    images.append(("orange_fish.jpg", img1, "Should detect clownfish"))
    
    # Blue fish (should detect blue tang)
    img2 = Image.new('RGB', (400, 300), color='#0a4f8a')
    draw = ImageDraw.Draw(img2)
    draw.ellipse([150, 100, 250, 200], fill='#0080ff')  # Blue body
    draw.polygon([(250, 150), (280, 130), (280, 170)], fill='yellow')  # Yellow tail
    images.append(("blue_fish.jpg", img2, "Should detect blue tang"))
    
    # Gray torpedo shape (should detect shark)
    img3 = Image.new('RGB', (400, 300), color='#1a3a52')
    draw = ImageDraw.Draw(img3)
    draw.ellipse([100, 125, 300, 175], fill='gray')  # Torpedo body
    draw.polygon([(300, 150), (350, 130), (350, 170)], fill='gray')  # Tail fin
    draw.polygon([(180, 125), (200, 100), (220, 125)], fill='gray')  # Dorsal fin
    images.append(("gray_shark.jpg", img3, "Should detect shark"))
    
    # Green round shape (should detect turtle)
    img4 = Image.new('RGB', (400, 300), color='#0a4f8a')
    draw = ImageDraw.Draw(img4)
    draw.ellipse([150, 100, 250, 200], fill='#2d5016')  # Green shell
    # Pattern on shell
    for i in range(3):
        for j in range(3):
            x = 170 + i * 25
            y = 120 + j * 25
            draw.rectangle([x, y, x+20, y+20], outline='#4a7c2e', width=2)
    images.append(("green_turtle.jpg", img4, "Should detect turtle"))
    
    # Translucent umbrella shape (should detect jellyfish)
    img5 = Image.new('RGB', (400, 300), color='#0a3f7a')
    draw = ImageDraw.Draw(img5)
    # Bell shape
    draw.ellipse([150, 100, 250, 180], fill='#ffccee', outline='#ff99dd')
    # Tentacles
    for i in range(5):
        x = 170 + i * 20
        draw.line([(x, 180), (x + 10, 250)], fill='#ff99dd', width=2)
    images.append(("pink_jellyfish.jpg", img5, "Should detect jellyfish"))
    
    return images

def test_classifier():
    """Test the free classifier with various images"""
    print("=" * 60)
    print("TESTING FREE MARINE CLASSIFIER")
    print("=" * 60)
    
    test_images = create_test_images()
    
    for filename, img, description in test_images:
        print(f"\n🖼️  Testing: {filename}")
        print(f"   {description}")
        print("-" * 40)
        
        # Convert to bytes
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Make API request
        try:
            response = requests.post(
                'http://localhost:8000/api/v1/identify/',
                files={'file': (filename, img_bytes, 'image/jpeg')},
                data={'save_image': 'false'}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('predictions'):
                    print("   Results:")
                    for i, pred in enumerate(result['predictions'], 1):
                        conf = pred['confidence'] * 100
                        print(f"   {i}. {pred['common_name']} ({conf:.1f}% confidence)")
                else:
                    print("   No predictions")
            else:
                print(f"   Error: {response.status_code}")
                
        except Exception as e:
            print(f"   Error: {e}")
        
        time.sleep(0.5)  # Small delay between requests
    
    print("\n" + "=" * 60)
    print("✅ Testing complete!")
    print("\nNOTE: The free classifier uses color and shape analysis")
    print("instead of AI models, so results are approximate but FREE!")

if __name__ == "__main__":
    test_classifier()