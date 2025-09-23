import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tv, Users, Utensils, ChevronRight, UserCheck, CheckCircle, XCircle, Trophy, Ban, CalendarOff, Activity, Clock, Edit2, Check, X } from 'lucide-react';
import { Game } from '../../types/Game';
import PotluckService from '../../services/potluckService';
import rsvpService from '../../services/rsvpService';
import GameService from '../../services/gameService';
import { getTeamInfo } from '../../services/teamLogos';
import { RSVPModal } from './RSVPModal';
import { useAuth } from '../../hooks/useAuth';
import { isGameUpcoming, parseGameDate } from '../../utils/dateUtils';

interface MobileGameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
  onGameUpdated?: () => void;
}

const MobileGameCard: React.FC<MobileGameCardProps> = ({ game, onGameClick, onGameUpdated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [headlineText, setHeadlineText] = useState(game.headline || '');
  const [isSavingHeadline, setIsSavingHeadline] = useState(false);
  const [potluckStats, setPotluckStats] = useState<{
    totalItems: number;
    assignedItems: number;
  }>({ totalItems: 0, assignedItems: 0 });
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [userRSVP, setUserRSVP] = useState<any>(null);
  const [rsvpStats, setRsvpStats] = useState<any>(null);

  useEffect(() => {
    const fetchPotluckStats = async () => {
      const stats = await PotluckService.getGamePotluckStats(game.id);
      setPotluckStats({
        totalItems: stats.totalItems,
        assignedItems: stats.assignedItems,
      });
    };

    const fetchRSVPData = async () => {
      if (user) {
        const userRsvp = await rsvpService.getUserRSVPForGame(user.id, game.id);
        setUserRSVP(userRsvp);
      }
      const stats = await rsvpService.getGameRSVPStats(game.id);
      setRsvpStats(stats);
    };

    fetchPotluckStats();
    fetchRSVPData();

    const handleUpdate = () => {
      fetchPotluckStats();
      fetchRSVPData();
    };

    window.addEventListener('potluckUpdate', handleUpdate);
    window.addEventListener('rsvpUpdated', handleUpdate);
    window.addEventListener('rsvpCreated', handleUpdate);
    
    return () => {
      window.removeEventListener('potluckUpdate', handleUpdate);
      window.removeEventListener('rsvpUpdated', handleUpdate);
      window.removeEventListener('rsvpCreated', handleUpdate);
    };
  }, [game.id, user]);

  const gameDate = parseGameDate(game.date);
  const isUpcoming = isGameUpcoming(game.date);
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
    // Navigate to game details page instead of calling onGameClick
    navigate(`/games/${game.id}`);
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

  const handleSaveHeadline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingHeadline(true);
    try {
      await GameService.updateGame({
        id: game.id,
        headline: headlineText
      });
      setIsEditingHeadline(false);
      if (onGameUpdated) {
        onGameUpdated();
      }
    } catch (error) {
      console.error('Error saving headline:', error);
    } finally {
      setIsSavingHeadline(false);
    }
  };

  const handleCancelHeadline = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeadlineText(game.headline || '');
    setIsEditingHeadline(false);
  };

  // For completed games, show a more compact view
  if (game.status === 'completed') {
    return (
      <>
        <div 
          className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden active:bg-gray-100 transition-colors"
          onClick={handleClick}
        >
          <div className="p-3">
            {/* Headline if exists */}
            {game.headline && (
              <div className="mb-2 text-sm font-medium text-yellow-900 bg-yellow-50 px-2 py-1 rounded">
                {game.headline}
              </div>
            )}
            {/* Score Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Result Icon */}
                <div className="flex items-center gap-1">
                  {game.result === 'W' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {game.result === 'L' && <XCircle className="w-5 h-5 text-red-600" />}
                  {game.result === 'T' && <Trophy className="w-5 h-5 text-yellow-600" />}
                  <span className={`font-bold text-lg ${
                    game.result === 'W' ? 'text-green-600' : 
                    game.result === 'L' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {game.result === 'W' ? 'W' : game.result === 'L' ? 'L' : game.result === 'T' ? 'T' : '-'}
                  </span>
                </div>
                
                {/* Score */}
                {game.homeScore !== undefined && game.awayScore !== undefined && (
                  <span className="font-semibold text-lg">
                    {game.isHome ? (
                      <span>
                        <span className={game.homeScore > game.awayScore ? 'text-green-600' : game.homeScore < game.awayScore ? 'text-red-600' : 'text-gray-800'}>
                          {game.homeScore}
                        </span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className={game.awayScore > game.homeScore ? 'text-green-600' : game.awayScore < game.homeScore ? 'text-red-600' : 'text-gray-800'}>
                          {game.awayScore}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span className={game.homeScore > game.awayScore ? 'text-green-600' : game.homeScore < game.awayScore ? 'text-red-600' : 'text-gray-800'}>
                          {game.homeScore}
                        </span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className={game.awayScore > game.homeScore ? 'text-green-600' : game.awayScore < game.homeScore ? 'text-red-600' : 'text-gray-800'}>
                          {game.awayScore}
                        </span>
                      </span>
                    )}
                  </span>
                )}
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Game Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {formatMobileDate(gameDate)}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                Final
              </span>
            </div>
          </div>
        </div>
        
        {/* RSVP Modal */}
        <RSVPModal 
          game={game}
          isOpen={showRSVPModal}
          onClose={() => {
            setShowRSVPModal(false);
            // Refresh RSVP data after modal closes
            if (user) {
              rsvpService.getUserRSVPForGame(user.id, game.id).then(setUserRSVP);
            }
            rsvpService.getGameRSVPStats(game.id).then(setRsvpStats);
          }}
        />
      </>
    );
  }

  return (
    <div 
      className={`rounded-lg shadow-sm border overflow-hidden transition-colors ${
        game.noTailgate 
          ? 'bg-gray-50 opacity-75 border-gray-300' 
          : 'bg-white border-gray-200 active:bg-gray-50'
      }`}
      onClick={game.noTailgate ? undefined : handleClick}
    >
      {/* Headline Section */}
      {(game.headline || isAdmin) && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-2">
          {isEditingHeadline ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                className="flex-grow px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Enter headline..."
                autoFocus
              />
              <button
                onClick={handleSaveHeadline}
                disabled={isSavingHeadline}
                className="p-1 text-green-600"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelHeadline}
                className="p-1 text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-yellow-900">
                {game.headline || <span className="text-yellow-600 italic">Add headline</span>}
              </p>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeadline(true);
                  }}
                  className="p-1"
                >
                  <Edit2 className="w-4 h-4 text-yellow-600" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Tailgate Badge */}
      {game.noTailgate && (
        <div className="bg-red-100 border-b border-red-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800">
              <Ban className="w-4 h-4" />
              <span className="text-sm font-medium">No Tailgate Hosted</span>
            </div>
            {isAdmin && (
              <button
                onClick={handleToggleNoTailgate}
                disabled={isUpdating}
                className="text-xs px-2 py-1 bg-white border border-red-300 rounded text-red-600 disabled:opacity-50"
              >
                {isUpdating ? '...' : 'Enable'}
              </button>
            )}
          </div>
        </div>
      )}
      
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
          <div className="flex items-center gap-2">
            {/* Admin No-Tailgate Toggle */}
            {isAdmin && !game.noTailgate && (
              <button
                onClick={handleToggleNoTailgate}
                disabled={isUpdating}
                className="p-1 text-red-600 disabled:opacity-50"
              >
                <CalendarOff className="w-4 h-4" />
              </button>
            )}
            {!isUpcoming && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                Past
              </span>
            )}
          </div>
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

        {/* Score Display for In-Progress Games */}
        {game.status === 'in-progress' && game.homeScore !== undefined && game.awayScore !== undefined && (
          <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600 animate-pulse" />
                <span className="font-bold text-orange-600 text-sm">LIVE</span>
                {game.quarter && (
                  <span className="text-xs text-gray-600">• {game.quarter}</span>
                )}
                {game.timeRemaining && (
                  <span className="text-xs text-gray-600">{game.timeRemaining}</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">
                  {game.isHome ? 'Texas' : game.opponent}
                </div>
                <div className={`text-2xl font-bold ${
                  game.isHome 
                    ? (game.homeScore > game.awayScore ? 'text-green-600' : game.homeScore < game.awayScore ? 'text-red-600' : 'text-gray-800')
                    : (game.homeScore > game.awayScore ? 'text-green-600' : game.homeScore < game.awayScore ? 'text-red-600' : 'text-gray-800')
                }`}>
                  {game.isHome ? game.homeScore : game.homeScore}
                </div>
              </div>
              <div className="text-gray-400 text-xl">-</div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">
                  {game.isHome ? game.opponent : 'Texas'}
                </div>
                <div className={`text-2xl font-bold ${
                  game.isHome 
                    ? (game.awayScore > game.homeScore ? 'text-green-600' : game.awayScore < game.homeScore ? 'text-red-600' : 'text-gray-800')
                    : (game.awayScore > game.homeScore ? 'text-green-600' : game.awayScore < game.homeScore ? 'text-red-600' : 'text-gray-800')
                }`}>
                  {game.isHome ? game.awayScore : game.awayScore}
                </div>
              </div>
            </div>
            {game.possession && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-600">
                  Possession: {game.possession === 'home' ? (game.isHome ? 'Texas' : game.opponent) : (game.isHome ? game.opponent : 'Texas')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Game */}
        {game.status === 'scheduled' && !game.homeScore && (
          <div className="mb-3 bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Kickoff: {game.time || 'TBD'}
              </span>
            </div>
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

        {/* Action Buttons - Only show if not no-tailgate */}
        {!game.noTailgate && (
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
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                userRSVP?.status === 'yes'
                  ? 'bg-green-100 text-green-700 active:bg-green-200'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setShowRSVPModal(true);
              }}
            >
              {userRSVP?.status === 'yes' && <UserCheck className="w-4 h-4" />}
              {userRSVP ? 
                userRSVP.status === 'yes' ? 'Going' : 
                userRSVP.status === 'maybe' ? 'Maybe' : 
                'Not Going' 
                : 'RSVP'}
            </button>
          </div>
        )}
      </div>
      
      {/* RSVP Modal */}
      <RSVPModal
        game={showRSVPModal ? game : null}
        isOpen={showRSVPModal}
        onClose={() => setShowRSVPModal(false)}
      />
    </div>
  );
};

export default MobileGameCard;