import logging
from app.core.database import get_db
from datetime import datetime

logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database with schema and sample data"""
    db = get_db()
    
    # Create constraints and indexes
    logger.info("Creating database constraints and indexes...")
    db.create_constraints_and_indexes()
    
    # Create initial schema with sample data
    logger.info("Initializing database schema...")
    
    # Clear existing data (for development)
    db.execute_write("MATCH (n) DETACH DELETE n")
    
    # Create sample taxonomy hierarchy
    taxonomy_query = """
    // Create Kingdom
    CREATE (animalia:Kingdom {name: 'Animalia', rank: 'kingdom'})
    
    // Create Phyla
    CREATE (chordata:Phylum {name: 'Chordata', rank: 'phylum'})
    CREATE (cnidaria:Phylum {name: 'Cnidaria', rank: 'phylum'})
    CREATE (echinodermata:Phylum {name: 'Echinodermata', rank: 'phylum'})
    CREATE (mollusca:Phylum {name: 'Mollusca', rank: 'phylum'})
    CREATE (arthropoda:Phylum {name: 'Arthropoda', rank: 'phylum'})
    
    // Connect to Kingdom
    CREATE (animalia)-[:CONTAINS]->(chordata)
    CREATE (animalia)-[:CONTAINS]->(cnidaria)
    CREATE (animalia)-[:CONTAINS]->(echinodermata)
    CREATE (animalia)-[:CONTAINS]->(mollusca)
    CREATE (animalia)-[:CONTAINS]->(arthropoda)
    
    // Create sample Classes under Chordata
    CREATE (actinopterygii:Class {name: 'Actinopterygii', rank: 'class', common_name: 'Ray-finned fishes'})
    CREATE (chondrichthyes:Class {name: 'Chondrichthyes', rank: 'class', common_name: 'Cartilaginous fishes'})
    CREATE (mammalia:Class {name: 'Mammalia', rank: 'class', common_name: 'Mammals'})
    CREATE (reptilia:Class {name: 'Reptilia', rank: 'class', common_name: 'Reptiles'})
    
    CREATE (chordata)-[:CONTAINS]->(actinopterygii)
    CREATE (chordata)-[:CONTAINS]->(chondrichthyes)
    CREATE (chordata)-[:CONTAINS]->(mammalia)
    CREATE (chordata)-[:CONTAINS]->(reptilia)
    
    // Create sample species
    CREATE (clownfish:Species {
        scientific_name: 'Amphiprion ocellaris',
        common_name: 'Common Clownfish',
        conservation_status: 'Least Concern',
        habitat: 'Coral reefs',
        description: 'Orange fish with white stripes, lives in anemones',
        max_size_cm: 11.0
    })
    
    CREATE (great_white:Species {
        scientific_name: 'Carcharodon carcharias',
        common_name: 'Great White Shark',
        conservation_status: 'Vulnerable',
        habitat: 'Coastal and offshore waters',
        description: 'Large predatory shark',
        max_size_cm: 600.0
    })
    
    CREATE (manta_ray:Species {
        scientific_name: 'Mobula birostris',
        common_name: 'Giant Manta Ray',
        conservation_status: 'Endangered',
        habitat: 'Open ocean and reefs',
        description: 'Large ray with distinctive cephalic fins',
        max_size_cm: 700.0
    })
    
    CREATE (sea_turtle:Species {
        scientific_name: 'Chelonia mydas',
        common_name: 'Green Sea Turtle',
        conservation_status: 'Endangered',
        habitat: 'Coastal waters and beaches',
        description: 'Large marine turtle',
        max_size_cm: 150.0
    })
    
    CREATE (dolphin:Species {
        scientific_name: 'Tursiops truncatus',
        common_name: 'Bottlenose Dolphin',
        conservation_status: 'Least Concern',
        habitat: 'Coastal and oceanic waters',
        description: 'Intelligent marine mammal',
        max_size_cm: 400.0
    })
    
    // Connect species to taxonomy
    CREATE (actinopterygii)-[:CONTAINS]->(clownfish)
    CREATE (chondrichthyes)-[:CONTAINS]->(great_white)
    CREATE (chondrichthyes)-[:CONTAINS]->(manta_ray)
    CREATE (reptilia)-[:CONTAINS]->(sea_turtle)
    CREATE (mammalia)-[:CONTAINS]->(dolphin)
    
    // Create sample locations
    CREATE (gbr:Location {
        name: 'Great Barrier Reef',
        latitude: -18.2871,
        longitude: 147.6992,
        country: 'Australia',
        water_body: 'Coral Sea'
    })
    
    CREATE (maldives:Location {
        name: 'Maldives',
        latitude: 3.2028,
        longitude: 73.2207,
        country: 'Maldives',
        water_body: 'Indian Ocean'
    })
    
    CREATE (hawaii:Location {
        name: 'Hawaii',
        latitude: 19.8968,
        longitude: -155.5828,
        country: 'USA',
        water_body: 'Pacific Ocean'
    })
    
    // Create relationships between species and locations
    CREATE (clownfish)-[:FOUND_IN]->(gbr)
    CREATE (clownfish)-[:FOUND_IN]->(maldives)
    CREATE (great_white)-[:FOUND_IN]->(hawaii)
    CREATE (manta_ray)-[:FOUND_IN]->(maldives)
    CREATE (sea_turtle)-[:FOUND_IN]->(hawaii)
    CREATE (dolphin)-[:FOUND_IN]->(hawaii)
    
    RETURN 'Database initialized successfully' as result
    """
    
    try:
        result = db.execute_write(taxonomy_query)
        logger.info("Database schema initialized with sample data")
        
        # Verify the data
        species_count = db.execute_query("MATCH (s:Species) RETURN count(s) as count")[0]['count']
        location_count = db.execute_query("MATCH (l:Location) RETURN count(l) as count")[0]['count']
        
        logger.info(f"Created {species_count} species and {location_count} locations")
        
        return {
            "status": "success",
            "species_count": species_count,
            "location_count": location_count
        }
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

def get_database_stats():
    """Get current database statistics"""
    db = get_db()
    
    stats = {
        "nodes": {},
        "relationships": {},
        "health": db.health_check()
    }
    
    # Count nodes by label
    node_labels = ['Species', 'Location', 'Kingdom', 'Phylum', 'Class', 'Image', 'Observation', 'User']
    for label in node_labels:
        count_query = f"MATCH (n:{label}) RETURN count(n) as count"
        result = db.execute_query(count_query)
        stats["nodes"][label] = result[0]['count'] if result else 0
    
    # Count relationships
    rel_query = "MATCH ()-[r]->() RETURN type(r) as type, count(r) as count"
    relationships = db.execute_query(rel_query)
    for rel in relationships:
        stats["relationships"][rel['type']] = rel['count']
    
    return stats

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_database()
    stats = get_database_stats()
    print("Database Statistics:", stats)