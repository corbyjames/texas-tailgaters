from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError
import logging
from typing import Optional, Any, Dict, List
from app.core.config import settings
import time

logger = logging.getLogger(__name__)

class Neo4jConnection:
    def __init__(self):
        self.driver = None
        self.connect()
    
    def connect(self):
        """Establish connection to Neo4j database"""
        max_retries = 5
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                    max_connection_lifetime=3600,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=60
                )
                # Test the connection
                with self.driver.session() as session:
                    session.run("RETURN 1")
                logger.info("Successfully connected to Neo4j database")
                return
            except ServiceUnavailable as e:
                logger.warning(f"Neo4j connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise
            except AuthError as e:
                logger.error(f"Neo4j authentication failed: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error connecting to Neo4j: {e}")
                raise
    
    def close(self):
        """Close the database connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """Execute a Cypher query and return results"""
        if not self.driver:
            raise ConnectionError("No Neo4j connection available")
        
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    def execute_write(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Any:
        """Execute a write transaction"""
        if not self.driver:
            raise ConnectionError("No Neo4j connection available")
        
        def _write_transaction(tx, query, parameters):
            result = tx.run(query, parameters or {})
            return result.data()
        
        try:
            with self.driver.session() as session:
                return session.execute_write(_write_transaction, query, parameters)
        except Exception as e:
            logger.error(f"Write transaction failed: {e}")
            raise
    
    def create_constraints_and_indexes(self):
        """Create database constraints and indexes"""
        constraints = [
            # Unique constraints
            "CREATE CONSTRAINT species_name_unique IF NOT EXISTS FOR (s:Species) REQUIRE s.scientific_name IS UNIQUE",
            "CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
            "CREATE CONSTRAINT image_id_unique IF NOT EXISTS FOR (i:Image) REQUIRE i.id IS UNIQUE",
            "CREATE CONSTRAINT observation_id_unique IF NOT EXISTS FOR (o:Observation) REQUIRE o.id IS UNIQUE",
            
            # Indexes for performance
            "CREATE INDEX species_common_name IF NOT EXISTS FOR (s:Species) ON (s.common_name)",
            "CREATE INDEX image_timestamp IF NOT EXISTS FOR (i:Image) ON (i.timestamp)",
            "CREATE INDEX observation_date IF NOT EXISTS FOR (o:Observation) ON (o.date)",
            "CREATE INDEX location_coords IF NOT EXISTS FOR (l:Location) ON (l.latitude, l.longitude)",
        ]
        
        for constraint in constraints:
            try:
                self.execute_write(constraint)
                logger.info(f"Created constraint/index: {constraint[:50]}...")
            except Exception as e:
                logger.warning(f"Could not create constraint/index: {e}")
    
    def health_check(self) -> bool:
        """Check if the database connection is healthy"""
        try:
            result = self.execute_query("RETURN 1 as health")
            return result[0]['health'] == 1
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

# Global database connection instance
db = None

def get_db() -> Neo4jConnection:
    """Get or create database connection"""
    global db
    if db is None:
        db = Neo4jConnection()
    return db

def close_db():
    """Close the database connection"""
    global db
    if db:
        db.close()
        db = None