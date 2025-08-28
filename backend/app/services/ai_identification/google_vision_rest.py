"""
Google Vision API integration using REST API
"""

import os
import logging
import requests
import base64
from typing import List, Dict
import json

logger = logging.getLogger(__name__)

class GoogleVisionRESTService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_VISION_API_KEY")
        self.base_url = "https://vision.googleapis.com/v1/images:annotate"
        
        if not self.api_key:
            logger.warning("Google Vision API key not configured")
        else:
            logger.info(f"Google Vision REST API configured")
    
    def identify_species(self, image_data: bytes) -> List[Dict]:
        """
        Identify marine species using Google Vision REST API
        """
        if not self.api_key:
            logger.warning("Using mock data - no API key")
            return self._mock_identification()
        
        try:
            # Encode image as base64
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
            
            # Make API request
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Google Vision API error: {response.status_code} - {response.text}")
                return self._mock_identification()
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"Google Vision API error: {result['error']}")
                return self._mock_identification()
            
            # Process response
            annotations = result.get("responses", [{}])[0]
            
            # Extract marine-related labels
            marine_keywords = [
                'fish', 'shark', 'ray', 'turtle', 'dolphin', 'whale', 'coral',
                'octopus', 'squid', 'jellyfish', 'crab', 'lobster', 'shrimp',
                'seal', 'sea lion', 'marine', 'ocean', 'underwater', 'reef',
                'anemone', 'clownfish', 'grouper', 'barracuda', 'stingray'
            ]
            
            identified_species = []
            
            # Process label annotations
            labels = annotations.get("labelAnnotations", [])
            for label in labels:
                label_lower = label.get("description", "").lower()
                if any(keyword in label_lower for keyword in marine_keywords):
                    identified_species.append({
                        "label": label.get("description"),
                        "confidence": label.get("score", 0),
                        "source": "labels"
                    })
            
            # Process web detection
            web_detection = annotations.get("webDetection", {})
            web_entities = web_detection.get("webEntities", [])
            for entity in web_entities[:3]:
                desc = entity.get("description", "").lower()
                if any(keyword in desc for keyword in marine_keywords):
                    identified_species.append({
                        "label": entity.get("description"),
                        "confidence": entity.get("score", 0),
                        "source": "web"
                    })
            
            # Process object localization
            objects = annotations.get("localizedObjectAnnotations", [])
            for obj in objects:
                name_lower = obj.get("name", "").lower()
                if any(keyword in name_lower for keyword in marine_keywords):
                    identified_species.append({
                        "label": obj.get("name"),
                        "confidence": obj.get("score", 0),
                        "source": "objects"
                    })
            
            # Map to known species
            species_mapping = {
                "clownfish": {"scientific_name": "Amphiprion ocellaris", "common_name": "Common Clownfish"},
                "anemonefish": {"scientific_name": "Amphiprion ocellaris", "common_name": "Common Clownfish"},
                "shark": {"scientific_name": "Carcharodon carcharias", "common_name": "Great White Shark"},
                "sea turtle": {"scientific_name": "Chelonia mydas", "common_name": "Green Sea Turtle"},
                "turtle": {"scientific_name": "Chelonia mydas", "common_name": "Green Sea Turtle"},
                "manta ray": {"scientific_name": "Mobula birostris", "common_name": "Giant Manta Ray"},
                "ray": {"scientific_name": "Mobula birostris", "common_name": "Giant Manta Ray"},
                "dolphin": {"scientific_name": "Tursiops truncatus", "common_name": "Bottlenose Dolphin"},
            }
            
            # Convert to final format
            final_results = []
            seen_species = set()
            
            for item in identified_species:
                label_lower = item["label"].lower()
                
                # Try to map to known species
                for key, value in species_mapping.items():
                    if key in label_lower and value["scientific_name"] not in seen_species:
                        final_results.append({
                            "scientific_name": value["scientific_name"],
                            "common_name": value["common_name"],
                            "confidence": item["confidence"],
                            "source": f"Google Vision ({item['source']})",
                            "original_label": item["label"]
                        })
                        seen_species.add(value["scientific_name"])
                        break
            
            # If no marine species found, return the best guess
            if not final_results and labels:
                # Just return top label as unknown species
                top_label = labels[0]
                final_results.append({
                    "scientific_name": None,
                    "common_name": top_label.get("description", "Unknown"),
                    "confidence": top_label.get("score", 0),
                    "source": "Google Vision (labels)"
                })
            
            return final_results[:5] if final_results else self._mock_identification()
            
        except Exception as e:
            logger.error(f"Error calling Google Vision API: {e}")
            return self._mock_identification()
    
    def _mock_identification(self) -> List[Dict]:
        """Return mock data when API fails - raises exception to trigger fallback"""
        # Instead of returning hardcoded data, raise an exception
        # This will trigger the fallback to the better MockIdentificationService
        raise Exception("Google Vision API billing not enabled, use mock service")

# Global service instance
google_vision_rest_service = GoogleVisionRESTService()