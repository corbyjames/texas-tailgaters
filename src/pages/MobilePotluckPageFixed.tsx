import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Search, Edit2, Trash2 } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { usePotluck } from '../hooks/usePotluck';
import { useAuth } from '../hooks/useAuth';
import { PotluckItem } from '../types/Game';

const POTLUCK_CATEGORIES = [
  { value: 'main', label: 'Main', icon: '🍖', color: 'bg-red-100 text-red-800' },
  { value: 'side', label: 'Side', icon: '🥗', color: 'bg-green-100 text-green-800' },
  { value: 'appetizer', label: 'Appetizer', icon: '🥨', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'dessert', label: 'Dessert', icon: '🍰', color: 'bg-pink-100 text-pink-800' },
  { value: 'drink', label: 'Drinks', icon: '🥤', color: 'bg-blue-100 text-blue-800' },
  { value: 'other', label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-800' },
];

export default function MobilePotluckPageFixed() {
  const { games, loading: gamesLoading } = useGames();
  const { user } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PotluckItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    items, 
    loading: potluckLoading, 
    createItem,
    updateItem, 
    deleteItem, 
    assignItem, 
    unassignItem,
    getStats 
  } = usePotluck(selectedGameId);

  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as PotluckItem['category'],
    quantity: '',
    description: '',
  });

  // Set initial game - check sessionStorage first
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      // Check if there's a game ID in sessionStorage (from navigation)
      const storedGameId = sessionStorage.getItem('selectedGameId');
      if (storedGameId && games.find(g => g.id === storedGameId)) {
        setSelectedGameId(storedGameId);
        // Clear it after using
        sessionStorage.removeItem('selectedGameId');
      } else {
        const nextGame = games.find(g => new Date(g.date) >= new Date()) || games[0];
        setSelectedGameId(nextGame.id);
      }
    }
  }, [games, selectedGameId]);

  const selectedGame = games.find(g => g.id === selectedGameId);
  const stats = getStats();

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Load editing item data
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity || '',
        description: editingItem.description || '',
      });
      setShowEditModal(true);
    }
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      await updateItem(editingItem.id, {
        ...formData,
        gameId: selectedGameId,
      });
      setEditingItem(null);
      setShowEditModal(false);
    } else {
      await createItem({
        ...formData,
        gameId: selectedGameId,
      });
      setShowAddModal(false);
    }

    setFormData({
      name: '',
      category: 'other',
      quantity: '',
      description: '',
    });
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(itemId);
    }
  };

  const handleAssign = async (item: PotluckItem) => {
    if (!user) return;
    
    if (item.assignedTo === user.email) {
      await unassignItem(item.id);
    } else {
      await assignItem(item.id, user.id, user.email);
    }
  };

  if (gamesLoading || potluckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading potluck...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-gray-600">No games scheduled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Potluck Manager</h1>
          
          {/* Game Selector */}
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {games.map(game => (
              <option key={game.id} value={game.id}>
                {game.opponent} - {new Date(game.date).toLocaleDateString()}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedGame && (
        <div className="px-4 py-3 bg-white border-b">
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

      {/* Categories */}
      <div className="px-4 py-4 space-y-3">
        {POTLUCK_CATEGORIES.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category.value);
          
          return (
            <div key={category.value} className="bg-white rounded-lg shadow-sm">
              <button
                onClick={() => toggleCategory(category.value)}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${category.color}`}>
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
                <div className="border-t border-gray-200 px-4 py-2">
                  {categoryItems.map(item => (
                    <div key={item.id} className="py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                            {item.quantity && (
                              <span className="text-sm text-gray-500 ml-1">({item.quantity})</span>
                            )}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          )}
                          {item.assignedTo && (
                            <p className="text-xs text-green-600 mt-1">
                              Assigned to: {item.assignedTo}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAssign(item)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              item.assignedTo === user?.email
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.assignedTo === user?.email ? 'Unassign' : 'I\'ll bring'}
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl p-4 animate-slide-up">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Potluck Item' : 'Add Potluck Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Item name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                required
              />
              
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              >
                {POTLUCK_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Quantity (optional)"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                rows={2}
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingItem(null);
                    setFormData({
                      name: '',
                      category: 'other',
                      quantity: '',
                      description: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}