import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../services/api';

function SpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [filters, setFilters] = useState({
    conservation_status: '',
    habitat: ''
  });

  useEffect(() => {
    loadSpecies();
  }, [filters]);

  const loadSpecies = async () => {
    setLoading(true);
    try {
      const data = await api.listSpecies(filters);
      setSpecies(data.species || []);
    } catch (error) {
      console.error('Error loading species:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSpecies();
      return;
    }

    setLoading(true);
    try {
      const data = await api.searchSpecies(searchQuery);
      setSpecies(data.results || []);
    } catch (error) {
      console.error('Error searching species:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpeciesDetails = async (scientificName) => {
    try {
      const data = await api.getSpecies(scientificName);
      setSelectedSpecies(data);
    } catch (error) {
      console.error('Error loading species details:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Critically Endangered': 'bg-red-100 text-red-800',
      'Endangered': 'bg-orange-100 text-orange-800',
      'Vulnerable': 'bg-yellow-100 text-yellow-800',
      'Near Threatened': 'bg-blue-100 text-blue-800',
      'Least Concern': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Marine Species Database</h2>
        <p className="text-gray-600">Explore our comprehensive database of marine life</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search species by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex gap-4">
          <select
            value={filters.conservation_status}
            onChange={(e) => setFilters({ ...filters, conservation_status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Conservation Status</option>
            <option value="Critically Endangered">Critically Endangered</option>
            <option value="Endangered">Endangered</option>
            <option value="Vulnerable">Vulnerable</option>
            <option value="Near Threatened">Near Threatened</option>
            <option value="Least Concern">Least Concern</option>
          </select>

          <select
            value={filters.habitat}
            onChange={(e) => setFilters({ ...filters, habitat: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Habitats</option>
            <option value="Coral reefs">Coral Reefs</option>
            <option value="Open ocean">Open Ocean</option>
            <option value="Coastal waters">Coastal Waters</option>
            <option value="Deep sea">Deep Sea</option>
          </select>
        </div>
      </div>

      {/* Species Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Loading species...</p>
          </div>
        ) : species.length > 0 ? (
          species.map((sp) => (
            <div
              key={sp.scientific_name}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => loadSpeciesDetails(sp.scientific_name)}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {sp.common_name}
                </h3>
                <p className="text-sm text-gray-600 italic mb-3">
                  {sp.scientific_name}
                </p>
                
                {sp.conservation_status && (
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(sp.conservation_status)}`}>
                    {sp.conservation_status}
                  </span>
                )}
                
                {sp.habitat && (
                  <p className="text-sm text-gray-600 mt-3">
                    <span className="font-medium">Habitat:</span> {sp.habitat}
                  </p>
                )}
                
                {sp.locations && sp.locations.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Locations:</span> {sp.locations.slice(0, 2).join(', ')}
                    {sp.locations.length > 2 && ` +${sp.locations.length - 2} more`}
                  </p>
                )}
                
                <div className="flex items-center mt-4 text-blue-600">
                  <span className="text-sm">View Details</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No species found</p>
          </div>
        )}
      </div>

      {/* Species Detail Modal */}
      {selectedSpecies && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedSpecies.common_name}
                  </h3>
                  <p className="text-lg text-gray-600 italic">
                    {selectedSpecies.scientific_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSpecies(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedSpecies.conservation_status && (
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(selectedSpecies.conservation_status)}`}>
                    {selectedSpecies.conservation_status}
                  </span>
                </div>
              )}

              {selectedSpecies.description && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{selectedSpecies.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {selectedSpecies.habitat && (
                  <div>
                    <h4 className="font-semibold mb-1">Habitat</h4>
                    <p className="text-gray-700">{selectedSpecies.habitat}</p>
                  </div>
                )}
                
                {selectedSpecies.max_size_cm && (
                  <div>
                    <h4 className="font-semibold mb-1">Maximum Size</h4>
                    <p className="text-gray-700">{selectedSpecies.max_size_cm} cm</p>
                  </div>
                )}
              </div>

              {selectedSpecies.locations && selectedSpecies.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Found In</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecies.locations.map((loc, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {loc.name || loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSpecies.related_species && selectedSpecies.related_species.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Related Species</h4>
                  <div className="space-y-2">
                    {selectedSpecies.related_species.map((related, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{related.common_name}</span>
                        <span className="text-gray-600 ml-2">({related.scientific_name})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSpecies.image_count > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {selectedSpecies.image_count} images in database
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeciesPage;