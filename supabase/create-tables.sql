-- Create games table if it doesn't exist
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

-- Create themes table if it doesn't exist
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

-- Create potluck_items table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_games_opponent ON games(opponent);
CREATE INDEX IF NOT EXISTS idx_potluck_items_game_id ON potluck_items(game_id);

-- Add RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

CREATE POLICY "Games can be inserted by authenticated users" ON games
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Games can be updated by authenticated users" ON games
    FOR UPDATE USING (true);

CREATE POLICY "Games can be deleted by authenticated users" ON games
    FOR DELETE USING (true);

CREATE POLICY "Themes are viewable by everyone" ON themes
    FOR SELECT USING (true);

CREATE POLICY "Themes can be inserted by authenticated users" ON themes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Potluck items are viewable by everyone" ON potluck_items
    FOR SELECT USING (true);

CREATE POLICY "Potluck items can be inserted by authenticated users" ON potluck_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Potluck items can be updated by authenticated users" ON potluck_items
    FOR UPDATE USING (true);

CREATE POLICY "Potluck items can be deleted by authenticated users" ON potluck_items
    FOR DELETE USING (true);