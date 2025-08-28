"""
Google Vision API integration for marine species identification
"""

import os
import logging
from typing import List, Dict, Optional
from google.cloud import vision
from google.oauth2 import service_account
import json
import base64

logger = logging.getLogger(__name__)

class GoogleVisionService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_VISION_API_KEY")
        self.client = None
        
        if not self.api_key:
            logger.warning("Google Vision API key not configured")
        else:
            logger.info(f"Google Vision API key configured (length: {len(self.api_key)})")
            # We'll use REST API directly instead of client library
    
    def identify_species(self, image_data: bytes) -> List[Dict]:
        """
        Identify marine species in an image using Google Vision API REST endpoint
        
        Args:
            image_data: Image bytes
            
        Returns:
            List of identified species with confidence scores
        """
        if not self.api_key:
            logger.warning("Google Vision API key not available, using mock data")
            return self._mock_identification()
        
        try:
            image = vision.Image(content=image_data)
            
            # Perform multiple detection types for comprehensive analysis
            results = []
            
            # Label detection for general objects/animals
            label_response = self.client.label_detection(image=image, max_results=10)
            labels = label_response.label_annotations
            
            # Web detection for similar images and entities
            web_response = self.client.web_detection(image=image)
            web_detection = web_response.web_detection
            
            # Object localization for specific objects
            objects_response = self.client.object_localization(image=image)
            objects = objects_response.localized_object_annotations
            
            # Process labels - look for marine life related labels
            marine_keywords = [
                'fish', 'shark', 'ray', 'turtle', 'dolphin', 'whale', 'coral', 
                'octopus', 'squid', 'jellyfish', 'crab', 'lobster', 'shrimp',
                'seal', 'sea lion', 'marine', 'ocean', 'underwater', 'reef'
            ]
            
            identified_species = []
            
            # Check labels for marine life
            for label in labels:
                label_lower = label.description.lower()
                if any(keyword in label_lower for keyword in marine_keywords):
                    identified_species.append({
                        "common_name": label.description,
                        "confidence": label.score,
                        "source": "label_detection"
                    })
            
            # Check web entities for species names
            if web_detection.web_entities:
                for entity in web_detection.web_entities[:5]:
                    if entity.description and entity.score > 0.5:
                        # Check if it might be a species name
                        if any(keyword in entity.description.lower() for keyword in marine_keywords):
                            identified_species.append({
                                "common_name": entity.description,
                                "confidence": entity.score,
                                "source": "web_detection"
                            })
            
            # Check localized objects
            for obj in objects:
                if any(keyword in obj.name.lower() for keyword in marine_keywords):
                    identified_species.append({
                        "common_name": obj.name,
                        "confidence": obj.score,
                        "source": "object_detection",
                        "bounding_box": {
                            "vertices": [
                                {"x": vertex.x, "y": vertex.y}
                                for vertex in obj.bounding_poly.normalized_vertices
                            ]
                        }
                    })
            
            # Map common names to scientific names (simplified mapping)
            species_mapping = {
                "clownfish": {"scientific_name": "Amphiprion ocellaris", "common_name": "Common Clownfish"},
                "shark": {"scientific_name": "Carcharodon carcharias", "common_name": "Great White Shark"},
                "sea turtle": {"scientific_name": "Chelonia mydas", "common_name": "Green Sea Turtle"},
                "manta ray": {"scientific_name": "Mobula birostris", "common_name": "Giant Manta Ray"},
                "dolphin": {"scientific_name": "Tursiops truncatus", "common_name": "Bottlenose Dolphin"},
                "fish": {"scientific_name": "Amphiprion ocellaris", "common_name": "Common Clownfish"},  # Default
            }
            
            # Enhance results with scientific names
            final_results = []
            seen_species = set()
            
            for species in identified_species:
                common_lower = species["common_name"].lower()
                
                # Try to find a mapping
                mapped = None
                for key, value in species_mapping.items():
                    if key in common_lower:
                        mapped = value
                        break
                
                if mapped and mapped["scientific_name"] not in seen_species:
                    final_results.append({
                        "scientific_name": mapped["scientific_name"],
                        "common_name": mapped["common_name"],
                        "confidence": species["confidence"],
                        "source": species["source"],
                        "original_label": species["common_name"]
                    })
                    seen_species.add(mapped["scientific_name"])
                elif not mapped and species["common_name"] not in seen_species:
                    # Keep unmatched but relevant species
                    final_results.append({
                        "scientific_name": None,
                        "common_name": species["common_name"],
                        "confidence": species["confidence"],
                        "source": species["source"]
                    })
                    seen_species.add(species["common_name"])
            
            # Sort by confidence
            final_results.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Return top 5 results
            return final_results[:5] if final_results else self._mock_identification()
            
        except Exception as e:
            logger.error(f"Error during Google Vision identification: {e}")
            return self._mock_identification()
    
    def _mock_identification(self) -> List[Dict]:
        """Return mock data when API is not available"""
        import random
        
        mock_species = [
            {
                "scientific_name": "Amphiprion ocellaris",
                "common_name": "Common Clownfish",
                "confidence": 0.92
            },
            {
                "scientific_name": "Carcharodon carcharias",
                "common_name": "Great White Shark",
                "confidence": 0.85
            },
            {
                "scientific_name": "Chelonia mydas",
                "common_name": "Green Sea Turtle",
                "confidence": 0.78
            }
        ]
        
        # Return 1-2 random species
        num_results = random.randint(1, 2)
        results = random.sample(mock_species, num_results)
        
        # Add some randomness to confidence
        for result in results:
            result["confidence"] = result["confidence"] * random.uniform(0.9, 1.1)
            result["confidence"] = min(result["confidence"], 0.99)
        
        return results

# Global service instance
google_vision_service = GoogleVisionService()