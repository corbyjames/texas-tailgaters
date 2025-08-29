-- Texas Tailgaters Database Schema
-- Run this entire script in Supabase SQL Editor

-- 1. Create themes table (if not exists)
CREATE TABLE IF NOT EXISTS themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    opponent TEXT,
    colors TEXT[],
    food_suggestions TEXT[],
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time TEXT,
    opponent TEXT NOT NULL,
    location TEXT,
    is_home BOOLEAN DEFAULT false,
    theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'unplanned',
    setup_time TEXT,
    expected_attendance INTEGER DEFAULT 0,
    tv_network TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create potluck_items table
CREATE TABLE IF NOT EXISTS potluck_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity TEXT,
    description TEXT,
    assigned_to TEXT,
    is_admin_assigned BOOLEAN DEFAULT false,
    dietary_flags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_opponent ON games(opponent);
CREATE INDEX IF NOT EXISTS idx_potluck_items_game_id ON potluck_items(game_id);

-- 5. Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;
DROP POLICY IF EXISTS "Games can be inserted by authenticated users" ON games;
DROP POLICY IF EXISTS "Games can be updated by authenticated users" ON games;
DROP POLICY IF EXISTS "Games can be deleted by authenticated users" ON games;
DROP POLICY IF EXISTS "Themes are viewable by everyone" ON themes;
DROP POLICY IF EXISTS "Themes can be inserted by authenticated users" ON themes;
DROP POLICY IF EXISTS "Potluck items are viewable by everyone" ON potluck_items;
DROP POLICY IF EXISTS "Potluck items can be inserted by authenticated users" ON potluck_items;
DROP POLICY IF EXISTS "Potluck items can be updated by authenticated users" ON potluck_items;
DROP POLICY IF EXISTS "Potluck items can be deleted by authenticated users" ON potluck_items;

-- 7. Create RLS policies for public access (development mode)
-- Games policies
CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Games can be inserted by authenticated users" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Games can be updated by authenticated users" ON games FOR UPDATE USING (true);
CREATE POLICY "Games can be deleted by authenticated users" ON games FOR DELETE USING (true);

-- Themes policies
CREATE POLICY "Themes are viewable by everyone" ON themes FOR SELECT USING (true);
CREATE POLICY "Themes can be inserted by authenticated users" ON themes FOR INSERT WITH CHECK (true);

-- Potluck items policies
CREATE POLICY "Potluck items are viewable by everyone" ON potluck_items FOR SELECT USING (true);
CREATE POLICY "Potluck items can be inserted by authenticated users" ON potluck_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Potluck items can be updated by authenticated users" ON potluck_items FOR UPDATE USING (true);
CREATE POLICY "Potluck items can be deleted by authenticated users" ON potluck_items FOR DELETE USING (true);

-- 8. Insert sample theme data for testing
INSERT INTO themes (name, description, opponent, colors, food_suggestions, is_custom)
VALUES 
    ('BBQ Bash', 'Classic Texas BBQ tailgate', 'Oklahoma', ARRAY['#841617', '#FFC72C'], ARRAY['Brisket', 'Ribs', 'Coleslaw', 'Potato Salad'], false),
    ('Tex-Mex Fiesta', 'Mexican-themed tailgate', 'Baylor', ARRAY['#003015', '#FFB81C'], ARRAY['Tacos', 'Queso', 'Guacamole', 'Margaritas'], false)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'All tables created successfully!' as message;