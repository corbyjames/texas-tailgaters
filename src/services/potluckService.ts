import { PotluckItem } from '../types/Game';
import firebaseService from './firebaseService';

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
  // Get all potluck items for a specific game
  static async getPotluckItemsForGame(gameId: string): Promise<PotluckItem[]> {
    try {
      const items = await firebaseService.getPotluckItems(gameId);
      
      // Map to frontend format
      return items.map(item => ({
        id: item.id!,
        gameId: item.game_id,
        name: item.name,
        category: item.category as PotluckItem['category'],
        quantity: item.quantity,
        description: item.description,
        assignedTo: item.assigned_to,
        isAdminAssigned: item.is_admin_assigned,
        dietaryFlags: item.dietary_flags,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching potluck items:', error);
      return [];
    }
  }

  // Get all potluck items
  static async getAllPotluckItems(): Promise<PotluckItem[]> {
    try {
      const items = await firebaseService.getPotluckItems();
      
      // Map to frontend format
      return items.map(item => ({
        id: item.id!,
        gameId: item.game_id,
        name: item.name,
        category: item.category as PotluckItem['category'],
        quantity: item.quantity,
        description: item.description,
        assignedTo: item.assigned_to,
        isAdminAssigned: item.is_admin_assigned,
        dietaryFlags: item.dietary_flags,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching all potluck items:', error);
      return [];
    }
  }

  // Create a new potluck item
  static async createPotluckItem(data: CreatePotluckItemData): Promise<PotluckItem> {
    try {
      const insertData = {
        game_id: data.gameId,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        description: data.description,
        assigned_to: data.assignedTo,
        is_admin_assigned: false,
        dietary_flags: data.dietaryFlags || []
      };

      const newItem = await firebaseService.createPotluckItem(insertData);

      return {
        id: newItem.id!,
        gameId: newItem.game_id,
        name: newItem.name,
        category: newItem.category as PotluckItem['category'],
        quantity: newItem.quantity,
        description: newItem.description,
        assignedTo: newItem.assigned_to,
        isAdminAssigned: newItem.is_admin_assigned,
        dietaryFlags: newItem.dietary_flags,
        createdAt: newItem.created_at
      };
    } catch (error) {
      console.error('Error creating potluck item:', error);
      throw error;
    }
  }

  // Update a potluck item
  static async updatePotluckItem(data: UpdatePotluckItemData): Promise<PotluckItem | null> {
    try {
      const { id, ...updateData } = data;
      
      // Map frontend fields to database fields
      const dbUpdateData: any = {};
      if (updateData.gameId !== undefined) dbUpdateData.game_id = updateData.gameId;
      if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
      if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
      if (updateData.quantity !== undefined) dbUpdateData.quantity = updateData.quantity;
      if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
      if (updateData.assignedTo !== undefined) dbUpdateData.assigned_to = updateData.assignedTo;
      if (updateData.dietaryFlags !== undefined) dbUpdateData.dietary_flags = updateData.dietaryFlags;

      const updatedItem = await firebaseService.updatePotluckItem(id, dbUpdateData);
      
      if (!updatedItem) return null;

      return {
        id: updatedItem.id!,
        gameId: updatedItem.game_id,
        name: updatedItem.name,
        category: updatedItem.category as PotluckItem['category'],
        quantity: updatedItem.quantity,
        description: updatedItem.description,
        assignedTo: updatedItem.assigned_to,
        isAdminAssigned: updatedItem.is_admin_assigned,
        dietaryFlags: updatedItem.dietary_flags,
        createdAt: updatedItem.created_at
      };
    } catch (error) {
      console.error('Error updating potluck item:', error);
      return null;
    }
  }

  // Delete a potluck item
  static async deletePotluckItem(id: string): Promise<boolean> {
    try {
      return await firebaseService.deletePotluckItem(id);
    } catch (error) {
      console.error('Error deleting potluck item:', error);
      return false;
    }
  }

  // Admin: Assign item to user
  static async assignItemToUser(itemId: string, assignedTo: string): Promise<PotluckItem | null> {
    try {
      const updatedItem = await firebaseService.updatePotluckItem(itemId, {
        assigned_to: assignedTo,
        is_admin_assigned: true
      });
      
      if (!updatedItem) return null;

      return {
        id: updatedItem.id!,
        gameId: updatedItem.game_id,
        name: updatedItem.name,
        category: updatedItem.category as PotluckItem['category'],
        quantity: updatedItem.quantity,
        description: updatedItem.description,
        assignedTo: updatedItem.assigned_to,
        isAdminAssigned: updatedItem.is_admin_assigned,
        dietaryFlags: updatedItem.dietary_flags,
        createdAt: updatedItem.created_at
      };
    } catch (error) {
      console.error('Error assigning item:', error);
      return null;
    }
  }

  // User: Assign item to themselves
  static async assignPotluckItem(itemId: string, userId: string, userName: string): Promise<PotluckItem | null> {
    try {
      const updatedItem = await firebaseService.updatePotluckItem(itemId, {
        assigned_to: userName || userId,
        is_admin_assigned: false
      });
      
      if (!updatedItem) return null;

      // Trigger update event
      window.dispatchEvent(new CustomEvent('potluckUpdate'));

      return {
        id: updatedItem.id!,
        gameId: updatedItem.game_id,
        name: updatedItem.name,
        category: updatedItem.category as PotluckItem['category'],
        quantity: updatedItem.quantity,
        description: updatedItem.description,
        assignedTo: updatedItem.assigned_to,
        isAdminAssigned: updatedItem.is_admin_assigned,
        dietaryFlags: updatedItem.dietary_flags,
        createdAt: updatedItem.created_at
      };
    } catch (error) {
      console.error('Error assigning potluck item:', error);
      return null;
    }
  }

  // User: Unassign item from themselves
  static async unassignPotluckItem(itemId: string): Promise<PotluckItem | null> {
    try {
      const updatedItem = await firebaseService.updatePotluckItem(itemId, {
        assigned_to: null,
        is_admin_assigned: false
      });
      
      if (!updatedItem) return null;

      // Trigger update event
      window.dispatchEvent(new CustomEvent('potluckUpdate'));

      return {
        id: updatedItem.id!,
        gameId: updatedItem.game_id,
        name: updatedItem.name,
        category: updatedItem.category as PotluckItem['category'],
        quantity: updatedItem.quantity,
        description: updatedItem.description,
        assignedTo: updatedItem.assigned_to,
        isAdminAssigned: updatedItem.is_admin_assigned,
        dietaryFlags: updatedItem.dietary_flags,
        createdAt: updatedItem.created_at
      };
    } catch (error) {
      console.error('Error unassigning potluck item:', error);
      return null;
    }
  }

  // Check for duplicates
  static async checkDuplicates(gameId: string, itemName: string): Promise<PotluckItem[]> {
    const items = await this.getPotluckItemsForGame(gameId);
    return items.filter(item => 
      item.name.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(item.name.toLowerCase())
    );
  }

  // Get game potluck statistics
  static async getGamePotluckStats(gameId: string): Promise<{
    totalItems: number;
    assignedItems: number;
    unassignedItems: number;
  }> {
    try {
      const items = await this.getPotluckItemsForGame(gameId);
      
      const totalItems = items.length;
      const assignedItems = items.filter(item => item.assignedTo).length;
      const unassignedItems = items.filter(item => !item.assignedTo).length;
      
      return {
        totalItems,
        assignedItems,
        unassignedItems
      };
    } catch (error) {
      console.error('Error getting game potluck stats:', error);
      return {
        totalItems: 0,
        assignedItems: 0,
        unassignedItems: 0
      };
    }
  }
}

export default PotluckService;