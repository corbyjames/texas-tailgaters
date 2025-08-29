-- STEP 1: Create themes table FIRST (run this alone first)
CREATE TABLE themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    opponent TEXT,
    colors TEXT[],
    food_suggestions TEXT[],
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create games table SECOND (run this after themes is created)
CREATE TABLE games (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Create potluck_items table THIRD (run this after games is created)
CREATE TABLE potluck_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity TEXT,
    description TEXT,
    assigned_to TEXT,
    is_admin_assigned BOOLEAN DEFAULT false,
    dietary_flags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Create indexes (run this after all tables are created)
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_opponent ON games(opponent);
CREATE INDEX idx_potluck_items_game_id ON potluck_items(game_id);

-- STEP 5: Enable Row Level Security (run this last)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;

-- Create basic policies for public access
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON games FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete games" ON games FOR DELETE USING (true);

CREATE POLICY "Anyone can view themes" ON themes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert themes" ON themes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view potluck_items" ON potluck_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert potluck_items" ON potluck_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update potluck_items" ON potluck_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete potluck_items" ON potluck_items FOR DELETE USING (true);