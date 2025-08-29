import { PotluckItem } from '../types/Game';

interface CreatePotluckItemData {
  gameId: string;
  name: string;
  category: PotluckItem['category'];
  quantity?: string;
  description?: string;
  assignedTo?: string;
  dietaryFlags?: string[];
}

interface UpdatePotluckItemData extends Partial<CreatePotluckItemData> {
  id: string;
}

export class PotluckService {
  private static STORAGE_KEY = 'texasTailgatersPotluckItems';

  // Get all potluck items for a specific game
  static async getPotluckItemsForGame(gameId: string): Promise<PotluckItem[]> {
    const allItems = await this.getAllPotluckItems();
    return allItems.filter(item => item.gameId === gameId);
  }

  // Get all potluck items
  static async getAllPotluckItems(): Promise<PotluckItem[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading potluck items:', error);
      return [];
    }
  }

  // Create a new potluck item
  static async createPotluckItem(data: CreatePotluckItemData): Promise<PotluckItem> {
    const newItem: PotluckItem = {
      id: `potluck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      isAdminAssigned: false,
      createdAt: new Date().toISOString(),
    };

    const items = await this.getAllPotluckItems();
    items.push(newItem);
    await this.savePotluckItems(items);

    // Trigger storage event for other components to update
    window.dispatchEvent(new Event('potluckUpdate'));

    return newItem;
  }

  // Update a potluck item
  static async updatePotluckItem(data: UpdatePotluckItemData): Promise<PotluckItem> {
    const { id, ...updateData } = data;
    const items = await this.getAllPotluckItems();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error('Potluck item not found');
    }

    items[index] = {
      ...items[index],
      ...updateData,
    };

    await this.savePotluckItems(items);
    window.dispatchEvent(new Event('potluckUpdate'));

    return items[index];
  }

  // Delete a potluck item
  static async deletePotluckItem(id: string): Promise<void> {
    const items = await this.getAllPotluckItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      throw new Error('Potluck item not found');
    }

    await this.savePotluckItems(filteredItems);
    window.dispatchEvent(new Event('potluckUpdate'));
  }

  // Assign a potluck item to a user
  static async assignPotluckItem(itemId: string, userId: string, userName: string): Promise<PotluckItem> {
    return this.updatePotluckItem({
      id: itemId,
      assignedTo: userName,
    });
  }

  // Unassign a potluck item
  static async unassignPotluckItem(itemId: string): Promise<PotluckItem> {
    return this.updatePotluckItem({
      id: itemId,
      assignedTo: undefined,
    });
  }

  // Get potluck items by category for a game
  static async getPotluckItemsByCategory(gameId: string): Promise<Record<string, PotluckItem[]>> {
    const items = await this.getPotluckItemsForGame(gameId);
    const grouped: Record<string, PotluckItem[]> = {};

    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  }

  // Get suggested items for a game based on theme
  static getSuggestedItems(theme?: string): string[] {
    const suggestions: Record<string, string[]> = {
      'BBQ': ['Brisket', 'Pulled Pork', 'BBQ Sauce', 'Coleslaw', 'Baked Beans', 'Cornbread'],
      'Tex-Mex': ['Fajitas', 'Queso', 'Guacamole', 'Salsa', 'Tortilla Chips', 'Margaritas'],
      'Tailgate Classic': ['Burgers', 'Hot Dogs', 'Wings', 'Chips', 'Beer', 'Soda'],
      'Southern': ['Fried Chicken', 'Mac & Cheese', 'Potato Salad', 'Sweet Tea', 'Pecan Pie'],
      'default': ['Main Dish', 'Side Dish', 'Appetizer', 'Dessert', 'Drinks', 'Plates & Utensils'],
    };

    return suggestions[theme || 'default'] || suggestions.default;
  }

  // Clear all potluck items (admin only)
  static async clearAllPotluckItems(): Promise<void> {
    await this.savePotluckItems([]);
    window.dispatchEvent(new Event('potluckUpdate'));
  }

  // Private helper to save items
  private static async savePotluckItems(items: PotluckItem[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving potluck items:', error);
      throw new Error('Failed to save potluck items');
    }
  }

  // Get statistics for a game
  static async getGamePotluckStats(gameId: string): Promise<{
    totalItems: number;
    assignedItems: number;
    unassignedItems: number;
    byCategory: Record<string, number>;
  }> {
    const items = await this.getPotluckItemsForGame(gameId);
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
  }
}

export default PotluckService;