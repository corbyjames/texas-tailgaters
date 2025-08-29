import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only log in development if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Supabase environment variables are not set!');
    console.warn('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file');
    console.warn('Using hardcoded values as fallback...');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://kvtufvfnlvlqhxcwksja.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg'
);

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
          tv_network?: string;
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
          tv_network?: string;
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
          tv_network?: string;
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
