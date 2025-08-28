import React, { useState, useEffect } from 'react';
import { Camera, Fish, TrendingUp, Clock } from 'lucide-react';
import api from '../services/api';

function HomePage({ setCurrentPage }) {
  const [stats, setStats] = useState(null);
  const [recentIdentifications, setRecentIdentifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        api.getIdentificationStats(),
        api.getRecentIdentifications(5)
      ]);
      setStats(statsData);
      setRecentIdentifications(recentData.identifications || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to Marine Life ID System
        </h2>
        <p className="text-gray-600">
          AI-powered marine species identification and cataloging
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setCurrentPage('identify')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Camera className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Identify Species</h3>
          <p className="text-gray-600 text-sm">
            Upload an image to identify marine species using AI
          </p>
        </button>

        <button
          onClick={() => setCurrentPage('species')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Fish className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Browse Species</h3>
          <p className="text-gray-600 text-sm">
            Explore our database of marine species
          </p>
        </button>

        <button
          onClick={() => setCurrentPage('gallery')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">View Gallery</h3>
          <p className="text-gray-600 text-sm">
            Browse uploaded marine life photos
          </p>
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">System Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.total_observations || 0}
              </p>
              <p className="text-gray-600">Total Observations</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {stats.confidence_distribution?.high || 0}
              </p>
              <p className="text-gray-600">High Confidence IDs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {stats.top_species?.length || 0}
              </p>
              <p className="text-gray-600">Species Identified</p>
            </div>
          </div>

          {stats.top_species && stats.top_species.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Most Identified Species</h4>
              <div className="space-y-2">
                {stats.top_species.map((species, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{species.species}</span>
                    <span className="text-gray-500">{species.count} observations</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Identifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="text-xl font-semibold">Recent Identifications</h3>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : recentIdentifications.length > 0 ? (
          <div className="space-y-3">
            {recentIdentifications.map((obs) => (
              <div key={obs.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {obs.species?.common_name || 'Unknown Species'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {obs.species?.scientific_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Confidence: {(obs.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(obs.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent identifications</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;