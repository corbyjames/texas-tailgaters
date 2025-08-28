#!/usr/bin/env python3
"""
Test Neo4j connection and database operations
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from app.core.database import get_db, close_db
from app.core.init_db import init_database, get_database_stats
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_connection():
    """Test basic Neo4j connection"""
    print("\n" + "="*50)
    print("Testing Neo4j Connection")
    print("="*50)
    
    try:
        db = get_db()
        
        # Test health check
        is_healthy = db.health_check()
        print(f"✅ Connection Status: {'Healthy' if is_healthy else 'Unhealthy'}")
        
        if not is_healthy:
            print("❌ Failed to connect to Neo4j")
            return False
        
        # Test basic query
        result = db.execute_query("RETURN 'Hello from Neo4j!' as message, datetime() as timestamp")
        if result:
            print(f"✅ Query Test: {result[0]['message']}")
            print(f"   Timestamp: {result[0]['timestamp']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_database_operations():
    """Test database initialization and operations"""
    print("\n" + "="*50)
    print("Testing Database Operations")
    print("="*50)
    
    try:
        # Initialize database with sample data
        print("\n📊 Initializing database with sample data...")
        result = init_database()
        print(f"✅ Database initialized: {result}")
        
        # Get database statistics
        print("\n📈 Database Statistics:")
        stats = get_database_stats()
        print(json.dumps(stats, indent=2))
        
        # Test some queries
        db = get_db()
        
        # Query all species
        print("\n🐠 Marine Species in Database:")
        species = db.execute_query("""
            MATCH (s:Species)
            RETURN s.common_name as name, 
                   s.scientific_name as scientific,
                   s.conservation_status as status
            ORDER BY s.common_name
        """)
        for sp in species:
            print(f"  • {sp['name']} ({sp['scientific']}) - Status: {sp['status']}")
        
        # Query locations
        print("\n📍 Dive Locations:")
        locations = db.execute_query("""
            MATCH (l:Location)
            RETURN l.name as name, l.country as country, l.water_body as water
            ORDER BY l.name
        """)
        for loc in locations:
            print(f"  • {loc['name']}, {loc['country']} ({loc['water']})")
        
        # Query species-location relationships
        print("\n🗺️  Species Distribution:")
        distribution = db.execute_query("""
            MATCH (s:Species)-[:FOUND_IN]->(l:Location)
            RETURN s.common_name as species, collect(l.name) as locations
            ORDER BY s.common_name
        """)
        for dist in distribution:
            locations_str = ", ".join(dist['locations'])
            print(f"  • {dist['species']}: {locations_str}")
        
        # Test the taxonomy hierarchy
        print("\n🌳 Taxonomy Tree Sample:")
        taxonomy = db.execute_query("""
            MATCH path = (k:Kingdom)-[:CONTAINS*]->(s:Species)
            WHERE s.common_name = 'Common Clownfish'
            RETURN [n in nodes(path) | coalesce(n.name, n.common_name)] as hierarchy
            LIMIT 1
        """)
        if taxonomy:
            hierarchy = " → ".join(taxonomy[0]['hierarchy'])
            print(f"  {hierarchy}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database operations failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test runner"""
    print("\n🚀 Starting Neo4j Connection Tests")
    
    # Test 1: Basic connection
    connection_ok = test_connection()
    
    if connection_ok:
        # Test 2: Database operations
        operations_ok = test_database_operations()
        
        if operations_ok:
            print("\n✅ All tests passed successfully!")
        else:
            print("\n⚠️  Some database operations failed")
    else:
        print("\n❌ Could not establish connection to Neo4j")
        print("\n💡 Make sure Docker services are running:")
        print("   docker-compose up -d neo4j")
    
    # Cleanup
    close_db()
    print("\n🏁 Tests completed")

if __name__ == "__main__":
    main()