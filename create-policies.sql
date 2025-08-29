-- RUN THIS THIRD: Create policies and indexes
-- First create indexes
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_opponent ON games(opponent);
CREATE INDEX idx_potluck_items_game_id ON potluck_items(game_id);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;

-- Create policies for games table
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON games FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete games" ON games FOR DELETE USING (true);

-- Create policies for potluck_items table
CREATE POLICY "Anyone can view potluck_items" ON potluck_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert potluck_items" ON potluck_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update potluck_items" ON potluck_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete potluck_items" ON potluck_items FOR DELETE USING (true);