# Supabase Database Setup

## Quick Setup

1. Go to your Supabase project dashboard: https://app.supabase.com/project/kvtufvfnlvlqhxcwksja

2. Click on "SQL Editor" in the left sidebar

3. Copy and paste the contents of `supabase/create-tables.sql` into the SQL editor

4. Click "Run" to create all tables and policies

## Manual Table Creation (if SQL doesn't work)

### 1. Games Table
Go to Table Editor and create a new table called `games` with these columns:
- `id` (uuid, primary key, default: gen_random_uuid())
- `date` (date, required)
- `time` (text, nullable)
- `opponent` (text, required)
- `location` (text, nullable)
- `is_home` (boolean, default: false)
- `theme_id` (uuid, foreign key to themes.id, nullable)
- `status` (text, default: 'unplanned')
- `setup_time` (text, nullable)
- `expected_attendance` (int4, default: 0)
- `tv_network` (text, nullable)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### 2. Themes Table
Create a table called `themes` with:
- `id` (uuid, primary key, default: gen_random_uuid())
- `name` (text, required)
- `description` (text, nullable)
- `opponent` (text, nullable)
- `colors` (text[], nullable)
- `food_suggestions` (text[], nullable)
- `is_custom` (boolean, default: false)
- `created_at` (timestamptz, default: now())

### 3. Potluck Items Table
Create a table called `potluck_items` with:
- `id` (uuid, primary key, default: gen_random_uuid())
- `game_id` (uuid, foreign key to games.id, cascade on delete)
- `name` (text, required)
- `category` (text, required)
- `quantity` (text, nullable)
- `description` (text, nullable)
- `assigned_to` (text, nullable)
- `is_admin_assigned` (boolean, default: false)
- `dietary_flags` (text[], nullable)
- `created_at` (timestamptz, default: now())

## Enable Row Level Security (RLS)

For each table, go to the Authentication > Policies section and enable RLS, then add these policies:

### Games Table Policies:
1. **Select Policy**: Enable for ALL, Using: `true`
2. **Insert Policy**: Enable for ALL, With Check: `true`
3. **Update Policy**: Enable for ALL, Using: `true`
4. **Delete Policy**: Enable for ALL, Using: `true`

### Themes Table Policies:
1. **Select Policy**: Enable for ALL, Using: `true`
2. **Insert Policy**: Enable for ALL, With Check: `true`

### Potluck Items Table Policies:
1. **Select Policy**: Enable for ALL, Using: `true`
2. **Insert Policy**: Enable for ALL, With Check: `true`
3. **Update Policy**: Enable for ALL, Using: `true`
4. **Delete Policy**: Enable for ALL, Using: `true`

## Test the Connection

1. Open `test-supabase.html` in your browser
2. Click "Test Connection" - should show success
3. Click "Test Insert Game" - should create and delete a test game
4. Click "Sync First 2025 Game" - should add Ohio State game

## Troubleshooting

### "Failed to sync games" Error
This usually means:
1. Tables don't exist - run the create-tables.sql script
2. RLS policies are blocking access - check the policies above
3. Connection issues - verify your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

### No games showing
1. Click "Sync Schedule" from the Admin page
2. Check browser console for errors
3. Use test-supabase.html to debug

### Authentication issues
The app uses Supabase Auth. Make sure:
1. Authentication is enabled in your Supabase project
2. Email/Password auth is enabled
3. You have created a test user account

## Environment Variables

Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=https://kvtufvfnlvlqhxcwksja.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg
```