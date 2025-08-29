import fetch from 'node-fetch';

const SUPABASE_URL = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🔧 Creating Supabase Tables Directly');
console.log('=====================================\n');

// Read SQL file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, 'supabase', 'create-tables.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Since we can't execute raw SQL with anon key, we'll create tables using REST API
async function createTables() {
  console.log('⚠️  Note: Direct SQL execution requires admin access.');
  console.log('   We\'ll attempt to create tables using Supabase client.\n');
  
  // Import Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Since we can't create tables directly, let's output a curl command that can be run
  console.log('📋 Alternative: Use this curl command to create tables via SQL:');
  console.log('=====================================\n');
  
  const curlCommand = `curl -X POST '${SUPABASE_URL}/rest/v1/rpc/exec_sql' \\
  -H "apikey: ${SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "${sqlContent.replace(/\n/g, ' ').replace(/"/g, '\\"')}"}'`;
  
  console.log('Unfortunately, executing raw SQL requires service role key.');
  console.log('\n🔧 EASIEST SOLUTION:');
  console.log('=====================================');
  console.log('1. Copy this entire SQL block:\n');
  console.log(sqlContent);
  console.log('\n=====================================');
  console.log('2. Go to: https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
  console.log('3. Paste the SQL and click "Run"');
  console.log('\nThis will create all the necessary tables.');
  
  // Let's try a different approach - check if we can at least verify connection
  console.log('\n🔍 Verifying Supabase connection...');
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('❌ Connection error:', error.message);
  } else {
    console.log('✅ Successfully connected to Supabase');
  }
  
  // Since creating tables requires admin access, we need to guide the user
  console.log('\n=====================================');
  console.log('⚠️  IMPORTANT: Tables must be created via Supabase Dashboard');
  console.log('=====================================');
  console.log('\nThe tables required are:');
  console.log('1. themes - Stores tailgate themes');
  console.log('2. games - Stores football games schedule');
  console.log('3. potluck_items - Stores potluck signups');
  console.log('\nAll with proper foreign keys and RLS policies.');
}

createTables().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});