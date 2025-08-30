import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, ShoppingBag, Calendar, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { usePotluck } from '../hooks/usePotluck';
import { useAuth } from '../hooks/useAuth';
import { Game, PotluckItem } from '../types/Game';
import { teamLogos } from '../services/teamLogos';
import MobilePotluckPage from './MobilePotluckPageFixed';

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

export default function PotluckPage() {
  const [isMobile, setIsMobile] = useState(false);
  const { games, loading: gamesLoading } = useGames();
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PotluckItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get potluck data for selected game
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
  } = usePotluck(selectedGameId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as PotluckItem['category'],
    quantity: '',
    description: '',
    dietaryFlags: [] as string[],
  });

  // Set default game on load
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      const nextGame = games.find(g => new Date(g.date) >= new Date()) || games[0];
      setSelectedGameId(nextGame.id);
    }
  }, [games, selectedGameId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddModal && !editingItem) {
      setFormData({
        name: '',
        category: 'other',
        quantity: '',
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
        description: editingItem.description || '',
        dietaryFlags: editingItem.dietaryFlags || [],
      });
    }
  }, [editingItem]);

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
          gameId: selectedGameId,
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
      if (item.assignedTo === user.email) {
        await unassignItem(item.id);
      } else {
        await assignItem(item.id, user.id, user.email || 'Anonymous');
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

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const itemsByCategory = getItemsByCategory();
  const stats = getStats();

  const selectedGame = games.find(g => g.id === selectedGameId);
  const teamInfo = selectedGame ? teamLogos[selectedGame.opponent] : null;

  // Check for mobile after all hooks
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Return mobile version if on mobile device
  if (isMobile) {
    return <MobilePotluckPage />;
  }

  if (gamesLoading || potluckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading potluck data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Potluck Manager</h1>
              <p className="text-gray-600 mt-1">Coordinate food and drinks for tailgate parties</p>
            </div>
            
            {/* Game Selector */}
            <div className="flex items-center gap-4">
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {games.length === 0 ? (
                  <option>No games scheduled</option>
                ) : (
                  games.map(game => (
                    <option key={game.id} value={game.id}>
                      {new Date(game.date).toLocaleDateString()} - vs {game.opponent}
                    </option>
                  ))
                )}
              </select>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Game Info Card */}
        {selectedGame && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {teamInfo && (
                  <img 
                    src={teamInfo.logoUrl} 
                    alt={teamInfo.name}
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedGame.isHome ? 'vs' : '@'} {selectedGame.opponent}
                  </h2>
                  <p className="text-gray-600">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {new Date(selectedGame.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.totalItems}</p>
                  <p className="text-sm text-gray-600">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.assignedItems}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{stats.unassignedItems}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {POTLUCK_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items by Category */}
        <div className="space-y-4">
          {POTLUCK_CATEGORIES.map(category => {
            const categoryItems = itemsByCategory[category.value] || [];
            const visibleItems = selectedCategory === 'all' || selectedCategory === category.value
              ? categoryItems.filter(item => 
                  searchTerm === '' || 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : [];
            
            if (visibleItems.length === 0 && selectedCategory !== 'all') return null;
            
            return (
              <div key={category.value} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.value)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg font-semibold">{category.label}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                      {visibleItems.length}
                    </span>
                  </div>
                  {expandedCategories.has(category.value) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedCategories.has(category.value) && visibleItems.length > 0 && (
                  <div className="border-t border-gray-200">
                    <div className="divide-y divide-gray-200">
                      {visibleItems.map(item => (
                        <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
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
                              
                              {item.assignedTo && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-600">
                                    Brought by: {item.assignedTo}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {!item.assignedTo ? (
                                <button
                                  onClick={() => handleAssign(item)}
                                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  I'll bring this
                                </button>
                              ) : item.assignedTo === user?.email ? (
                                <button
                                  onClick={() => handleAssign(item)}
                                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              ) : null}
                              
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
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity/Servings
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., Serves 10-12"
                  />
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
      </div>
    </div>
  );
}