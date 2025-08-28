import React, { useState } from 'react';
import { useGames } from '../hooks/useGames';
import GameCard from '../components/games/GameCard';
import { Game } from '../types/Game';

const GamesPage: React.FC = () => {
  const { games, loading, error, syncFromUTAthletics } = useGames();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = games.filter(game => {
    const matchesFilter = filter === 'all' || game.status === filter;
    const matchesSearch = game.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const plannedCount = games.filter(g => g.status === 'planned').length;
  const unplannedCount = games.filter(g => g.status === 'unplanned').length;
  const totalCount = games.length;

  const handleSync = async () => {
    try {
      const result = await syncFromUTAthletics();
      alert(result.message);
    } catch (err) {
      alert('Failed to sync schedule');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ut-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-ut-text mb-2">Error Loading Games</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-ut-text">🏈 2024 Season</h1>
          <button
            onClick={handleSync}
            className="btn-secondary text-sm"
          >
            🔄 Sync Schedule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-ut-text">{totalCount}</div>
            <div className="text-xs text-gray-600">Total Games</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-ut-success">{plannedCount}</div>
            <div className="text-xs text-gray-600">Planned</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-ut-warning">{unplannedCount}</div>
            <div className="text-xs text-gray-600">Unplanned</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-ut-orange text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('planned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'planned' 
                  ? 'bg-ut-orange text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Planned
            </button>
            <button
              onClick={() => setFilter('unplanned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unplanned' 
                  ? 'bg-ut-orange text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unplanned
            </button>
          </div>
        </div>
      </div>

      {/* Games List */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏈</div>
          <h2 className="text-xl font-semibold text-ut-text mb-2">
            {games.length === 0 ? 'No games found' : 'No games match your filters'}
          </h2>
          <p className="text-gray-600 mb-4">
            {games.length === 0 
              ? 'Try syncing the schedule from UT Athletics or add games manually.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {games.length === 0 && (
            <button onClick={handleSync} className="btn-primary">
              Sync Schedule
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Add Game Button (for admins) */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            // TODO: Implement add game functionality
            alert('Add game functionality coming soon!');
          }}
          className="btn-primary"
        >
          ➕ Add Game
        </button>
      </div>
    </div>
  );
};

export default GamesPage;

