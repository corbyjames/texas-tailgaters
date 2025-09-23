export interface Game {
  id: string;
  date: string;
  time?: string;
  opponent: string;
  location?: string;
  isHome: boolean;
  themeId?: string;
  status: 'scheduled' | 'in-progress' | 'planned' | 'unplanned' | 'watch-party' | 'completed';
  setupTime?: string;
  expectedAttendance?: number;
  tvNetwork?: string;
  createdAt: string;
  updatedAt: string;
  theme?: Theme;
  potluckItems?: PotluckItem[];
  // Game result fields
  homeScore?: number;
  awayScore?: number;
  result?: 'W' | 'L' | 'T';
  // In-progress game fields
  quarter?: string; // e.g., "Q1", "Q2", "Q3", "Q4", "OT", "Half"
  timeRemaining?: string; // e.g., "5:43"
  possession?: 'home' | 'away';
  // Additional fields
  isConferenceGame?: boolean;
  isBowlGame?: boolean;
  bowlName?: string;
  gameNotes?: string;
  espnGameId?: string;
  lastSyncedAt?: string;
  // Tailgate hosting field
  noTailgate?: boolean;

  // Headline field
  headline?: string;

  // Database snake_case fields (from Firebase)
  is_home?: boolean;
  theme_id?: string;
  setup_time?: string;
  expected_attendance?: number;
  tv_network?: string;
  created_at?: string;
  updated_at?: string;
  no_tailgate?: boolean;
  home_score?: number;
  away_score?: number;
  time_remaining?: string;
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
  // Quantity tracking fields
  quantityNeeded: number;  // How many of this item are needed
  quantityBrought: number; // How many have been claimed/brought
  assignments?: PotluckAssignment[]; // Track who's bringing what quantity
}

export interface PotluckAssignment {
  userId: string;
  userName: string;
  quantity: number;
  assignedAt: string;
}

