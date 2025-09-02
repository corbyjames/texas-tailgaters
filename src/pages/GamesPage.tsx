import React, { useState, useEffect } from 'react';
import { useGames } from '../hooks/useGames';
import GameCard from '../components/games/GameCard';
import MobileGameCard from '../components/games/MobileGameCard';
import { Game } from '../types/Game';
import { Calendar, Filter, Search, Send } from 'lucide-react';
import { InvitationModalWithSMS } from '../components/invitations/InvitationModalWithSMS';

const GamesPage: React.FC = () => {
  const { games, loading, error, syncFromUTAthletics, refreshGames } = useGames();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSeasonInvite, setShowSeasonInvite] = useState(false);
  const [selectedGameForInvite, setSelectedGameForInvite] = useState<Game | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className={`${isMobile ? 'pb-20' : 'container mx-auto'} px-4 py-6`}>
      {/* Mobile Header */}
      {isMobile ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-gray-900">
              {new Date().getFullYear()} Season
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSeasonInvite(true)}
                className="p-2 rounded-lg bg-orange-500 text-white active:bg-orange-600"
              >
                <Send className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
              >
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      ) : (
        /* Desktop Header */
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-ut-text">🏈 {new Date().getFullYear()} Season</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSeasonInvite(true)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Invite to Season
              </button>
              <button
                onClick={handleSync}
                className="btn-secondary text-sm"
              >
                🔄 Sync Schedule
              </button>
            </div>
          </div>

        {/* Stats - Hidden on mobile */}
        {!isMobile && (
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
        )}

        {/* Desktop Filters */}
        {!isMobile && (
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
        )}
      </div>
      )}

      {/* Mobile Filter Pills */}
      {isMobile && showFilters && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
            }`}
          >
            All Games ({totalCount})
          </button>
          <button
            onClick={() => setFilter('planned')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'planned' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
            }`}
          >
            Planned ({plannedCount})
          </button>
          <button
            onClick={() => setFilter('unplanned')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'unplanned' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
            }`}
          >
            Unplanned ({unplannedCount})
          </button>
        </div>
      )}

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
            isMobile ? (
              <MobileGameCard 
                key={game.id} 
                game={game}
                onGameUpdated={refreshGames}
              />
            ) : (
              <GameCard 
                key={game.id} 
                game={game}
                onInvite={(g) => setSelectedGameForInvite(g)}
                onGameUpdated={refreshGames}
              />
            )
          ))}
        </div>
      )}

      {/* Add Game Button - Fixed on mobile */}
      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleSync}
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-medium active:bg-orange-700 transition-colors"
          >
            🔄 Sync Schedule
          </button>
        </div>
      ) : (
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
      )}

      {/* Season Invitation Modal */}
      <InvitationModalWithSMS
        games={games}
        isOpen={showSeasonInvite}
        onClose={() => setShowSeasonInvite(false)}
        inviteType="season"
      />

      {/* Single Game Invitation Modal */}
      {selectedGameForInvite && (
        <InvitationModalWithSMS
          game={selectedGameForInvite}
          isOpen={!!selectedGameForInvite}
          onClose={() => setSelectedGameForInvite(null)}
          inviteType="single"
        />
      )}
    </div>
  );
};

export default GamesPage;





