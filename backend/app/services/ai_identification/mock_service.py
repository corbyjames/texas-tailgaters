import random
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class MockIdentificationService:
    """Mock identification service for testing when Google Vision is not available"""
    
    def __init__(self):
        # Use species that exist in our database
        self.mock_species = [
            {
                "common_name": "Common Clownfish",
                "scientific_name": "Amphiprion ocellaris",
                "labels": ["fish", "clownfish", "anemonefish", "marine life", "reef fish"]
            },
            {
                "common_name": "Great White Shark",
                "scientific_name": "Carcharodon carcharias",
                "labels": ["shark", "great white", "predator", "marine life", "fish"]
            },
            {
                "common_name": "Green Sea Turtle",
                "scientific_name": "Chelonia mydas",
                "labels": ["turtle", "sea turtle", "reptile", "marine life", "green turtle"]
            },
            {
                "common_name": "Blue Tang",
                "scientific_name": "Paracanthurus hepatus",
                "labels": ["fish", "tang", "blue tang", "reef fish", "marine life"]
            },
            {
                "common_name": "Bottlenose Dolphin",
                "scientific_name": "Tursiops truncatus",
                "labels": ["dolphin", "cetacean", "marine mammal", "marine life", "bottlenose"]
            },
            {
                "common_name": "Manta Ray",
                "scientific_name": "Mobula birostris",
                "labels": ["ray", "manta ray", "cartilaginous fish", "marine life", "giant manta"]
            },
            {
                "common_name": "Whale Shark",
                "scientific_name": "Rhincodon typus",
                "labels": ["shark", "whale shark", "filter feeder", "marine life", "fish"]
            },
            {
                "common_name": "Lionfish",
                "scientific_name": "Pterois volitans",
                "labels": ["fish", "lionfish", "venomous", "marine life", "reef fish"]
            },
            {
                "common_name": "Spotted Eagle Ray",
                "scientific_name": "Aetobatus narinari",
                "labels": ["ray", "eagle ray", "cartilaginous fish", "marine life"]
            },
            {
                "common_name": "Blue Whale",
                "scientific_name": "Balaenoptera musculus",
                "labels": ["whale", "blue whale", "marine mammal", "cetacean", "largest animal"]
            }
        ]
        # Track last returned species to avoid repetition
        self.last_returned = []
    
    def identify_species(self, image_data: bytes) -> List[Dict[str, Any]]:
        """
        Mock species identification
        Returns random marine species with confidence scores
        """
        logger.info("Using mock identification service")
        
        # Create a pool of species excluding the last 3 returned to avoid repetition
        available_species = [s for s in self.mock_species 
                           if s["scientific_name"] not in self.last_returned]
        
        # If we've used most species, reset the history
        if len(available_species) < 3:
            self.last_returned = []
            available_species = self.mock_species.copy()
        
        # Randomly select 2-3 species
        num_results = random.randint(2, 3)
        selected_species = random.sample(available_species, min(num_results, len(available_species)))
        
        # Update history with the primary (first) species
        if selected_species:
            self.last_returned.append(selected_species[0]["scientific_name"])
            # Keep only last 3 to avoid too much restriction
            if len(self.last_returned) > 3:
                self.last_returned.pop(0)
        
        results = []
        # Vary the base confidence more
        confidence_base = random.uniform(0.75, 0.92)
        
        for i, species in enumerate(selected_species):
            # Decreasing confidence for each result
            confidence = max(0.3, confidence_base - (i * 0.2) + random.uniform(-0.05, 0.05))
            
            results.append({
                "common_name": species["common_name"],
                "scientific_name": species["scientific_name"],
                "confidence": min(0.95, confidence),
                "labels": species["labels"]
            })
        
        logger.info(f"Mock identification returned {len(results)} results: {results[0]['common_name']}")
        return results