import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Tv, 
  Users, 
  ShoppingBag, 
  ArrowLeft,
  Edit2,
  Plus,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  UserPlus,
  Ban,
  CalendarOff
} from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { usePotluck } from '../hooks/usePotluck';
import { useAuth } from '../hooks/useAuth';
import { Game, PotluckItem } from '../types/Game';
import { GameHeader } from '../components/games/GameHeader';
import { teamLogos } from '../services/teamLogos';
import { PotluckSignupModal } from '../components/potluck/PotluckSignupModal';
import { RSVPModal } from '../components/games/RSVPModal';
import rsvpService, { RSVP } from '../services/rsvpService';
import GameService from '../services/gameService';

const POTLUCK_CATEGORIES = [
  { value: 'main', label: 'Main Dish', icon: '🍖', color: 'bg-red-100 text-red-800' },
  { value: 'side', label: 'Side Dish', icon: '🥗', color: 'bg-green-100 text-green-800' },
  { value: 'appetizer', label: 'Appetizer', icon: '🥨', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'dessert', label: 'Dessert', icon: '🍰', color: 'bg-pink-100 text-pink-800' },
  { value: 'drink', label: 'Drinks', icon: '🥤', color: 'bg-blue-100 text-blue-800' },
  { value: 'condiment', label: 'Condiments', icon: '🧂', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-800' },
];

const DIETARY_FLAGS = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
  { value: 'vegan', label: 'Vegan', emoji: '🥬' },
  { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
  { value: 'nut-free', label: 'Nut-Free', emoji: '🥜' },
  { value: 'spicy', label: 'Spicy', emoji: '🌶️' },
];

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const { games, loading: gamesLoading, updateGame, refreshGames } = useGames();
  const [isUpdatingNoTailgate, setIsUpdatingNoTailgate] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['main', 'side', 'appetizer']));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PotluckItem | null>(null);
  const [signupItem, setSignupItem] = useState<PotluckItem | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [rsvpStats, setRsvpStats] = useState<any>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [userRSVP, setUserRSVP] = useState<RSVP | null>(null);
  
  // Find the specific game
  const game = games.find(g => g.id === id);
  
  // Get potluck data for this game
  const { 
    items, 
    loading: potluckLoading, 
    createItem, 
    updateItem, 
    deleteItem, 
    assignItem, 
    unassignItem,
    getItemsByCategory,
    getStats 
  } = usePotluck(game?.id);

  // Form state for potluck modal
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as PotluckItem['category'],
    quantity: '',
    quantityNeeded: 1,
    description: '',
    dietaryFlags: [] as string[],
  });

  // Get unique attendees from potluck assignments
  const attendees = React.useMemo(() => {
    const uniqueAttendees = new Set<string>();
    items.forEach(item => {
      if (item.assignedTo) {
        uniqueAttendees.add(item.assignedTo);
      }
    });
    return Array.from(uniqueAttendees);
  }, [items]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddModal && !editingItem) {
      setFormData({
        name: '',
        category: 'other',
        quantity: '',
        quantityNeeded: 1,
        description: '',
        dietaryFlags: [],
      });
    }
  }, [showAddModal, editingItem]);

  // Load editing item data
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity || '',
        quantityNeeded: editingItem.quantityNeeded || 1,
        description: editingItem.description || '',
        dietaryFlags: editingItem.dietaryFlags || [],
      });
    }
  }, [editingItem]);

  // Fetch RSVPs for this game
  useEffect(() => {
    const fetchRSVPs = async () => {
      if (game?.id) {
        try {
          const gameRsvps = await rsvpService.getGameRSVPs(game.id);
          setRsvps(gameRsvps);
          
          const stats = await rsvpService.getGameRSVPStats(game.id);
          setRsvpStats(stats);
          
          // Check if current user has RSVPed
          if (user) {
            const currentUserRSVP = gameRsvps.find(r => r.userId === user.id);
            setUserRSVP(currentUserRSVP || null);
          }
        } catch (error) {
          console.error('Error fetching RSVPs:', error);
        }
      }
    };

    fetchRSVPs();

    // Listen for RSVP updates
    const handleRSVPUpdate = () => {
      fetchRSVPs();
    };

    window.addEventListener('rsvpUpdated', handleRSVPUpdate);
    window.addEventListener('rsvpCreated', handleRSVPUpdate);

    return () => {
      window.removeEventListener('rsvpUpdated', handleRSVPUpdate);
      window.removeEventListener('rsvpCreated', handleRSVPUpdate);
    };
  }, [game?.id, user]);

  if (gamesLoading || potluckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h2>
          <p className="text-gray-600 mb-6">The game you're looking for doesn't exist.</p>
          <Link to="/games" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  const teamInfo = teamLogos[game.opponent];
  const itemsByCategory = getItemsByCategory();
  const stats = getStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateItem({
          id: editingItem.id,
          ...formData,
        });
        // Expand the category to show the updated item
        setExpandedCategories(prev => new Set([...prev, formData.category]));
      } else {
        await createItem({
          gameId: game.id,
          ...formData,
        });
        // Expand the category to show the newly added item
        setExpandedCategories(prev => new Set([...prev, formData.category]));
      }
      
      setShowAddModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleAssign = async (item: PotluckItem) => {
    if (!user) return;
    
    try {
      // For single items or canceling assignments
      if (item.assignedTo === user.email || 
          item.assignments?.some(a => a.userId === user.id)) {
        // Handle unassignment
        await unassignItem(item.id);
      } else {
        // Simple assignment for single items (quantity = 1)
        await assignItem(item.id, user.id, user.name || user.email || 'Anonymous');
      }
    } catch (error) {
      console.error('Error assigning item:', error);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleDietaryFlag = (flag: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryFlags: prev.dietaryFlags.includes(flag)
        ? prev.dietaryFlags.filter(f => f !== flag)
        : [...prev.dietaryFlags, flag],
    }));
  };

  const handleToggleNoTailgate = async () => {
    if (!game) return;
    
    setIsUpdatingNoTailgate(true);
    try {
      await GameService.toggleNoTailgate(game.id);
      await refreshGames();
    } catch (error) {
      console.error('Error toggling no-tailgate status:', error);
    } finally {
      setIsUpdatingNoTailgate(false);
    }
  };

  const formatDateTime = (date: string, time?: string) => {
    const gameDate = new Date(date);
    const dateStr = gameDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return time && time !== 'TBD' ? `${dateStr} at ${time}` : dateStr;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/games" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Link>

        {/* No Tailgate Banner */}
        {game?.noTailgate && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ban className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">No Tailgate Hosted</h3>
                  <p className="text-sm text-red-700">This game will not have an organized tailgate</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={handleToggleNoTailgate}
                  disabled={isUpdatingNoTailgate}
                  className="px-4 py-2 bg-white border border-red-300 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isUpdatingNoTailgate ? 'Updating...' : 'Enable Tailgate'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <GameHeader 
                opponent={game.opponent}
                date={game.date}
                time={game.time}
                tvNetwork={game.tvNetwork}
                isHome={game.isHome}
                size="lg"
                showFullInfo={true}
              />
              
              {/* Game Details */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDateTime(game.date, game.time)}</span>
                </div>
                
                {game.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{game.location}</span>
                  </div>
                )}
                
                {game.tvNetwork && game.tvNetwork !== 'TBD' && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tv className="w-4 h-4" />
                    <span className="text-sm">{game.tvNetwork}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{attendees.length} attending</span>
                </div>
              </div>

              {/* Game Status */}
              <div className="mt-4 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  game.status === 'planned' 
                    ? 'bg-green-100 text-green-800' 
                    : game.status === 'watch-party'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {game.status === 'planned' ? 'Tailgate Planned' : 
                   game.status === 'watch-party' ? 'Watch Party' : 'Not Yet Planned'}
                </span>
                
                {game.theme && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    🎨 {game.theme.name}
                  </span>
                )}
                
                {/* Admin No-Tailgate Toggle */}
                {isAdmin && !game?.noTailgate && game?.status !== 'completed' && (
                  <button
                    onClick={handleToggleNoTailgate}
                    disabled={isUpdatingNoTailgate}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    title="Mark as No Tailgate"
                  >
                    <CalendarOff className="w-4 h-4" />
                    Mark No Tailgate
                  </button>
                )}
              </div>
            </div>

            {/* Team Logo */}
            {teamInfo && (
              <div className="flex-shrink-0">
                <img 
                  src={teamInfo.logoUrl} 
                  alt={teamInfo.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid ${game?.noTailgate ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4 mb-6`}>
          {!game?.noTailgate && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <ShoppingBag className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                <p className="text-sm text-gray-600">Potluck Items</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.assignedItems}</p>
                <p className="text-sm text-gray-600">Items Assigned</p>
              </div>
            </>
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.unassignedItems}</p>
            <p className="text-sm text-gray-600">Items Needed</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{attendees.length}</p>
            <p className="text-sm text-gray-600">People Attending</p>
          </div>
        </div>

        {/* RSVP Attendees Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">RSVPs & Attendees</h2>
              <button
                onClick={() => setShowRSVPModal(true)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base ${
                  userRSVP?.status === 'yes' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : userRSVP?.status === 'maybe'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : userRSVP?.status === 'no'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {userRSVP?.status === 'yes' && <UserCheck className="w-4 h-4" />}
                {userRSVP?.status === 'no' && <UserX className="w-4 h-4" />}
                {!userRSVP && <UserPlus className="w-4 h-4" />}
                <span className="sm:inline">
                  {userRSVP ? 
                    userRSVP.status === 'yes' ? 'You\'re Going' :
                    userRSVP.status === 'maybe' ? 'You Might Go' :
                    'Not Going'
                    : 'RSVP'}
                </span>
              </button>
            </div>
            {rsvpStats && (
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="text-green-600 font-medium">
                  ✓ {rsvpStats.yes} Going ({rsvpStats.totalAttendees})
                </span>
                <span className="text-yellow-600">
                  ? {rsvpStats.maybe} Maybe
                </span>
                <span className="text-gray-500">
                  ✗ {rsvpStats.no} Not Going
                </span>
              </div>
            )}
          </div>

          {/* Group RSVPs by status */}
          {rsvps.length > 0 ? (
            <div className="space-y-4">
              {/* Going */}
              {rsvps.filter(r => r.status === 'yes').length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Going</h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {rsvps.filter(r => r.status === 'yes').map((rsvp) => (
                      <div 
                        key={rsvp.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {rsvp.userName?.charAt(0) || rsvp.userEmail?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {rsvp.userName || rsvp.userEmail?.split('@')[0] || 'Anonymous'}
                            </p>
                            {rsvp.attendeeCount > 1 && (
                              <p className="text-xs text-gray-600">
                                +{rsvp.attendeeCount - 1} guest{rsvp.attendeeCount > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        {rsvp.notes && (
                          <span className="text-xs text-gray-500 flex-shrink-0" title={rsvp.notes}>
                            💬
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maybe */}
              {rsvps.filter(r => r.status === 'maybe').length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Maybe</h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {rsvps.filter(r => r.status === 'maybe').map((rsvp) => (
                      <div 
                        key={rsvp.id}
                        className="flex items-center gap-2 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {rsvp.userName?.charAt(0) || rsvp.userEmail?.charAt(0) || '?'}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-900 truncate">
                          {rsvp.userName || rsvp.userEmail?.split('@')[0] || 'Anonymous'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Going */}
              {rsvps.filter(r => r.status === 'no').length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Not Going</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {rsvps.filter(r => r.status === 'no').map((rsvp) => (
                      <span 
                        key={rsvp.id}
                        className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {rsvp.userName || rsvp.userEmail?.split('@')[0] || 'Anonymous'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-xs sm:text-sm">No RSVPs yet. Be the first to RSVP!</p>
          )}

          {/* From Potluck Assignments (if any items are assigned) */}
          {attendees.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Also Bringing Food</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {attendees.map((attendee, index) => (
                  <span 
                    key={index}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm"
                  >
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Potluck Section - Hide if no tailgate */}
        {game && !game.noTailgate ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Potluck Items</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Potluck Categories */}
          <div className="space-y-3">
            {POTLUCK_CATEGORIES.map(category => {
              const categoryItems = itemsByCategory[category.value] || [];
              
              return (
                <div key={category.value} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => toggleCategory(category.value)}
                      className="flex-1 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-medium">{category.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                          {categoryItems.length}
                        </span>
                      </div>
                      {expandedCategories.has(category.value) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, category: category.value as PotluckItem['category'] }));
                        setShowAddModal(true);
                      }}
                      className="ml-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title={`Add ${category.label}`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {expandedCategories.has(category.value) && categoryItems.length > 0 && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">
                      {categoryItems.map(item => (
                        <div key={item.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                {item.quantity && (
                                  <span className="text-sm text-gray-500">({item.quantity})</span>
                                )}
                                {item.dietaryFlags?.map(flag => {
                                  const dietaryFlag = DIETARY_FLAGS.find(f => f.value === flag);
                                  return dietaryFlag ? (
                                    <span key={flag} className="text-sm" title={dietaryFlag.label}>
                                      {dietaryFlag.emoji}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                              
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              
                              {/* Quantity tracking display */}
                              {item.quantityNeeded && item.quantityNeeded > 1 && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">
                                      {item.quantityBrought || 0} of {item.quantityNeeded} claimed
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        (item.quantityBrought || 0) >= item.quantityNeeded 
                                          ? 'bg-green-500' 
                                          : 'bg-orange-500'
                                      }`}
                                      style={{ width: `${Math.min(100, ((item.quantityBrought || 0) / item.quantityNeeded) * 100)}%` }}
                                    />
                                  </div>
                                  {item.assignments && item.assignments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {item.assignments.map((assignment, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                                          <Users className="w-3 h-3" />
                                          <span>{assignment.userName}: bringing {assignment.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Single item assignment display */}
                              {item.assignedTo && (!item.quantityNeeded || item.quantityNeeded === 1) && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Users className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-green-600">
                                    Brought by: {item.assignedTo}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {(() => {
                                const hasQuantityTracking = (item.quantityNeeded || 1) > 1;
                                const userHasAssignment = item.assignments?.some(a => a.userId === user?.id);
                                const isFullyClaimed = hasQuantityTracking && 
                                  (item.quantityBrought || 0) >= (item.quantityNeeded || 1);
                                const isSingleItemAssigned = !hasQuantityTracking && item.assignedTo;
                                const canSignUp = !userHasAssignment && !isFullyClaimed && !isSingleItemAssigned;
                                const canCancel = userHasAssignment || item.assignedTo === user?.email;

                                if (canSignUp) {
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (hasQuantityTracking) {
                                          setSignupItem(item);
                                        } else {
                                          handleAssign(item);
                                        }
                                      }}
                                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      I'll bring this
                                    </button>
                                  );
                                } else if (canCancel) {
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssign(item);
                                      }}
                                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  );
                                } else if (isFullyClaimed) {
                                  return (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                      Fully Claimed
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                              
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowAddModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <span className="text-sm">×</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {stats.totalItems === 0 && (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No potluck items yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to add something!</p>
            </div>
          )}
        </div>
        ) : (
          /* No Tailgate Message */
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-6 text-center">
            <Ban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Tailgate for This Game</h3>
            <p className="text-sm text-gray-500">Potluck coordination is not available as no tailgate will be hosted for this game.</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingItem) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Edit Item' : 'Add Potluck Item'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., BBQ Brisket"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      category: e.target.value as PotluckItem['category'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {POTLUCK_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      How many needed? *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantityNeeded}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantityNeeded: parseInt(e.target.value) || 1 }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.quantityNeeded > 1 ? 'Multiple people can sign up' : 'Single person item'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servings (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Serves 10-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Any special notes about this item..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Information
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_FLAGS.map(flag => (
                      <button
                        key={flag.value}
                        type="button"
                        onClick={() => toggleDietaryFlag(flag.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          formData.dietaryFlags.includes(flag.value)
                            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {flag.emoji} {flag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Potluck Signup Modal */}
        <PotluckSignupModal
          item={signupItem}
          isOpen={!!signupItem}
          onClose={() => setSignupItem(null)}
          onSuccess={() => {
            setSignupItem(null);
            // Refresh will happen automatically via potluckUpdate event
          }}
        />

        {/* RSVP Modal */}
        <RSVPModal
          game={showRSVPModal ? game : null}
          isOpen={showRSVPModal}
          onClose={() => setShowRSVPModal(false)}
        />
      </div>
    </div>
  );
}