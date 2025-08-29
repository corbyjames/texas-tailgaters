import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users } from 'lucide-react';
import { Game } from '../../types/Game';
import { GameHeader } from './GameHeader';
import PotluckService from '../../services/potluckService';

interface GameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onGameClick }) => {
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
      default:
        return status;
    }
  };

  const handleClick = () => {
    if (onGameClick) {
      onGameClick(game);
    }
  };

  // Calculate total participants (potluck items + expected attendees)
  const totalParticipants = potluckStats.totalItems + (game.expectedAttendance || 0);

  return (
    <div 
      className="card p-4 hover:shadow-ut-hover transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Total Count Display */}
        <div className="flex-shrink-0 text-center">
          <div className="text-3xl font-bold text-ut-orange">{totalParticipants}</div>
          <div className="text-xs text-gray-600">Items + Attendees</div>
        </div>
        
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
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)} ml-3`}>
              {getStatusText(game.status)}
            </span>
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

          <div className="flex space-x-2">
            <Link
              to={`/games/${game.id}`}
              className="flex-1 btn-primary text-center text-sm py-2"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
            </Link>
            <button
              className="flex-1 btn-secondary text-sm py-2"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement send invite functionality
                console.log('Send invite for game:', game.id);
              }}
            >
              Send Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

