# Google Vision API Response Structure

## What Google Vision Returns

When the Google Vision API successfully processes a marine life image, it returns multiple types of analysis:

### 1. **Label Detection** (`labelAnnotations`)
Identifies general concepts and objects in the image.

**Example for a clownfish image:**
```json
{
  "description": "Fish",          // What it detected
  "score": 0.9876543,            // Confidence (0-1 scale, 98.7% confident)
  "topicality": 0.9876543,       // How relevant to the image
  "mid": "/m/01c_cg"             // Machine ID for knowledge graph
}
```

Common marine labels detected:
- Fish, Marine biology, Underwater
- Clownfish, Shark, Ray, Turtle
- Coral reef, Ocean, Reef
- Orange, Blue (colors)
- Wildlife, Nature

### 2. **Web Detection** (`webDetection`)
Searches the web for similar images and related content.

Contains 4 sub-components:

#### a. Web Entities
```json
{
  "entityId": "/m/0cyhj_",
  "score": 8.456789,                    // Higher = more relevant
  "description": "Amphiprion ocellaris"  // Scientific name!
}
```

#### b. Best Guess Labels
```json
{
  "label": "clownfish amphiprion ocellaris",
  "languageCode": "en"
}
```

#### c. Visually Similar Images
URLs of similar images found on the web

#### d. Pages with Matching Images
Websites containing the same or similar images (Wikipedia, National Geographic, etc.)

### 3. **Object Localization** (`localizedObjectAnnotations`)
Identifies specific objects and their locations in the image.

```json
{
  "name": "Fish",
  "score": 0.9234567,
  "boundingPoly": {
    "normalizedVertices": [
      {"x": 0.375, "y": 0.416},  // Top-left corner
      {"x": 0.625, "y": 0.416},  // Top-right
      {"x": 0.625, "y": 0.583},  // Bottom-right
      {"x": 0.375, "y": 0.583}   // Bottom-left
    ]
  }
}
```
Coordinates are normalized (0-1 scale) relative to image dimensions.

### 4. **Additional Features** (if requested)

- **Text Detection**: Reads any text in the image
- **Safe Search**: Detects inappropriate content
- **Image Properties**: Dominant colors, crop hints
- **Face Detection**: Detects faces and emotions
- **Landmark Detection**: Identifies famous locations

## How Our System Processes This

Our `google_vision_rest.py` service:

1. **Extracts marine-related labels** from `labelAnnotations`
   - Filters for keywords: fish, shark, turtle, coral, etc.

2. **Gets scientific names** from `webDetection.webEntities`
   - Looks for entities with scientific naming patterns

3. **Maps to known species** in our database
   - Matches "clownfish" → "Amphiprion ocellaris"
   - Matches "shark" → "Carcharodon carcharias"

4. **Calculates confidence scores**
   - Combines label scores and web entity scores
   - Returns top 2-3 matches

## Example Processing Flow

**Input**: Photo of a clownfish
**Google Vision returns**: 
- Labels: "Fish" (98%), "Clownfish" (87%), "Orange" (83%)
- Web entities: "Amphiprion ocellaris" (score: 8.4)
- Best guess: "clownfish amphiprion ocellaris"

**Our system outputs**:
```json
{
  "scientific_name": "Amphiprion ocellaris",
  "common_name": "Common Clownfish",
  "confidence": 0.92,
  "source": "Google Vision (labels + web)"
}
```

## Cost Considerations

Google Vision API pricing (as of 2024):
- First 1,000 units/month: FREE
- After that: $1.50 per 1,000 units
- Each feature (labels, web, objects) = 1 unit
- Our request uses 3 features = 3 units per image

So with the free tier, you can identify ~333 images/month for free.

## Current Status

❌ **Billing not enabled** - API returns 403 error
✅ **Fallback active** - Using MockIdentificationService instead

To enable real Google Vision:
1. Visit: https://console.developers.google.com/billing/enable?project=506864511450
2. Add billing account
3. API will start working immediately