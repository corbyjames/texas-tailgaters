import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Game } from '../types/Game';
import { useAuth } from './useAuth';

interface GameUpdate {
  homeScore: number;
  awayScore: number;
  status: string;
  quarter: number;
  timeRemaining: string;
  isCompleted: boolean;
  isHalftime: boolean;
  possession?: {
    team: string;
    yardLine: string;
    down: number;
    distance: number;
  };
  lastPlay?: {
    text: string;
    type: string;
    scoreValue?: number;
    clock: string;
  };
  majorEvent?: {
    type: string;
    result?: string;
    homeScore: number;
    awayScore: number;
  };
}

interface ScheduleUpdate {
  updated: number;
  added: number;
  changes: Array<{
    gameId: string;
    field: string;
    oldValue: any;
    newValue: any;
    opponent: string;
  }>;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameUpdates, setGameUpdates] = useState<Map<string, GameUpdate>>(new Map());
  const [scheduleUpdates, setScheduleUpdates] = useState<ScheduleUpdate | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(backendUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Subscribe to schedule updates
      socket.emit('subscribe-schedule');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Game update handlers
    socket.on('game-update', (update: GameUpdate & { gameId: string }) => {
      console.log('Game update received:', update);
      setGameUpdates(prev => {
        const newMap = new Map(prev);
        newMap.set(update.gameId, update);
        return newMap;
      });
      
      // Show notification for major events
      if (update.majorEvent) {
        showGameEventNotification(update.majorEvent);
      }
    });

    // Schedule update handlers
    socket.on('schedule-synced', (result: ScheduleUpdate) => {
      console.log('Schedule synced:', result);
      setScheduleUpdates(result);
      
      if (result.updated > 0 || result.added > 0) {
        showScheduleNotification(result);
      }
    });

    socket.on('network-updates', (updates: any[]) => {
      console.log('TV network updates:', updates);
      updates.forEach(update => {
        showNetworkNotification(update);
      });
    });

    socket.on('bowl-announcement', (bowlGames: any[]) => {
      console.log('Bowl game announcement:', bowlGames);
      bowlGames.forEach(game => {
        showBowlNotification(game);
      });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [backendUrl]);

  // Join a specific game room for live updates
  const joinGame = useCallback((gameId: string) => {
    if (socketRef.current && isConnected) {
      console.log(`Joining game room: ${gameId}`);
      socketRef.current.emit('join-game', gameId);
    }
  }, [isConnected]);

  // Leave a game room
  const leaveGame = useCallback((gameId: string) => {
    if (socketRef.current && isConnected) {
      console.log(`Leaving game room: ${gameId}`);
      socketRef.current.emit('leave-game', gameId);
    }
  }, [isConnected]);

  // Show game event notification
  const showGameEventNotification = (event: any) => {
    const notification = {
      id: Date.now(),
      type: 'game-event',
      title: getEventTitle(event.type),
      message: getEventMessage(event),
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/badge-72.png'
      });
    }
  };

  // Show schedule update notification
  const showScheduleNotification = (result: ScheduleUpdate) => {
    const message = `Schedule updated: ${result.updated} games updated, ${result.added} games added`;
    
    const notification = {
      id: Date.now(),
      type: 'schedule-update',
      title: '📅 Schedule Update',
      message,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Show TV network notification
  const showNetworkNotification = (update: any) => {
    const notification = {
      id: Date.now(),
      type: 'network-update',
      title: '📺 TV Network Announced',
      message: `${update.opponent} game will be on ${update.tvNetwork}`,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Show bowl game notification
  const showBowlNotification = (game: any) => {
    const notification = {
      id: Date.now(),
      type: 'bowl-announcement',
      title: '🏆 Bowl Game!',
      message: `Texas invited to ${game.bowlName}!`,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Helper functions for notification messages
  const getEventTitle = (type: string): string => {
    switch (type) {
      case 'touchdown': return '🏈 TOUCHDOWN!';
      case 'field-goal': return '🏈 Field Goal';
      case 'safety': return '🏈 Safety';
      case 'halftime': return '⏸️ Halftime';
      case 'game-end': return '📊 Final Score';
      default: return '🏈 Game Update';
    }
  };

  const getEventMessage = (event: any): string => {
    switch (event.type) {
      case 'touchdown':
      case 'field-goal':
      case 'safety':
        return `Score: ${event.homeScore}-${event.awayScore}`;
      case 'halftime':
        return `Halftime score: ${event.homeScore}-${event.awayScore}`;
      case 'game-end':
        return `Final: ${event.result === 'W' ? 'Victory! ' : ''}${event.homeScore}-${event.awayScore}`;
      default:
        return 'Game update';
    }
  };

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Dismiss a specific notification
  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    isConnected,
    gameUpdates,
    scheduleUpdates,
    notifications,
    joinGame,
    leaveGame,
    clearNotifications,
    dismissNotification
  };
}