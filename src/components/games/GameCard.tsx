import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Trophy, CheckCircle, XCircle, Send, ChevronDown, ChevronUp, Ban, CalendarOff } from 'lucide-react';
import { Game } from '../../types/Game';
import { GameHeader } from './GameHeader';
import PotluckService from '../../services/potluckService';
import GameService from '../../services/gameService';
import { parseGameDate } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';

interface GameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
  onInvite?: (game: Game) => void;
  onGameUpdated?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onGameClick, onInvite, onGameUpdated }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const [isExpanded, setIsExpanded] = useState(game.status !== 'completed');
  const [isUpdating, setIsUpdating] = useState(false);
  const [potluckStats, setPotluckStats] = useState<{
    totalItems: number;
    assignedItems: number;
  }>({ totalItems: 0, assignedItems: 0 });

  useEffect(() => {
    const fetchPotluckStats = async () => {
      const stats = await PotluckService.getGamePotluckStats(game.id);
      setPotluckStats({
        totalItems: stats.totalItems,
        assignedItems: stats.assignedItems,
      });
    };

    fetchPotluckStats();

    // Listen for potluck updates
    const handleUpdate = () => {
      fetchPotluckStats();
    };

    window.addEventListener('potluckUpdate', handleUpdate);
    return () => {
      window.removeEventListener('potluckUpdate', handleUpdate);
    };
  }, [game.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-green-100 text-green-800';
      case 'unplanned':
        return 'bg-yellow-100 text-yellow-800';
      case 'watch-party':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planned';
      case 'unplanned':
        return 'Unplanned';
      case 'watch-party':
        return 'Watch Party';
      case 'completed':
        return 'Final';
      default:
        return status;
    }
  };

  const handleClick = () => {
    if (onGameClick && !game.noTailgate) {
      onGameClick(game);
    }
  };

  const handleToggleNoTailgate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await GameService.toggleNoTailgate(game.id);
      if (onGameUpdated) {
        onGameUpdated();
      }
    } catch (error) {
      console.error('Error toggling no-tailgate status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate total participants (potluck items + expected attendees)
  const totalParticipants = potluckStats.totalItems + (game.expectedAttendance || 0);

  // For completed games, show collapsed view by default
  if (game.status === 'completed' && !isExpanded) {
    return (
      <div className="card p-3 hover:shadow-ut-hover transition-all duration-200 cursor-pointer bg-gray-50">
        <div className="flex items-center justify-between" onClick={() => setIsExpanded(true)}>
          <div className="flex items-center gap-4">
            {/* Score Display */}
            <div className="flex items-center gap-2">
              {game.result === 'W' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {game.result === 'L' && <XCircle className="w-5 h-5 text-red-600" />}
              {game.result === 'T' && <Trophy className="w-5 h-5 text-yellow-600" />}
              <span className={`font-bold text-lg ${
                game.result === 'W' ? 'text-green-600' : 
                game.result === 'L' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {game.result || '-'}
              </span>
            </div>
            
            {/* Game Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {parseGameDate(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="font-medium">
                {game.isHome ? 'vs' : '@'} {game.opponent}
              </span>
              {game.homeScore !== undefined && game.awayScore !== undefined && (
                <span className="font-semibold">
                  {game.isHome ? (
                    <span>UT {game.homeScore} - {game.awayScore}</span>
                  ) : (
                    <span>{game.awayScore} - UT {game.homeScore}</span>
                  )}
                </span>
              )}
            </div>
          </div>
          
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card p-4 transition-all duration-200 ${
        game.noTailgate 
          ? 'bg-gray-50 opacity-75 border-gray-300' 
          : 'hover:shadow-ut-hover cursor-pointer'
      }`}
      onClick={handleClick}
    >
      {/* No Tailgate Badge */}
      {game.noTailgate && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <Ban className="w-4 h-4" />
            <span>No Tailgate Hosted</span>
          </div>
          {isAdmin && (
            <button
              onClick={handleToggleNoTailgate}
              disabled={isUpdating}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Enable Tailgate'}
            </button>
          )}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {/* Total Count Display - Only for non-completed games and games with tailgate */}
        {game.status !== 'completed' && !game.noTailgate && (
          <div className="flex-shrink-0 text-center">
            <div className="text-3xl font-bold text-ut-orange">{totalParticipants}</div>
            <div className="text-xs text-gray-600">Items + Attendees</div>
          </div>
        )}
        
        {/* Game Info */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-grow">
              <GameHeader 
                opponent={game.opponent}
                date={game.date}
                time={game.time}
                tvNetwork={game.tvNetwork}
                isHome={game.isHome}
                size="sm"
              />
              
              {/* Score Display for Completed Games */}
              {game.status === 'completed' && game.homeScore !== undefined && game.awayScore !== undefined && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {game.result === 'W' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {game.result === 'L' && <XCircle className="w-5 h-5 text-red-600" />}
                    {game.result === 'T' && <Trophy className="w-5 h-5 text-yellow-600" />}
                    <span className={`font-bold text-lg ${
                      game.result === 'W' ? 'text-green-600' : 
                      game.result === 'L' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {game.result}
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {game.isHome ? (
                      <span>
                        Texas {game.homeScore} - {game.awayScore} {game.opponent}
                      </span>
                    ) : (
                      <span>
                        {game.opponent} {game.homeScore} - {game.awayScore} Texas
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Bowl Game Badge */}
              {game.isBowlGame && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  <Trophy className="w-3 h-3" />
                  {game.bowlName || 'Bowl Game'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {game.status === 'completed' && isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                </button>
              )}
              {/* Admin No-Tailgate Toggle for games not marked as no-tailgate */}
              {isAdmin && !game.noTailgate && game.status !== 'completed' && (
                <button
                  onClick={handleToggleNoTailgate}
                  disabled={isUpdating}
                  className="p-1 hover:bg-red-50 rounded text-red-600 disabled:opacity-50"
                  title="Mark as No Tailgate"
                >
                  <CalendarOff className="w-4 h-4" />
                </button>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                {getStatusText(game.status)}
              </span>
            </div>
          </div>

          {game.theme && (
            <div className="mb-3">
              <p className="text-sm text-ut-orange font-medium">
                🎨 {game.theme.name}
              </p>
            </div>
          )}

          {/* Stats Row */}
          {(potluckStats.totalItems > 0 || (game.expectedAttendance && game.expectedAttendance > 0)) && (
            <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
              {potluckStats.totalItems > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{potluckStats.totalItems} items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">{potluckStats.assignedItems} assigned</span>
                  </div>
                </>
              )}
              {game.expectedAttendance && game.expectedAttendance > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-ut-orange" />
                  <span>{game.expectedAttendance} attendees</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - Hide for no-tailgate games */}
          {!game.noTailgate && (
            <div className="flex space-x-2">
              <Link
                to={`/games/${game.id}`}
                className="flex-1 btn-primary text-center text-sm py-2"
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </Link>
              <button
                className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInvite) {
                    onInvite(game);
                  }
                }}
              >
                <Send className="w-3 h-3" />
                Send Invite
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;






