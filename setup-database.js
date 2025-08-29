import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🔧 Setting up Supabase Database');
console.log('=====================================\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'create-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('⚠️  Note: This script cannot directly execute SQL.');
    console.log('\n📋 Please follow these steps:');
    console.log('=====================================');
    console.log('1. Go to your Supabase dashboard:');
    console.log('   https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
    console.log('\n2. Copy and paste the following SQL:');
    console.log('=====================================\n');
    console.log(sqlContent);
    console.log('\n=====================================');
    console.log('3. Click "Run" to create the tables\n');
    
    // Test if tables exist
    console.log('🔍 Checking if tables exist...\n');
    
    // Check games table
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    if (gamesError) {
      if (gamesError.code === 'PGRST204' || gamesError.message.includes('not found')) {
        console.log('❌ Games table does not exist');
        console.log('   Please create it using the SQL above');
      } else if (gamesError.code === 'PGRST205') {
        console.log('❌ Games table not found in schema');
        console.log('   Error:', gamesError.message);
      } else {
        console.log('⚠️  Games table check error:', gamesError.message);
      }
    } else {
      console.log('✅ Games table exists');
    }
    
    // Check themes table
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('count')
      .limit(1);
    
    if (themesError) {
      if (themesError.code === 'PGRST204' || themesError.message.includes('not found')) {
        console.log('❌ Themes table does not exist');
        console.log('   Please create it using the SQL above');
      } else if (themesError.code === 'PGRST205') {
        console.log('❌ Themes table not found in schema');
        console.log('   Error:', themesError.message);
      } else {
        console.log('⚠️  Themes table check error:', themesError.message);
      }
    } else {
      console.log('✅ Themes table exists');
    }
    
    // Check potluck_items table
    const { data: potluck, error: potluckError } = await supabase
      .from('potluck_items')
      .select('count')
      .limit(1);
    
    if (potluckError) {
      if (potluckError.code === 'PGRST204' || potluckError.message.includes('not found')) {
        console.log('❌ Potluck items table does not exist');
        console.log('   Please create it using the SQL above');
      } else if (potluckError.code === 'PGRST205') {
        console.log('❌ Potluck items table not found in schema');
        console.log('   Error:', potluckError.message);
      } else {
        console.log('⚠️  Potluck items table check error:', potluckError.message);
      }
    } else {
      console.log('✅ Potluck items table exists');
    }
    
    console.log('\n=====================================');
    console.log('📋 Next Steps:');
    console.log('1. If tables don\'t exist, run the SQL in Supabase');
    console.log('2. Then run: npm run dev');
    console.log('3. Login and test the sync functionality');
    
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

setupDatabase().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});