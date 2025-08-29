// Local Storage Service - Immediate database replacement
// This replaces Supabase with browser localStorage for now

interface Game {
  id: string;
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
  created_at: string;
  updated_at: string;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  opponent?: string;
  colors?: string[];
  food_suggestions?: string[];
  is_custom: boolean;
  created_at: string;
}

interface PotluckItem {
  id: string;
  game_id?: string;
  name: string;
  category: string;
  quantity?: string;
  description?: string;
  assigned_to?: string;
  is_admin_assigned: boolean;
  dietary_flags?: string[];
  created_at: string;
}

class LocalStorageService {
  private prefix = 'texas_tailgaters_';

  // Generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Games operations
  async getGames(): Promise<Game[]> {
    const games = localStorage.getItem(this.prefix + 'games');
    return games ? JSON.parse(games) : [];
  }

  async createGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game> {
    const games = await this.getGames();
    const newGame: Game = {
      ...game,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    games.push(newGame);
    localStorage.setItem(this.prefix + 'games', JSON.stringify(games));
    return newGame;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | null> {
    const games = await this.getGames();
    const index = games.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    games[index] = {
      ...games[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(this.prefix + 'games', JSON.stringify(games));
    return games[index];
  }

  async deleteGame(id: string): Promise<boolean> {
    const games = await this.getGames();
    const filtered = games.filter(g => g.id !== id);
    localStorage.setItem(this.prefix + 'games', JSON.stringify(filtered));
    return filtered.length < games.length;
  }

  // Themes operations
  async getThemes(): Promise<Theme[]> {
    const themes = localStorage.getItem(this.prefix + 'themes');
    if (!themes) {
      // Initialize with default themes
      const defaultThemes = [
        {
          id: this.generateId(),
          name: 'BBQ Bash',
          description: 'Classic Texas BBQ tailgate',
          opponent: 'Oklahoma',
          colors: ['#841617', '#FFC72C'],
          food_suggestions: ['Brisket', 'Ribs', 'Coleslaw', 'Potato Salad'],
          is_custom: false,
          created_at: new Date().toISOString()
        },
        {
          id: this.generateId(),
          name: 'Tex-Mex Fiesta',
          description: 'Mexican-themed tailgate',
          opponent: 'Baylor',
          colors: ['#003015', '#FFB81C'],
          food_suggestions: ['Tacos', 'Queso', 'Guacamole', 'Margaritas'],
          is_custom: false,
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.prefix + 'themes', JSON.stringify(defaultThemes));
      return defaultThemes;
    }
    return JSON.parse(themes);
  }

  async createTheme(theme: Omit<Theme, 'id' | 'created_at'>): Promise<Theme> {
    const themes = await this.getThemes();
    const newTheme: Theme = {
      ...theme,
      id: this.generateId(),
      created_at: new Date().toISOString()
    };
    themes.push(newTheme);
    localStorage.setItem(this.prefix + 'themes', JSON.stringify(themes));
    return newTheme;
  }

  // Potluck operations
  async getPotluckItems(gameId?: string): Promise<PotluckItem[]> {
    const items = localStorage.getItem(this.prefix + 'potluck_items');
    const allItems = items ? JSON.parse(items) : [];
    return gameId ? allItems.filter((item: PotluckItem) => item.game_id === gameId) : allItems;
  }

  async createPotluckItem(item: Omit<PotluckItem, 'id' | 'created_at'>): Promise<PotluckItem> {
    const items = await this.getPotluckItems();
    const newItem: PotluckItem = {
      ...item,
      id: this.generateId(),
      created_at: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(this.prefix + 'potluck_items', JSON.stringify(items));
    return newItem;
  }

  async updatePotluckItem(id: string, updates: Partial<PotluckItem>): Promise<PotluckItem | null> {
    const items = await this.getPotluckItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates
    };
    localStorage.setItem(this.prefix + 'potluck_items', JSON.stringify(items));
    return items[index];
  }

  async deletePotluckItem(id: string): Promise<boolean> {
    const items = await this.getPotluckItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(this.prefix + 'potluck_items', JSON.stringify(filtered));
    return filtered.length < items.length;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    localStorage.removeItem(this.prefix + 'games');
    localStorage.removeItem(this.prefix + 'themes');
    localStorage.removeItem(this.prefix + 'potluck_items');
  }

  // Export data (for backup)
  async exportData(): Promise<string> {
    const data = {
      games: await this.getGames(),
      themes: await this.getThemes(),
      potluck_items: await this.getPotluckItems()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data (for restore)
  async importData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.games) localStorage.setItem(this.prefix + 'games', JSON.stringify(data.games));
    if (data.themes) localStorage.setItem(this.prefix + 'themes', JSON.stringify(data.themes));
    if (data.potluck_items) localStorage.setItem(this.prefix + 'potluck_items', JSON.stringify(data.potluck_items));
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;