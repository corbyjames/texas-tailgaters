export interface Game {
  id: string;
  date: string;
  time?: string;
  opponent: string;
  location?: string;
  isHome: boolean;
  themeId?: string;
  status: 'planned' | 'unplanned' | 'watch-party';
  setupTime?: string;
  expectedAttendance?: number;
  tvNetwork?: string;
  createdAt: string;
  updatedAt: string;
  theme?: Theme;
  potluckItems?: PotluckItem[];
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  opponent?: string;
  colors?: string[];
  foodSuggestions?: string[];
  isCustom: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'member';
}

export interface PotluckItem {
  id: string;
  gameId: string;
  name: string;
  category: 'main' | 'side' | 'appetizer' | 'dessert' | 'drink' | 'condiment' | 'other';
  quantity?: string;
  description?: string;
  assignedTo?: string;
  isAdminAssigned: boolean;
  dietaryFlags?: string[];
  createdAt: string;
  user?: User;
}

