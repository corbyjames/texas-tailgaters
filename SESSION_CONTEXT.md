# Texas Tailgaters App - Session Context

## Current Status
- **Date**: 2025-08-29
- **Project**: Texas Tailgaters (Football tailgate planning app)
- **Repository**: https://github.com/corbyjames/texas-tailgaters
- **Dev Server**: Running on http://localhost:5174/

## Database Setup Progress
### Supabase Configuration
- **URL**: https://kvtufvfnlvlqhxcwksja.supabase.co
- **Project ID**: kvtufvfnlvlqhxcwksja
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg

### Tables Created
✅ **themes** table - CREATED
❌ **games** table - PENDING
❌ **potluck_items** table - PENDING

## Main Issue
The sync functionality is failing because database tables weren't created in Supabase. We're creating them step-by-step.

## Test Credentials
- **Email**: test@texastailgaters.com
- **Password**: TestPassword123!
- **Alternative**: corbyjames@gmail.com / $4Xanadu4M3e

## Next Steps to Complete

### 1. Finish Creating Database Tables
Run these in Supabase SQL Editor (https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new):

**Step 2 - Games Table** (run this next):
```sql
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
```

**Step 3 - Potluck Items Table** (run after games):
```sql
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
```

**Step 4 - Indexes**:
```sql
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_opponent ON games(opponent);
CREATE INDEX idx_potluck_items_game_id ON potluck_items(game_id);
```

**Step 5 - Row Level Security**:
```sql
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;

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
```

### 2. Test Database Persistence
After creating all tables, run:
```bash
node test-persistence.js
```

### 3. Test Sync Functionality
Run the Playwright test:
```bash
npx playwright test tests/debug-sync.spec.ts --headed
```

### 4. Fix Any Remaining Sync Issues
The sync should work once all tables are created. If not, check:
- `/src/services/scheduleSync.ts` - Main sync service
- `/src/services/gameService.ts` - Game service integration
- `/src/hooks/useGames.ts` - React hook for games

## Key Files Created During Session
- `diagnose-supabase.js` - Diagnoses Supabase connection
- `test-persistence.js` - Tests database CRUD operations
- `create-tables-step-by-step.sql` - SQL to create tables one by one
- `tests/debug-sync.spec.ts` - Playwright test for sync functionality
- `verify-supabase-project.js` - Verifies Supabase project configuration
- `quick-create-tables.html` - HTML helper for creating tables

## Git Status
- All changes committed with message: "Add Supabase integration and game management features"
- Pushed to: https://github.com/corbyjames/texas-tailgaters

## Common Commands
```bash
# Check if tables exist
node diagnose-supabase.js

# Test database operations
node test-persistence.js

# Run dev server
npm run dev

# Run sync test
npx playwright test tests/debug-sync.spec.ts --headed

# Check git status
git status
```

## Issues Encountered
1. Initial confusion with marine-life-id project in CLAUDE.md (different project)
2. Tables not existing in Supabase - needed manual creation
3. Cannot create tables programmatically with anon key (requires admin access)
4. Must create tables via Supabase Dashboard SQL editor

## Resume Point
Continue from creating the games and potluck_items tables in Supabase, then test the sync functionality.