import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tv, Users, Utensils, ChevronRight } from 'lucide-react';
import { Game } from '../../types/Game';
import PotluckService from '../../services/potluckService';
import { getTeamInfo } from '../../services/teamLogos';

interface MobileGameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
}

const MobileGameCard: React.FC<MobileGameCardProps> = ({ game, onGameClick }) => {
  const navigate = useNavigate();
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

    const handleUpdate = () => {
      fetchPotluckStats();
    };

    window.addEventListener('potluckUpdate', handleUpdate);
    return () => {
      window.removeEventListener('potluckUpdate', handleUpdate);
    };
  }, [game.id]);

  const gameDate = new Date(game.date);
  const isUpcoming = gameDate >= new Date();
  const opponentInfo = getTeamInfo(game.opponent);
  
  // Format date for mobile display
  const formatMobileDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-green-500';
      case 'unplanned':
        return 'bg-yellow-500';
      case 'watch-party':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleClick = () => {
    if (onGameClick) {
      onGameClick(game);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden active:bg-gray-50 transition-colors"
      onClick={handleClick}
    >
      {/* Status Bar */}
      <div className={`h-1 ${getStatusColor(game.status)}`} />
      
      {/* Main Content */}
      <div className="p-4">
        {/* Header Row with Date and Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {formatMobileDate(gameDate)}
            </span>
            {game.time && (
              <span className="text-sm text-gray-500">
                {game.time}
              </span>
            )}
          </div>
          {!isUpcoming && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              Past
            </span>
          )}
        </div>

        {/* Opponent Row with Logo */}
        <div className="flex items-center gap-3 mb-3">
          {opponentInfo && (
            <img 
              src={opponentInfo.logoUrl} 
              alt={opponentInfo.name}
              className="w-10 h-10 object-contain"
            />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">
              {game.isHome ? 'vs' : '@'} {game.opponent}
            </h3>
            {game.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{game.location}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* TV Network */}
        {game.tvNetwork && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Tv className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{game.tvNetwork}</span>
          </div>
        )}

        {/* Theme */}
        {game.theme && (
          <div className="mb-3 px-3 py-2 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-700">
              🎨 {game.theme.name}
            </p>
          </div>
        )}

        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {potluckStats.totalItems > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Utensils className="w-4 h-4 text-gray-500" />
              <div>
                <span className="font-medium text-gray-900">{potluckStats.assignedItems}</span>
                <span className="text-gray-500">/{potluckStats.totalItems} items</span>
              </div>
            </div>
          )}
          {game.expectedAttendance && game.expectedAttendance > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{game.expectedAttendance} going</span>
            </div>
          )}
        </div>

        {/* Action Buttons - Stacked on Mobile */}
        <div className="flex flex-col gap-2">
          <button
            className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-medium text-center active:bg-orange-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to potluck page with this game selected
              // Store the selected game ID in sessionStorage so the potluck page can pick it up
              sessionStorage.setItem('selectedGameId', game.id);
              navigate('/potluck');
            }}
          >
            View Potluck
          </button>
          <button
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium active:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick RSVP
              console.log('Quick RSVP for game:', game.id);
            }}
          >
            RSVP
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileGameCard;