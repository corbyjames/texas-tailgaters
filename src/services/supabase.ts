import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock client for development
const createMockClient = () => {
  return {
    auth: {
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Mock auth state
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ error: null }),
    }),
  };
};

// Use mock client if environment variables are not set
export const supabase = supabaseUrl === 'https://placeholder.supabase.co' 
  ? createMockClient() 
  : createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone?: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          date: string;
          time?: string;
          opponent: string;
          location?: string;
          is_home: boolean;
          theme_id?: string;
          status: string;
          setup_time?: string;
          expected_attendance?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          time?: string;
          opponent: string;
          location?: string;
          is_home: boolean;
          theme_id?: string;
          status?: string;
          setup_time?: string;
          expected_attendance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          time?: string;
          opponent?: string;
          location?: string;
          is_home?: boolean;
          theme_id?: string;
          status?: string;
          setup_time?: string;
          expected_attendance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      themes: {
        Row: {
          id: string;
          name: string;
          description?: string;
          opponent: string;
          colors: string[];
          food_suggestions: string[];
          is_custom: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          opponent: string;
          colors?: string[];
          food_suggestions?: string[];
          is_custom?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          opponent?: string;
          colors?: string[];
          food_suggestions?: string[];
          is_custom?: boolean;
          created_at?: string;
        };
      };
      potluck_items: {
        Row: {
          id: string;
          game_id: string;
          name: string;
          category: string;
          quantity: string;
          description?: string;
          assigned_to?: string;
          is_admin_assigned: boolean;
          dietary_flags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          name: string;
          category: string;
          quantity: string;
          description?: string;
          assigned_to?: string;
          is_admin_assigned?: boolean;
          dietary_flags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          name?: string;
          category?: string;
          quantity?: string;
          description?: string;
          assigned_to?: string;
          is_admin_assigned?: boolean;
          dietary_flags?: string[];
          created_at?: string;
        };
      };
    };
  };
}
