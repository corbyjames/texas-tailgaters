// Firebase Database Service - Replaces Supabase
import { database } from '../config/firebase';
import { ref, set, get, push, update, remove, onValue, query, orderByChild, equalTo } from 'firebase/database';

interface Game {
  id?: string;
  date: string;
  time?: string;
  opponent: string;
  location?: string;
  is_home: boolean;
  theme_id?: string;
  status: string;
  setup_time?: string;
  expected_attendance: number;
  tv_network?: string;
  tvNetwork?: string; // Support both formats for compatibility
  no_tailgate?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Theme {
  id?: string;
  name: string;
  description?: string;
  opponent?: string;
  colors?: string[];
  food_suggestions?: string[];
  is_custom: boolean;
  created_at?: string;
}

interface PotluckItem {
  id?: string;
  game_id?: string;
  name: string;
  category: string;
  quantity?: string;
  description?: string;
  assigned_to?: string;
  is_admin_assigned: boolean;
  dietary_flags?: string[];
  created_at?: string;
}

class FirebaseService {
  // Games operations
  async getGames(): Promise<Game[]> {
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (snapshot.exists()) {
      const gamesData = snapshot.val();
      return Object.keys(gamesData).map(key => {
        const game = gamesData[key];
        // Ensure tv_network field is present for compatibility
        if (game.tvNetwork && !game.tv_network) {
          game.tv_network = game.tvNetwork;
        }
        return {
          id: key,
          ...game
        };
      });
    }
    return [];
  }

  async createGame(game: Omit<Game, 'id'>): Promise<Game> {
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);
    
    // Clean data - remove undefined values (Firebase doesn't accept them)
    const cleanData: any = {};
    Object.keys(game).forEach(key => {
      if ((game as any)[key] !== undefined) {
        cleanData[key] = (game as any)[key];
      }
    });
    
    // Handle both tvNetwork and tv_network field names
    if (cleanData.tvNetwork && !cleanData.tv_network) {
      cleanData.tv_network = cleanData.tvNetwork;
      delete cleanData.tvNetwork;
    }
    
    const gameData = {
      ...cleanData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await set(newGameRef, gameData);
    return { id: newGameRef.key!, ...gameData };
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | null> {
    const gameRef = ref(database, `games/${id}`);
    
    // Clean data - remove undefined values
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] !== undefined) {
        cleanUpdates[key] = (updates as any)[key];
      }
    });
    
    const updateData = {
      ...cleanUpdates,
      updated_at: new Date().toISOString()
    };
    
    await update(gameRef, updateData);
    const snapshot = await get(gameRef);
    
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  }

  async deleteGame(id: string): Promise<boolean> {
    try {
      const gameRef = ref(database, `games/${id}`);
      await remove(gameRef);
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }

  // Themes operations
  async getThemes(): Promise<Theme[]> {
    const themesRef = ref(database, 'themes');
    const snapshot = await get(themesRef);
    
    if (snapshot.exists()) {
      const themesData = snapshot.val();
      return Object.keys(themesData).map(key => ({
        id: key,
        ...themesData[key]
      }));
    }
    
    // Initialize with default themes if none exist
    await this.initializeDefaultThemes();
    return this.getThemes();
  }

  private async initializeDefaultThemes(): Promise<void> {
    const defaultThemes = [
      {
        name: 'BBQ Bash',
        description: 'Classic Texas BBQ tailgate',
        opponent: 'Oklahoma',
        colors: ['#841617', '#FFC72C'],
        food_suggestions: ['Brisket', 'Ribs', 'Coleslaw', 'Potato Salad'],
        is_custom: false,
        created_at: new Date().toISOString()
      },
      {
        name: 'Tex-Mex Fiesta',
        description: 'Mexican-themed tailgate',
        opponent: 'Baylor',
        colors: ['#003015', '#FFB81C'],
        food_suggestions: ['Tacos', 'Queso', 'Guacamole', 'Margaritas'],
        is_custom: false,
        created_at: new Date().toISOString()
      },
      {
        name: 'Louisiana Cookout',
        description: 'Cajun-themed tailgate',
        opponent: 'LSU',
        colors: ['#461D7C', '#FDD023'],
        food_suggestions: ['Gumbo', 'Jambalaya', 'Crawfish', 'Beignets'],
        is_custom: false,
        created_at: new Date().toISOString()
      }
    ];

    for (const theme of defaultThemes) {
      await this.createTheme(theme);
    }
  }

  async createTheme(theme: Omit<Theme, 'id'>): Promise<Theme> {
    const themesRef = ref(database, 'themes');
    const newThemeRef = push(themesRef);
    
    // Clean data - remove undefined values
    const cleanData: any = {};
    Object.keys(theme).forEach(key => {
      if ((theme as any)[key] !== undefined) {
        cleanData[key] = (theme as any)[key];
      }
    });
    
    const themeData = {
      ...cleanData,
      created_at: cleanData.created_at || new Date().toISOString()
    };
    
    await set(newThemeRef, themeData);
    return { id: newThemeRef.key!, ...themeData };
  }

  // Potluck operations
  async getPotluckItems(gameId?: string): Promise<any[]> {
    const potluckRef = ref(database, 'potluck_items');
    const snapshot = await get(potluckRef);
    
    if (snapshot.exists()) {
      const itemsData = snapshot.val();
      const allItems = Object.keys(itemsData).map(key => ({
        id: key,
        ...itemsData[key]
      }));
      
      return gameId 
        ? allItems.filter(item => item.game_id === gameId)
        : allItems;
    }
    return [];
  }

  async createPotluckItem(item: any): Promise<any> {
    const potluckRef = ref(database, 'potluck_items');
    const newItemRef = push(potluckRef);
    
    // Clean data - remove undefined values
    const cleanData: any = {};
    Object.keys(item).forEach(key => {
      if ((item as any)[key] !== undefined) {
        cleanData[key] = (item as any)[key];
      }
    });
    
    const itemData = {
      ...cleanData,
      created_at: new Date().toISOString()
    };
    
    await set(newItemRef, itemData);
    return { id: newItemRef.key!, ...itemData };
  }

  async getPotluckItem(id: string): Promise<any | null> {
    const itemRef = ref(database, `potluck_items/${id}`);
    const snapshot = await get(itemRef);
    
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  }

  async updatePotluckItem(id: string, updates: any): Promise<any | null> {
    const itemRef = ref(database, `potluck_items/${id}`);
    
    // Clean data - remove undefined values
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] !== undefined) {
        cleanUpdates[key] = (updates as any)[key];
      }
    });
    
    await update(itemRef, cleanUpdates);
    
    const snapshot = await get(itemRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  }

  async deletePotluckItem(id: string): Promise<boolean> {
    try {
      const itemRef = ref(database, `potluck_items/${id}`);
      await remove(itemRef);
      return true;
    } catch (error) {
      console.error('Error deleting potluck item:', error);
      return false;
    }
  }

  // Real-time listeners
  onGamesChange(callback: (games: Game[]) => void): () => void {
    const gamesRef = ref(database, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        const gamesData = snapshot.val();
        const games = Object.keys(gamesData).map(key => ({
          id: key,
          ...gamesData[key]
        }));
        callback(games);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  }

  onPotluckItemsChange(gameId: string, callback: (items: PotluckItem[]) => void): () => void {
    const potluckRef = ref(database, 'potluck_items');
    const unsubscribe = onValue(potluckRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemsData = snapshot.val();
        const allItems = Object.keys(itemsData).map(key => ({
          id: key,
          ...itemsData[key]
        }));
        const gameItems = allItems.filter(item => item.game_id === gameId);
        callback(gameItems);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  }

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    await remove(ref(database, 'games'));
    await remove(ref(database, 'themes'));
    await remove(ref(database, 'potluck_items'));
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;