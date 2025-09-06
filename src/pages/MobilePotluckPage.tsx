import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Calendar, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { usePotluck } from '../hooks/usePotluck';
import { useAuth } from '../hooks/useAuth';
import { Game, PotluckItem } from '../types/Game';
import { teamLogos } from '../services/teamLogos';
import { isGameUpcoming, createLocalDate } from '../utils/dateUtils';

const POTLUCK_CATEGORIES = [
  { value: 'main', label: 'Main', icon: '🍖', color: 'bg-red-100 text-red-800' },
  { value: 'side', label: 'Side', icon: '🥗', color: 'bg-green-100 text-green-800' },
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

export default function MobilePotluckPage() {
  const { games, loading: gamesLoading } = useGames();
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PotluckItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as PotluckItem['category'],
    quantity: '',
    description: '',
    dietaryFlags: [] as string[],
  });

  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      const nextGame = games.find(g => isGameUpcoming(g.date)) || games[0];
      setSelectedGameId(nextGame.id);
    }
  }, [games, selectedGameId]);

  const selectedGame = games.find(g => g.id === selectedGameId);
  const stats = getStats();
  const teamInfo = selectedGame ? teamLogos[selectedGame.opponent] : null;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAssign = async (item: PotluckItem) => {
    if (!user) return;
    
    if (item.assignedTo === user.email) {
      await unassignItem(item.id);
    } else {
      await assignItem(item.id, user.id, user.email);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateItem({
          id: editingItem.id,
          ...formData,
        });
      } else {
        await createItem({
          ...formData,
          gameId: selectedGameId,
        });
      }
      
      setShowAddModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'other',
        quantity: '',
        description: '',
        dietaryFlags: [],
      });
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  if (gamesLoading || potluckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">Potluck Manager</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
            >
              <Filter className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          {/* Game Selector */}
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {games.length === 0 ? (
              <option>No games scheduled</option>
            ) : (
              games.map(game => (
                <option key={game.id} value={game.id}>
                  {createLocalDate(game.date).toLocaleDateString()} - {game.opponent}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
        )}
      </div>

      {/* Game Stats */}
      {selectedGame && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            {teamInfo && (
              <img 
                src={teamInfo.logoUrl} 
                alt={teamInfo.name}
                className="w-10 h-10 object-contain"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">
                {selectedGame.isHome ? 'vs' : '@'} {selectedGame.opponent}
              </h2>
              <p className="text-xs text-gray-600">
                {createLocalDate(selectedGame.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-orange-500">{stats.totalItems}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{stats.assignedItems}</p>
              <p className="text-xs text-gray-600">Assigned</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-gray-400">{stats.unassignedItems}</p>
              <p className="text-xs text-gray-600">Available</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories and Items */}
      <div className="px-4 py-4 space-y-3">
        {POTLUCK_CATEGORIES.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category.value);
          if (categoryItems.length === 0 && selectedCategory !== 'all') return null;
          
          return (
            <div key={category.value} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(category.value)}
                className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium text-gray-900">{category.label}</span>
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
              
              {expandedCategories.has(category.value) && categoryItems.length > 0 && (
                <div className="border-t border-gray-200">
                  {categoryItems.map(item => (
                    <div key={item.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.name}
                            {item.quantity && (
                              <span className="text-sm text-gray-500 ml-1">({item.quantity})</span>
                            )}
                          </h4>
                          
                          {/* Dietary Flags */}
                          {item.dietaryFlags && item.dietaryFlags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.dietaryFlags.map(flag => {
                                const dietaryFlag = DIETARY_FLAGS.find(f => f.value === flag);
                                return dietaryFlag ? (
                                  <span key={flag} className="text-sm" title={dietaryFlag.label}>
                                    {dietaryFlag.emoji}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 text-gray-400 active:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 active:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      
                      {/* Assignment Status */}
                      <div className="flex items-center justify-between">
                        {item.assignedTo ? (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 truncate">
                              {item.assignedTo === user?.email ? 'You' : item.assignedTo.split('@')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                        
                        {/* Assignment Button */}
                        {!item.assignedTo ? (
                          <button
                            onClick={() => handleAssign(item)}
                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg active:bg-green-600"
                          >
                            I'll bring this
                          </button>
                        ) : item.assignedTo === user?.email ? (
                          <button
                            onClick={() => handleAssign(item)}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fixed Add Button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-orange-600 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Item' : 'Add Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-500 active:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as PotluckItem['category']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  Quantity
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="e.g., 2 dozen, 1 gallon"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Info
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DIETARY_FLAGS.map(flag => (
                    <label key={flag.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.dietaryFlags.includes(flag.value)}
                        onChange={(e) => {
                          const newFlags = e.target.checked
                            ? [...formData.dietaryFlags, flag.value]
                            : formData.dietaryFlags.filter(f => f !== flag.value);
                          setFormData({...formData, dietaryFlags: newFlags});
                        }}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm">
                        {flag.emoji} {flag.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg active:bg-orange-600"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}