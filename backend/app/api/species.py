from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.core.database import get_db
from app.services.cache import cache_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def list_species(
    conservation_status: Optional[str] = None,
    habitat: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """List all species with optional filters"""
    try:
        # Build cache key
        cache_key = f"species:list:{conservation_status}:{habitat}:{limit}:{offset}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        
        # Build dynamic query
        where_clauses = []
        params = {"limit": limit, "offset": offset}
        
        if conservation_status:
            where_clauses.append("s.conservation_status = $status")
            params["status"] = conservation_status
        
        if habitat:
            where_clauses.append("s.habitat CONTAINS $habitat")
            params["habitat"] = habitat
        
        where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = f"""
        MATCH (s:Species)
        {where_clause}
        OPTIONAL MATCH (s)<-[:CONTAINS]-(parent)
        OPTIONAL MATCH (s)-[:FOUND_IN]->(l:Location)
        RETURN s, parent.name as parent_taxon, collect(DISTINCT l.name) as locations
        ORDER BY s.common_name
        SKIP $offset
        LIMIT $limit
        """
        
        results = db.execute_query(query, params)
        
        species_list = []
        for result in results:
            species = dict(result['s'])
            species['parent_taxon'] = result['parent_taxon']
            species['locations'] = result['locations']
            species_list.append(species)
        
        # Get total count
        count_query = f"""
        MATCH (s:Species)
        {where_clause}
        RETURN count(s) as total
        """
        count_result = db.execute_query(count_query, params)
        total = count_result[0]['total'] if count_result else 0
        
        response = {
            "species": species_list,
            "total": total,
            "count": len(species_list),
            "offset": offset,
            "limit": limit
        }
        
        # Cache for 10 minutes
        cache_service.set(cache_key, response, ttl=600)
        
        return response
        
    except Exception as e:
        logger.error(f"Error listing species: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_species(q: str = Query(..., min_length=2)):
    """Search species by name"""
    try:
        cache_key = f"species:search:{q.lower()}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (s:Species)
        WHERE toLower(s.common_name) CONTAINS toLower($query)
           OR toLower(s.scientific_name) CONTAINS toLower($query)
        RETURN s
        ORDER BY s.common_name
        LIMIT 20
        """
        
        results = db.execute_query(query, {"query": q})
        species_list = [dict(result['s']) for result in results]
        
        response = {
            "query": q,
            "results": species_list,
            "count": len(species_list)
        }
        
        # Cache for 5 minutes
        cache_service.set(cache_key, response, ttl=300)
        
        return response
        
    except Exception as e:
        logger.error(f"Error searching species: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scientific_name}")
async def get_species(scientific_name: str):
    """Get detailed information about a specific species"""
    try:
        cache_key = f"species:detail:{scientific_name}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (s:Species {scientific_name: $name})
        OPTIONAL MATCH (s)<-[:CONTAINS*]-(parent)
        OPTIONAL MATCH (s)-[:FOUND_IN]->(l:Location)
        OPTIONAL MATCH (i:Image)-[:CONTAINS]->(s)
        WITH s, 
             collect(DISTINCT {name: parent.name, rank: parent.rank}) as taxonomy,
             collect(DISTINCT l) as locations,
             count(DISTINCT i) as image_count
        RETURN s, taxonomy, locations, image_count
        """
        
        results = db.execute_query(query, {"name": scientific_name})
        
        if not results:
            raise HTTPException(status_code=404, detail="Species not found")
        
        result = results[0]
        species = dict(result['s'])
        species['taxonomy'] = result['taxonomy']
        species['locations'] = result['locations']
        species['image_count'] = result['image_count']
        
        # Get related species
        related_query = """
        MATCH (s:Species {scientific_name: $name})<-[:CONTAINS]-(parent)
        MATCH (parent)-[:CONTAINS]->(related:Species)
        WHERE related.scientific_name <> $name
        RETURN related
        LIMIT 5
        """
        
        related_results = db.execute_query(related_query, {"name": scientific_name})
        species['related_species'] = [dict(r['related']) for r in related_results]
        
        # Cache for 30 minutes
        cache_service.set(cache_key, species, ttl=1800)
        
        return species
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting species: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/taxonomy/tree")
async def get_taxonomy_tree():
    """Get the full taxonomy tree"""
    try:
        cache_key = "species:taxonomy:tree"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (k:Kingdom)
        OPTIONAL MATCH path = (k)-[:CONTAINS*]->(n)
        WITH k, collect(path) as paths
        RETURN k, paths
        """
        
        results = db.execute_query(query)
        
        # Build tree structure
        tree = {}
        if results:
            kingdom = dict(results[0]['k'])
            tree = {
                "name": kingdom['name'],
                "rank": kingdom['rank'],
                "children": []
            }
        
        # Cache for 1 hour
        cache_service.set(cache_key, tree, ttl=3600)
        
        return tree
        
    except Exception as e:
        logger.error(f"Error getting taxonomy tree: {e}")
        raise HTTPException(status_code=500, detail=str(e))
