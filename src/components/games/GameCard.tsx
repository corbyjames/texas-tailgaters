import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../../types/Game';

interface GameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onGameClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
  };

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

  return (
    <div 
      className="card p-4 hover:shadow-ut-hover transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏈</span>
          <div>
            <h3 className="font-semibold text-ut-text">
              {formatDate(game.date)} • vs {game.opponent}
            </h3>
            <p className="text-sm text-gray-600">
              {formatTime(game.time)} • {game.isHome ? 'Home' : 'Away'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
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
  );
};

export default GameCard;

