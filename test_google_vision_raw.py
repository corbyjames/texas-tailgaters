#!/usr/bin/env python3
"""
Test Google Vision API directly to see raw response
"""

import requests
import json
import base64
from PIL import Image, ImageDraw
from io import BytesIO

# API configuration
API_KEY = "AIzaSyCjvoQWmAStl6_GUWLu_adIlo3wUldpCWM"
BASE_URL = "https://vision.googleapis.com/v1/images:annotate"

def create_fish_image():
    """Create a test image with a fish"""
    img = Image.new('RGB', (800, 600), color='#1e40af')
    draw = ImageDraw.Draw(img)
    
    # Draw fish body
    draw.ellipse([300, 250, 500, 350], fill='orange', outline='white', width=3)
    
    # Draw tail
    draw.polygon([(500, 300), (550, 270), (550, 330)], fill='orange', outline='white', width=2)
    
    # Draw eye
    draw.ellipse([340, 285, 360, 305], fill='white')
    draw.ellipse([345, 290, 355, 300], fill='black')
    
    # Draw stripes
    draw.rectangle([380, 270, 390, 330], fill='white')
    draw.rectangle([420, 270, 430, 330], fill='white')
    
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_google_vision():
    """Test Google Vision API and show raw response"""
    print("=" * 60)
    print("GOOGLE VISION API RAW RESPONSE TEST")
    print("=" * 60)
    
    # Create test image
    image_data = create_fish_image()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    # Prepare request
    request_data = {
        "requests": [{
            "image": {
                "content": image_base64
            },
            "features": [
                {"type": "LABEL_DETECTION", "maxResults": 10},
                {"type": "WEB_DETECTION", "maxResults": 5},
                {"type": "OBJECT_LOCALIZATION", "maxResults": 10}
            ]
        }]
    }
    
    print("\n📤 REQUEST STRUCTURE:")
    print("-" * 40)
    print("Features requested:")
    print("  • LABEL_DETECTION (10 max)")
    print("  • WEB_DETECTION (5 max)")
    print("  • OBJECT_LOCALIZATION (10 max)")
    
    # Make API request
    print("\n🌐 Making API request...")
    response = requests.post(
        f"{BASE_URL}?key={API_KEY}",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Response Status: {response.status_code}")
    
    result = response.json()
    
    # Check for errors
    if "error" in result:
        print("\n❌ API ERROR:")
        print("-" * 40)
        error = result["error"]
        print(f"Code: {error.get('code')}")
        print(f"Status: {error.get('status')}")
        print(f"Message: {error.get('message')}")
        
        if "details" in error:
            for detail in error["details"]:
                if detail.get("@type") == "type.googleapis.com/google.rpc.ErrorInfo":
                    print(f"\nReason: {detail.get('reason')}")
                    print(f"Domain: {detail.get('domain')}")
                    if "metadata" in detail:
                        print("Metadata:")
                        for k, v in detail["metadata"].items():
                            print(f"  • {k}: {v}")
        
        print("\n💡 This means billing needs to be enabled for the Google Cloud project")
        return
    
    # Parse successful response
    if "responses" in result:
        response_data = result["responses"][0]
        
        print("\n✅ SUCCESSFUL RESPONSE STRUCTURE:")
        print("-" * 40)
        
        # Label Detection Results
        if "labelAnnotations" in response_data:
            labels = response_data["labelAnnotations"]
            print(f"\n📌 LABEL DETECTION ({len(labels)} labels found):")
            for i, label in enumerate(labels[:5], 1):
                confidence = label.get("score", 0) * 100
                print(f"  {i}. {label.get('description')} (confidence: {confidence:.1f}%)")
                print(f"     • MID: {label.get('mid', 'N/A')}")
                print(f"     • Topicality: {label.get('topicality', 0):.3f}")
            
            if len(labels) > 5:
                print(f"  ... and {len(labels) - 5} more labels")
        
        # Web Detection Results
        if "webDetection" in response_data:
            web = response_data["webDetection"]
            
            if "webEntities" in web:
                entities = web["webEntities"]
                print(f"\n🌐 WEB ENTITIES ({len(entities)} found):")
                for i, entity in enumerate(entities[:3], 1):
                    score = entity.get("score", 0)
                    print(f"  {i}. {entity.get('description', 'No description')}")
                    print(f"     • Score: {score:.3f}")
                    print(f"     • Entity ID: {entity.get('entityId', 'N/A')}")
            
            if "bestGuessLabels" in web:
                print(f"\n🎯 BEST GUESS LABELS:")
                for label in web["bestGuessLabels"]:
                    print(f"  • {label.get('label')}")
            
            if "visuallySimilarImages" in web:
                similar = web["visuallySimilarImages"]
                print(f"\n🖼️ VISUALLY SIMILAR IMAGES: {len(similar)} found")
            
            if "pagesWithMatchingImages" in web:
                pages = web["pagesWithMatchingImages"]
                print(f"\n📄 PAGES WITH MATCHING IMAGES: {len(pages)} found")
        
        # Object Localization Results
        if "localizedObjectAnnotations" in response_data:
            objects = response_data["localizedObjectAnnotations"]
            print(f"\n📦 OBJECT LOCALIZATION ({len(objects)} objects found):")
            for i, obj in enumerate(objects[:3], 1):
                confidence = obj.get("score", 0) * 100
                print(f"  {i}. {obj.get('name')} (confidence: {confidence:.1f}%)")
                if "boundingPoly" in obj:
                    vertices = obj["boundingPoly"].get("normalizedVertices", [])
                    if vertices:
                        print(f"     • Bounding box: ({vertices[0].get('x', 0):.2f}, {vertices[0].get('y', 0):.2f})")
        
        # Full JSON structure
        print("\n📋 FULL JSON RESPONSE STRUCTURE:")
        print("-" * 40)
        print(json.dumps(result, indent=2)[:2000])
        if len(json.dumps(result)) > 2000:
            print("... (truncated)")
        
        # Save full response
        with open('google_vision_response.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("\n💾 Full response saved to: google_vision_response.json")

if __name__ == "__main__":
    test_google_vision()