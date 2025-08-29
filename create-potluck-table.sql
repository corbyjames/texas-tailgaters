-- RUN THIS SECOND: Create potluck_items table
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