import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvtufvfnlvlqhxcwksja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHVmdmZubHZscWh4Y3drc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTE3MDgsImV4cCI6MjA3MTk4NzcwOH0.TJk58Dk3rQ7iCF8kZgXy-lP-koVatAGatRibbccy_Lg';

console.log('🔍 Verifying Supabase Project Details');
console.log('=====================================\n');

async function verifyProject() {
  try {
    // 1. Check if the URL is accessible
    console.log('1️⃣ Checking Supabase URL accessibility...');
    console.log('   URL:', supabaseUrl);
    
    try {
      const response = await fetch(supabaseUrl);
      console.log('   Response status:', response.status);
      if (response.status === 200 || response.status === 404) {
        console.log('✅ Supabase URL is accessible');
      }
    } catch (fetchError) {
      console.log('⚠️  Could not reach Supabase URL:', fetchError.message);
    }
    
    // 2. Decode the JWT to see project info
    console.log('\n2️⃣ Decoding JWT token for project info...');
    const parts = supabaseKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('   Project ref:', payload.ref);
      console.log('   Role:', payload.role);
      console.log('   Issued at:', new Date(payload.iat * 1000).toISOString());
      console.log('   Expires at:', new Date(payload.exp * 1000).toISOString());
      
      if (payload.ref === 'kvtufvfnlvlqhxcwksja') {
        console.log('✅ Token matches the project URL');
      } else {
        console.log('❌ Token project ref does not match URL!');
      }
    }
    
    // 3. Test Supabase client connection
    console.log('\n3️⃣ Testing Supabase client connection...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('⚠️  Session error:', sessionError.message);
    } else {
      console.log('✅ Supabase client connected successfully');
    }
    
    // 4. Try to access the REST endpoint directly
    console.log('\n4️⃣ Testing REST API endpoint...');
    const restUrl = `${supabaseUrl}/rest/v1/`;
    
    try {
      const restResponse = await fetch(restUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      console.log('   REST API status:', restResponse.status);
      
      if (restResponse.status === 200) {
        const data = await restResponse.json();
        console.log('✅ REST API is accessible');
        console.log('   Available paths:', Object.keys(data.paths || {}).slice(0, 5).join(', '), '...');
      }
    } catch (restError) {
      console.log('❌ REST API error:', restError.message);
    }
    
    // 5. Try to list tables (this will fail but shows the error)
    console.log('\n5️⃣ Attempting to query tables...');
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    if (gamesError) {
      console.log('❌ Games table error:', gamesError.code, '-', gamesError.message);
      
      if (gamesError.code === 'PGRST205') {
        console.log('\n⚠️  IMPORTANT: The table does not exist in this Supabase project!');
        console.log('\n📋 SOLUTION:');
        console.log('=====================================');
        console.log('You have two options:\n');
        console.log('Option 1: Create tables in THIS project (kvtufvfnlvlqhxcwksja)');
        console.log('   1. Go to: https://app.supabase.com/project/kvtufvfnlvlqhxcwksja/sql/new');
        console.log('   2. Run the SQL from supabase/create-tables.sql\n');
        console.log('Option 2: Use a different Supabase project');
        console.log('   1. Update the .env file with correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
        console.log('   2. Make sure tables exist in that project');
      }
    } else {
      console.log('✅ Games table exists!');
    }
    
    // 6. Check if this might be the wrong project
    console.log('\n6️⃣ Project verification summary:');
    console.log('=====================================');
    console.log('Project ID: kvtufvfnlvlqhxcwksja');
    console.log('URL: https://kvtufvfnlvlqhxcwksja.supabase.co');
    console.log('Status: Connected but tables don\'t exist');
    console.log('\n❓ Is this the correct Supabase project?');
    console.log('   If not, update your .env file with the correct project details.');
    console.log('   If yes, you need to create the tables using the SQL script.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyProject().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});