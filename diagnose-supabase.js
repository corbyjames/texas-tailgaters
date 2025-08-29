import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🔍 Diagnosing Supabase Connection');
console.log('=====================================\n');

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

async function diagnose() {
  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Auth connection error:', authError.message);
    } else {
      console.log('✅ Connected to Supabase');
    }
    
    console.log('\n2️⃣ Attempting to query games table...');
    const { data: games, error: gamesError, status, statusText } = await supabase
      .from('games')
      .select('*')
      .limit(1);
    
    console.log('   Status:', status, statusText);
    
    if (gamesError) {
      console.log('❌ Games query error:');
      console.log('   Code:', gamesError.code);
      console.log('   Message:', gamesError.message);
      console.log('   Details:', gamesError.details);
      console.log('   Hint:', gamesError.hint);
      
      if (gamesError.code === 'PGRST205') {
        console.log('\n⚠️  Table not found in schema cache');
        console.log('   This means the table doesn\'t exist in the database');
      }
    } else {
      console.log('✅ Games table exists and is accessible');
      console.log('   Data:', games);
    }
    
    console.log('\n3️⃣ Testing with raw SQL (if available)...');
    // Try using rpc to check if we can execute functions
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('get_tables', {})
      .single();
    
    if (rpcError) {
      if (rpcError.code === 'PGRST202') {
        console.log('ℹ️  No custom functions available (expected)');
      } else {
        console.log('   RPC error:', rpcError.message);
      }
    }
    
    console.log('\n4️⃣ Checking if we need to create tables...');
    console.log('   The error "PGRST205" confirms tables don\'t exist');
    console.log('   We need to create them in Supabase');
    
    console.log('\n5️⃣ Testing if we can create a simple table...');
    // Try to insert into a test table (will fail if doesn't exist)
    const testData = {
      date: '2025-01-01',
      opponent: 'Test Team',
      location: 'Test Stadium',
      is_home: true,
      status: 'test'
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('games')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ Cannot insert - table doesn\'t exist');
      console.log('   Error:', insertError.message);
    } else {
      console.log('✅ Test insert successful');
      // Clean up
      if (insertTest && insertTest[0]) {
        await supabase.from('games').delete().eq('id', insertTest[0].id);
        console.log('   Test data cleaned up');
      }
    }
    
    console.log('\n=====================================');
    console.log('📋 DIAGNOSIS COMPLETE');
    console.log('=====================================');
    console.log('\nPROBLEM: The tables don\'t exist in your Supabase database');
    console.log('\nSOLUTION:');
    console.log('1. Open this link in your browser:');
    console.log('   https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
    console.log('\n2. Copy the SQL from: supabase/create-tables.sql');
    console.log('\n3. Paste it in the SQL editor and click "Run"');
    console.log('\n4. After creating tables, run this script again to verify');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

diagnose().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});