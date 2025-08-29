import { useState, useEffect, useCallback } from 'react';
import { PotluckItem } from '../types/Game';
import PotluckService from '../services/potluckService';

export function usePotluck(gameId?: string) {
  const [items, setItems] = useState<PotluckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch potluck items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: PotluckItem[];
      if (gameId) {
        data = await PotluckService.getPotluckItemsForGame(gameId);
      } else {
        data = await PotluckService.getAllPotluckItems();
      }
      
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch potluck items');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Listen for potluck updates
  useEffect(() => {
    fetchItems();

    const handleUpdate = () => {
      fetchItems();
    };

    window.addEventListener('potluckUpdate', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('potluckUpdate', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchItems]);

  // Create a new potluck item
  const createItem = useCallback(async (data: {
    gameId: string;
    name: string;
    category: PotluckItem['category'];
    quantity?: string;
    description?: string;
    assignedTo?: string;
    dietaryFlags?: string[];
  }) => {
    try {
      setError(null);
      const newItem = await PotluckService.createPotluckItem(data);
      await fetchItems();
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create potluck item');
      throw err;
    }
  }, [fetchItems]);

  // Update a potluck item
  const updateItem = useCallback(async (data: {
    id: string;
    name?: string;
    category?: PotluckItem['category'];
    quantity?: string;
    description?: string;
    assignedTo?: string;
    dietaryFlags?: string[];
  }) => {
    try {
      setError(null);
      const updatedItem = await PotluckService.updatePotluckItem(data);
      await fetchItems();
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update potluck item');
      throw err;
    }
  }, [fetchItems]);

  // Delete a potluck item
  const deleteItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await PotluckService.deletePotluckItem(id);
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete potluck item');
      throw err;
    }
  }, [fetchItems]);

  // Assign item to user
  const assignItem = useCallback(async (itemId: string, userId: string, userName: string) => {
    try {
      setError(null);
      const updatedItem = await PotluckService.assignPotluckItem(itemId, userId, userName);
      await fetchItems();
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign potluck item');
      throw err;
    }
  }, [fetchItems]);

  // Unassign item
  const unassignItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const updatedItem = await PotluckService.unassignPotluckItem(itemId);
      await fetchItems();
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign potluck item');
      throw err;
    }
  }, [fetchItems]);

  // Get items grouped by category
  const getItemsByCategory = useCallback(() => {
    const grouped: Record<string, PotluckItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [items]);

  // Get stats
  const getStats = useCallback(() => {
    const byCategory: Record<string, number> = {};
    items.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    });

    return {
      totalItems: items.length,
      assignedItems: items.filter(item => item.assignedTo).length,
      unassignedItems: items.filter(item => !item.assignedTo).length,
      byCategory,
    };
  }, [items]);

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    assignItem,
    unassignItem,
    getItemsByCategory,
    getStats,
    refreshItems: fetchItems,
  };
}