-- Add tv_network column to games table if it doesn't exist
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS tv_network TEXT;