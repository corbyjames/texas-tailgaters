import React, { useEffect } from 'react';
import { getTeamInfo, checkMissingLogo } from '../../services/teamLogos';

interface GameHeaderProps {
  opponent: string;
  date: string;
  time?: string;
  tvNetwork?: string;
  isHome: boolean;
  showFullInfo?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GameHeader: React.FC<GameHeaderProps> = ({ 
  opponent, 
  date, 
  time, 
  tvNetwork,
  isHome,
  showFullInfo = false,
  size = 'md'
}) => {
  const teamInfo = getTeamInfo(opponent);
  
  // Check for missing logo and log warning in development
  useEffect(() => {
    checkMissingLogo(opponent);
  }, [opponent]);
  
  const logoSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const formatDate = (dateString: string) => {
    // Use createLocalDate for consistency across the app
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: showFullInfo ? 'long' : undefined,
      month: showFullInfo ? 'long' : 'short', 
      day: 'numeric',
      year: showFullInfo ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Team Logo */}
      <div className="flex-shrink-0">
        {teamInfo ? (
          <div 
            className={`${logoSizes[size]} rounded-lg p-1 flex items-center justify-center`}
            style={{ 
              backgroundColor: `${teamInfo.primaryColor}15`,
              border: `2px solid ${teamInfo.primaryColor}30`
            }}
          >
            <img 
              src={teamInfo.logoUrl} 
              alt={`${teamInfo.name} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Replace with fallback
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-2xl">🏈</span>';
                }
              }}
            />
          </div>
        ) : (
          <div className={`${logoSizes[size]} rounded-lg bg-gray-100 flex items-center justify-center`}>
            <span className={size === 'lg' ? 'text-3xl' : 'text-2xl'}>🏈</span>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex-grow">
        <div className={`font-bold ${textSizes[size]} text-ut-text flex items-center gap-2`}>
          <span>{isHome ? 'vs' : '@'}</span>
          <span>{opponent}</span>
          {teamInfo && size !== 'sm' && (
            <span 
              className="text-xs px-2 py-1 rounded-full font-normal"
              style={{ 
                backgroundColor: `${teamInfo.primaryColor}15`,
                color: teamInfo.primaryColor
              }}
            >
              {teamInfo.name}
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm">
          {formatDate(date)}
          {time && <span> • {time}</span>}
          {tvNetwork && tvNetwork !== 'TBD' && <span> • 📺 {tvNetwork}</span>}
          <span className="ml-2">
            {isHome ? '🏠 Home' : '✈️ Away'}
          </span>
        </div>
      </div>
    </div>
  );
};