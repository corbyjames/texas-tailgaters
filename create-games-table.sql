-- RUN THIS FIRST: Create games table
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